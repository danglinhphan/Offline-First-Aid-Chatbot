import os
import sys
import requests
from huggingface_hub import snapshot_download

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, "models")

PATHS = {
    "embedding": os.path.join(MODELS_DIR, "embedding"),
    "guardrails": os.path.join(MODELS_DIR, "guardrails"),
    "speech_stt": os.path.join(MODELS_DIR, "speech", "zipformer-vi"),
    "speech_tts": os.path.join(MODELS_DIR, "speech", "vits-vi")
}

def create_directories():
    for name, path in PATHS.items():
        os.makedirs(path, exist_ok=True)
        print(f"Đã tạo thư mục: {path}")

def pull_ollama_model():
    print("\n--- Đang kiểm tra và tải mô hình Qwen qua Ollama... ---")
    ollama_url = "http://127.0.0.1:11434/api/pull"
    model_name = "qwen2.5:0.5b"
    try:
        # Kiểm tra xem Ollama có đang chạy không
        res = requests.get("http://127.0.0.1:11434/", timeout=2)
        if res.status_code == 200:
            print(f"Phát hiện Ollama đang hoạt động. Đang gửi yêu cầu tải {model_name}...")
            # Gửi yêu cầu pull model
            pull_res = requests.post(ollama_url, json={"name": model_name, "stream": False}, timeout=180)
            if pull_res.status_code == 200:
                print(f"Tải thành công mô hình {model_name} qua Ollama.")
            else:
                print(f"Không thể pull model Ollama: {pull_res.text}")
        else:
            print("Ollama không trả về trạng thái 200.")
    except requests.exceptions.ConnectionError:
        print("CẢNH BÁO: Không kết nối được với Ollama (127.0.0.1:11434). Hãy đảm bảo Ollama đã được bật và chạy nền trước khi sử dụng chatbot.")
    except Exception as e:
        print(f"Lỗi khi cấu hình Ollama: {e}")

def download_embedding():
    print("\n--- Đang tải mô hình Embedding (multilingual-MiniLM-L12)... ---")
    try:
        snapshot_download(
            repo_id="sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2",
            local_dir=PATHS["embedding"],
            local_dir_use_symlinks=False
        )
        print(f"Tải xong Embedding tại: {PATHS['embedding']}")
    except Exception as e:
        print(f"Lỗi khi tải Embedding: {e}")

def download_guardrails():
    print("\n--- Đang tải mô hình Guardrails (CREST-Base)... ---")
    try:
        snapshot_download(
            repo_id="repelloai/CREST-Base",
            local_dir=PATHS["guardrails"],
            local_dir_use_symlinks=False
        )
        print(f"Tải xong Guardrails tại: {PATHS['guardrails']}")
    except Exception as e:
        print(f"Lỗi khi tải Guardrails: {e}")

def download_speech_stt():
    print("\n--- Đang tải mô hình STT (Sherpa-ONNX Zipformer Tiếng Việt)... ---")
    try:
        snapshot_download(
            repo_id="csukuangfj/sherpa-onnx-zipformer-vi-2025-04-20",
            local_dir=PATHS["speech_stt"],
            local_dir_use_symlinks=False
        )
        print(f"Tải xong STT tại: {PATHS['speech_stt']}")
    except Exception as e:
        print(f"Lỗi khi tải STT: {e}")

def download_speech_tts():
    print("\n--- Đang tải mô hình TTS (VITS Tiếng Việt ONNX)... ---")
    try:
        snapshot_download(
            repo_id="csukuangfj/vits-piper-vi_VN-vivos-x_low",
            local_dir=PATHS["speech_tts"],
            local_dir_use_symlinks=False
        )
        print(f"Tải xong TTS tại: {PATHS['speech_tts']}")
    except Exception as e:
        print(f"Lỗi khi tải TTS: {e}")

def main():
    print("=================================================================")
    print("Khởi động trình tải mô hình ngoại tuyến SOTA cho Chatbot Y Tế...")
    print("=================================================================")
    create_directories()
    
    # Tải các mô hình offline từ Hugging Face
    download_embedding()
    download_guardrails()
    download_speech_stt()
    download_speech_tts()
    
    # Kiểm tra và tải mô hình Ollama
    pull_ollama_model()
    
    print("\nQuá trình tải hoàn tất! Tất cả mô hình học sâu SOTA đã sẵn sàng hoạt động ngoại tuyến.")

if __name__ == "__main__":
    main()
