import os
import re
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

# Các mẫu bẻ khóa hệ thống (Jailbreak / Prompt Injection)
JAILBREAK_PATTERNS = [
    r"ignore\s+previous",
    r"quên\s+đi\s+(vai\s+trò|nhiệm\s+vụ|chỉ\s+dẫn)",
    r"bỏ\s+qua\s+các\s+(hướng\s+dẫn|chỉ\s+dẫn)",
    r"lập\s+trình\s+lại",
    r"hãy\s+đóng\s+vai",
    r"system\s+override",
    r"prompt\s+injection",
    r"từ\s+bỏ\s+màng\s+lọc",
    r"hack\s+chatbot",
    r"you\s+are\s+now"
]

# Các từ khóa ngoài phạm vi sơ cứu y tế
OUT_OF_SCOPE_WORDS = [
    "lập trình", "code", "python", "javascript", "html", "css", "c++", "java", "react", "nextjs", "typescript",
    "toán học", "giải phương trình", "tính tích phân", "vật lý", "hóa học", "địa lý", "lịch sử",
    "chính trị", "đảng cộng sản", "nhà nước", "bầu cử", "tôn giáo", "chính phủ",
    "mua bán", "giá tiền", "quảng cáo", "khuyến mãi", "shopee", "lazada", "bitcoin", "tiền điện tử",
    "phim ảnh", "ca nhạc", "game", "nấu ăn", "công thức bánh", "du lịch"
]

# Từ khóa y tế hợp lệ
VALID_MEDICAL_KEYWORDS = [
    "đau", "sốt", "máu", "thở", "nghẹn", "hóc", "sặc", "tim", "phổi", "bỏng", "đột quỵ", "tai biến",
    "rắn", "cắn", "chấn thương", "gãy", "vết thương", "sơ cứu", "cấp cứu", "băng", "thuốc",
    "đầu", "bụng", "ngực", "tay", "chân", "nôn", "chóng mặt", "ngất", "bất tỉnh", "co giật",
    "tâm lý", "lo âu", "sợ", "hoảng", "sốc", "khóc", "an ủi", "cứu"
]

class SafetyGuardrail:
    def __init__(self):
        self.classifier = None
        self.is_model_loaded = False
        self._load_model()

    def _load_model(self):
        """
        Tải mô hình phân loại an toàn học sâu từ thư mục cục bộ models.
        """
        try:
            # Import transformers khi khởi tạo để tránh làm chậm startup nếu không cần
            from transformers import pipeline
            from backend.core.config import GUARDRAILS_DIR

            config_path = os.path.join(GUARDRAILS_DIR, "config.json")
            if os.path.exists(config_path):
                logger.info(f"Đang tải mô hình học sâu Guardrails từ: {GUARDRAILS_DIR}...")
                self.classifier = pipeline(
                    "text-classification",
                    model=GUARDRAILS_DIR,
                    tokenizer=GUARDRAILS_DIR,
                    device=-1  # Chạy trên CPU để tiết kiệm VRAM
                )
                self.is_model_loaded = True
                logger.info("Màng lọc bảo vệ học sâu CREST-Base đã được tải thành công.")
            else:
                logger.warning(f"Không tìm thấy file cấu hình tại {config_path}. Sử dụng màng lọc từ khóa/regex.")
        except Exception as e:
            logger.warning(f"Chưa có mô hình học sâu Guardrails hoặc lỗi khởi tạo ({e}). Sử dụng màng lọc từ khóa/regex.")

    def check_safety(self, query: str) -> Dict[str, Any]:
        """
        Kiểm tra an toàn 2 lớp:
        Lớp 1: Bộ lọc Regex & Từ khóa nhanh (tiết kiệm CPU).
        Lớp 2: Mô hình học sâu phân loại ý đồ / bẻ khóa (Adversarial attack/Jailbreak).
        """
        if not query or not query.strip():
            return {"is_safe": True}

        normalized = query.lower().strip()

        # --- LỚP 1: BỘ LỌC REGEX & KEYWORDS ---
        # 1. Kiểm tra Jailbreak / Prompt Injection lộ liễu
        for pattern in JAILBREAK_PATTERNS:
            if re.search(pattern, normalized):
                return {
                    "is_safe": False,
                    "reason": "jailbreak",
                    "message": "⚠️ CẢNH BÁO AN NINH: Phát hiện nỗ lực thay đổi cấu hình hệ thống. Yêu cầu bị chặn ngay lập tức."
                }

        # 2. Kiểm tra Out of Scope (Không liên quan y tế)
        has_out_of_scope = any(word in normalized for word in OUT_OF_SCOPE_WORDS)
        if has_out_of_scope:
            has_valid_medical = any(med in normalized for med in VALID_MEDICAL_KEYWORDS)
            if not has_valid_medical:
                return {
                    "is_safe": False,
                    "reason": "out_of_scope",
                    "message": "Trợ lý y tế chỉ hỗ trợ cung cấp các hướng dẫn sơ cứu khẩn cấp và tư vấn sức khỏe ban đầu. Yêu cầu của bạn nằm ngoài phạm vi hoạt động của hệ thống."
                }

        # 3. Kiểm tra tính liên quan y tế chung
        words = normalized.split()
        if len(words) > 3:
            has_any_med = any(med in normalized for med in VALID_MEDICAL_KEYWORDS)
            if not has_any_med:
                general_convo = ["xin chào", "hello", "chào bạn", "ai đó", "bạn là ai", "giúp", "cứu tôi"]
                is_general = any(c in normalized for c in general_convo)
                if not is_general:
                    return {
                        "is_safe": False,
                        "reason": "out_of_scope",
                        "message": "Xin chào. Trợ lý y tế sơ cứu ngoại tuyến ở đây để trợ giúp bạn trong các tình huống khẩn cấp (như ngừng tim, chảy máu, bỏng, hóc dị vật...). Xin vui lòng mô tả triệu chứng hoặc yêu cầu liên quan đến sơ cứu y tế."
                    }

        # --- LỚP 2: MÀNG LỌC HỌC SÂU (CREST-Base) ---
        if self.is_model_loaded and self.classifier:
            try:
                from backend.core.config import CREST_THRESHOLD
                res = self.classifier(query)[0]
                label = res["label"].lower()
                score = res["score"]
                logger.info(f"Kết quả phân tích an toàn học sâu: label={label}, score={score:.4f}")
                
                # CREST-Base phân loại nhị phân: label_1 (hoặc unsafe/conflict) là độc hại/bẻ khóa
                is_attack = "label_1" in label or "unsafe" in label or "conflict" in label or "attack" in label
                
                if is_attack and score >= CREST_THRESHOLD:
                    logger.warning(f"Truy vấn bị chặn bởi mô hình CREST-Base (Độ tin cậy: {score:.2f})")
                    return {
                        "is_safe": False,
                        "reason": "jailbreak_deep_learning",
                        "message": "⚠️ CẢNH BÁO AN NINH: Phát hiện ý đồ truy vấn không an toàn hoặc bẻ khóa hệ thống. Yêu cầu bị từ chối."
                    }
            except Exception as e:
                logger.error(f"Lỗi khi chạy mô hình học sâu Guardrail: {e}")

        return {"is_safe": True}

# Singleton instance
guardrail = SafetyGuardrail()
