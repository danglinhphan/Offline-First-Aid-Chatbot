import os

def get_short_path_name(long_name_path):
    """
    Trả về đường dẫn ngắn (8.3 format) trên Windows để tránh lỗi ký tự Unicode hoặc khoảng trắng
    trong các thư viện C++ biên dịch (như espeak-ng, sherpa-onnx).
    """
    if os.name != 'nt':
        return long_name_path
    try:
        import ctypes
        from ctypes import wintypes
        _GetShortPathNameW = ctypes.windll.kernel32.GetShortPathNameW
        _GetShortPathNameW.argtypes = [wintypes.LPCWSTR, wintypes.LPWSTR, wintypes.DWORD]
        _GetShortPathNameW.restype = wintypes.DWORD

        buf = ctypes.create_unicode_buffer(1024)
        abs_path = os.path.abspath(long_name_path)
        length = _GetShortPathNameW(abs_path, buf, 1024)
        if length > 0:
            return buf.value
    except Exception:
        pass
    return long_name_path

# Đường dẫn thư mục gốc và các thư mục con
BASE_DIR = get_short_path_name(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
MODELS_DIR = get_short_path_name(os.path.join(BASE_DIR, "models"))
BACKEND_DIR = get_short_path_name(os.path.join(BASE_DIR, "backend"))

# Đường dẫn các mô hình cụ thể
LLM_PATH = os.path.join(MODELS_DIR, "llm", "qwen2.5-0.5b-instruct-q4_k_m.gguf")
EMBEDDING_DIR = os.path.join(MODELS_DIR, "embedding")
GUARDRAILS_DIR = os.path.join(MODELS_DIR, "guardrails")
SPEECH_DIR = os.path.join(MODELS_DIR, "speech")

# Cấu hình RAG
RAG_DATABASE_DIR = os.path.join(BACKEND_DIR, "data", "lancedb")
CHUNK_SIZE = 300
CHUNK_OVERLAP = 25
RAG_SCORE_THRESHOLD = 0.25

# Cấu hình an toàn
LITELMGUARD_THRESHOLD = 0.85
CREST_THRESHOLD = 0.80

# Cấu hình Web Server
HOST = "127.0.0.1"
PORT = 8000

# Cấu hình Ollama
OLLAMA_API_URL = "http://127.0.0.1:11434"
OLLAMA_MODEL_NAME = "qwen2.5:0.5b" # Mặc định dùng bản 0.5B để tương thích tốt thiết bị di động
