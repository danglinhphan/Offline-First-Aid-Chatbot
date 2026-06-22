import os
import logging
import requests
from typing import Dict, Any, Optional
from backend.core.config import OLLAMA_API_URL, OLLAMA_MODEL_NAME

logger = logging.getLogger(__name__)

# System Prompt căn chỉnh hành vi mô hình
SYSTEM_PROMPT = """Bạn là một trợ lý sơ cứu y tế ngoại tuyến khẩn cấp. Nhiệm vụ của bạn là chỉ dẫn người dùng sơ cứu kịp thời, an toàn.
Bạn CHỈ được phép trả lời dựa trên thông tin ngữ cảnh y khoa (RAG Context) được cung cấp. Không tự ý suy diễn hoặc khuyên dùng thuốc ngoài chỉ dẫn.
Mọi câu trả lời của bạn BẮT BUỘC phải tuân thủ đúng cấu trúc 3 phần sau:
🚨 HÀNH ĐỘNG KHẨN CẤP CẦN LÀM NGAY:
[Tóm tắt ngắn gọn việc nguy cấp cần làm trong 1-2 câu]

📋 CÁC BƯỚC SƠ CỨU CHI TIẾT:
1. [Bước 1...]
2. [Bước 2...]

📚 NGUỒN TÀI LIỆU THAM KHẢO:
[Liệt kê nguồn tài liệu từ Context]"""

class OfflineLLM:
    def __init__(self):
        self.is_model_loaded = False
        self._load_model()

    def _load_model(self):
        """
        Kiểm tra trạng thái kết nối tới dịch vụ Ollama cục bộ.
        """
        try:
            res = requests.get(OLLAMA_API_URL, timeout=2)
            if res.status_code == 200:
                tags_res = requests.get(f"{OLLAMA_API_URL}/api/tags", timeout=2)
                if tags_res.status_code == 200:
                    models = [m["name"] for m in tags_res.json().get("models", [])]
                    # Hỗ trợ cả trường hợp so khớp tương đối như qwen2.5:0.5b hoặc qwen2.5:0.5b-instruct
                    if any(OLLAMA_MODEL_NAME in name or name in OLLAMA_MODEL_NAME for name in models):
                        self.is_model_loaded = True
                        logger.info(f"Ollama sẵn sàng hoạt động với mô hình {OLLAMA_MODEL_NAME}.")
                    else:
                        logger.warning(f"Ollama đang chạy nhưng chưa tải mô hình {OLLAMA_MODEL_NAME}. Sẽ tự động pull ở bước tải mô hình.")
                        self.is_model_loaded = True # Vẫn kích hoạt để thử gọi nếu cần
                else:
                    self.is_model_loaded = True
                    logger.info("Ollama đang hoạt động.")
            else:
                logger.warning("Không nhận được phản hồi tốt từ Ollama. Sử dụng bộ tổng hợp fallback.")
        except Exception as e:
            logger.warning(f"Chưa bật Ollama tại {OLLAMA_API_URL} ({e}). Chatbot sẽ tự động dùng bộ tổng hợp RAG Fallback.")

    def generate_response(self, query: str, context_doc: Optional[Dict[str, Any]]) -> str:
        """
        Sinh câu trả lời từ Ollama (hoặc bộ tổng hợp fallback nếu Ollama chưa được bật).
        """
        if not context_doc:
            # Trường hợp không tìm thấy tài liệu liên quan
            return self._get_fallback_general_response(query)

        # Định dạng prompt ngữ cảnh cho mô hình
        prompt = f"Ngữ cảnh y khoa (RAG Context):\nTiêu đề: {context_doc['title']}\nHành động khẩn cấp: {context_doc['emergencyAction']}\nCác bước sơ cứu: {' | '.join(context_doc['detailedSteps'])}\nNguồn tham khảo: {context_doc['references']}\n\nYêu cầu sơ cứu của người dùng: {query}"

        # 1. Thử gọi mô hình qua Ollama nếu sẵn sàng
        try:
            payload = {
                "model": OLLAMA_MODEL_NAME,
                "prompt": prompt,
                "system": SYSTEM_PROMPT,
                "stream": False,
                "options": {
                    "temperature": 0.1,  # Giảm tính sáng tạo để đảm bảo câu trả lời chuẩn xác y khoa
                    "num_ctx": 2048
                }
            }
            logger.info(f"Đang sinh câu trả lời bằng Ollama model: {OLLAMA_MODEL_NAME}...")
            res = requests.post(f"{OLLAMA_API_URL}/api/generate", json=payload, timeout=15)
            if res.status_code == 200:
                response_text = res.json().get("response", "").strip()
                if response_text:
                    return response_text
        except Exception as e:
            logger.error(f"Lỗi khi kết nối suy luận qua Ollama API: {e}. Đang chuyển hướng sang bộ tổng hợp Fallback...")

        # --- FALLBACK SYNTHESIZER ---
        # Tự động định dạng câu trả lời đạt tiêu chuẩn y khoa dựa trên tài liệu nếu mất kết nối LLM
        logger.info("Đang sinh câu trả lời bằng bộ tổng hợp Fallback...")
        formatted_steps = "\n".join([f"{i+1}. {step}" for i, step in enumerate(context_doc["detailedSteps"])])
        
        return f"""🚨 HÀNH ĐỘNG KHẨN CẤP CẦN LÀM NGAY:
{context_doc['emergencyAction']}

📋 CÁC BƯỚC SƠ CỨU CHI TIẾT:
{formatted_steps}

📚 NGUỒN TÀI LIỆU THAM KHẢO:
{context_doc['references']}"""

    def _get_fallback_general_response(self, query: str) -> str:
        """
        Câu trả lời chung khi không tìm thấy tài liệu khớp.
        """
        return f"""Xin chào! Trợ lý sơ cứu y tế ngoại tuyến đã nhận được câu hỏi của bạn: "{query}".

Tuy nhiên, thông tin này chưa khớp với các cẩm nang sơ cứu khẩn cấp cụ thể trong kho dữ liệu ngoại tuyến hiện tại.

Để nhận chỉ dẫn sơ cứu chính xác nhất, bạn vui lòng hỏi về các tình huống khẩn cấp sau:
- Hồi sức tim phổi (CPR) / Ngừng tim ngưng thở
- Chảy máu nghiêm trọng / Cách cầm máu vết thương
- Hóc dị vật đường thở (Thủ thuật Heimlich)
- Vết bỏng nhiệt (nước sôi, lửa)
- Nhận biết Đột quỵ (Quy tắc FAST)
- Sơ cứu khi bị Rắn cắn
- Hỗ trợ tâm lý ban đầu cho người hoảng loạn

Nếu tình trạng nghiêm trọng, hãy gọi ngay cấp cứu 115 lập tức!"""

# Singleton instance
llm_client = OfflineLLM()
