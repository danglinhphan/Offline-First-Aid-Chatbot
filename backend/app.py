import base64
import logging
from fastapi import FastAPI, UploadFile, File, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from backend.core.guardrails import guardrail
from backend.core.rag import rag_engine
from backend.core.llm import llm_client
from backend.core.speech import speech_manager
from backend.core.config import HOST, PORT

# Cấu hình logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Trợ lý Sơ cứu Y tế Ngoại tuyến API",
    description="Backend API phục vụ mô hình ngôn ngữ nhỏ lượng hóa, RAG y tế, STT và TTS.",
    version="1.0.0"
)

# Cấu hình CORS để Next.js frontend truy cập được
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Cho phép tất cả nguồn ở chế độ chạy offline
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    query: str

class ChatResponse(BaseModel):
    text: str
    isSafe: bool
    caseKey: str

@app.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """
    Endpoint xử lý trò chuyện sơ cứu y tế.
    """
    query = request.query
    logger.info(f"Nhận truy vấn chat: '{query}'")

    # 1. Chạy qua màng lọc bảo vệ
    safety_result = guardrail.check_safety(query)
    if not safety_result["is_safe"]:
        logger.warning(f"Truy vấn bị chặn bởi màng lọc: {safety_result.get('reason')}")
        return ChatResponse(
            text=safety_result.get("message", "⚠️ Yêu cầu bị chặn vì lý do an toàn."),
            isSafe=False,
            caseKey="general"
        )

    # 2. Truy xuất RAG y khoa
    context_doc = rag_engine.query(query)

    # 3. Tạo câu trả lời bằng LLM
    response_text = llm_client.generate_response(query, context_doc)

    case_key = context_doc["caseKey"] if context_doc else "general"
    
    return ChatResponse(
        text=response_text,
        isSafe=True,
        caseKey=case_key
    )

@app.post("/api/stt")
async def stt_endpoint(file: UploadFile = File(...)):
    """
    Endpoint nhận file âm thanh và chuyển thành chữ (Speech-To-Text).
    """
    try:
        audio_data = await file.read()
        logger.info(f"Nhận file âm thanh STT: {file.filename} (Kích thước: {len(audio_data)} bytes)")
        
        text = speech_manager.transcribe_audio(audio_data)
        return {"text": text}
    except Exception as e:
        logger.error(f"Lỗi xử lý STT: {e}")
        raise HTTPException(status_code=500, detail=f"Lỗi nhận dạng giọng nói: {str(e)}")

@app.get("/api/tts")
async def tts_endpoint(text: str = Query(..., description="Văn bản cần đọc")):
    """
    Endpoint tổng hợp giọng nói tiếng Việt (Text-To-Speech).
    Trả về dữ liệu âm thanh base64 WAV và danh sách timestamps của từng từ.
    """
    try:
        logger.info(f"Nhận yêu cầu TTS cho văn bản: '{text[:30]}...'")
        wav_data, timestamps = speech_manager.synthesize_speech(text)
        
        # Mã hóa base64 luồng WAV để gửi trong JSON
        audio_base64 = base64.b64encode(wav_data).decode("utf-8")
        
        return {
            "audio": audio_base64,
            "timestamps": timestamps
        }
    except Exception as e:
        logger.error(f"Lỗi xử lý TTS: {e}")
        raise HTTPException(status_code=500, detail=f"Lỗi tổng hợp giọng nói: {str(e)}")

@app.get("/api/health")
async def health_endpoint():
    """
    Kiểm tra trạng thái hoạt động của hệ thống.
    """
    return {
        "status": "healthy",
        "llm_loaded": llm_client.is_model_loaded,
        "stt_loaded": speech_manager.is_stt_loaded,
        "tts_loaded": speech_manager.is_tts_loaded,
        "rag_docs_count": len(rag_engine.documents)
    }

if __name__ == "__main__":
    import uvicorn
    # Tự động phát hiện cách chạy để nạp đúng module cho uvicorn
    module_str = "backend.app:app" if __package__ or os.path.exists("backend") else "app:app"
    uvicorn.run(module_str, host=HOST, port=PORT, reload=True)
