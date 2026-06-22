# Trợ Lý Sơ Cứu Y Tế Ngoại Tuyến Đa Tiếp Cận (Offline First-Aid Chatbot)

🌎 [English Version Here](file:///c:/Users/phand/Project/chatbot%20y%20t%E1%BA%BF/README_EN.md)

Hệ thống trợ lý sơ cứu y tế hoạt động **100% ngoại tuyến (Offline Edge AI)** trên thiết bị di động, tích hợp xử lý ngôn ngữ lớn cục bộ (LLM), truy xuất thông tin y khoa lai hợp (Hybrid RAG), nhận dạng và tổng hợp giọng nói tiếng Việt (ASR/TTS) và giao diện trợ năng tương tác đa phương thức đạt tiêu chuẩn quốc tế **WCAG 2.2 AA**.

---

## 🚀 Tính Năng Nổi Bật

- **Màng lọc an toàn 2 lớp (Guardrails)**: Lớp từ khóa kết hợp mô hình học sâu `CREST-Base` chống tấn công bẻ khóa (Jailbreak) và từ chối các yêu cầu ngoài phạm vi y khoa.
- **Truy xuất thông tin lai hợp (Hybrid RAG)**: Sự kết hợp giữa tìm kiếm từ vựng (BM25 Okapi) và tìm kiếm ngữ nghĩa vector (`multilingual-MiniLM-L12-v2` + `LanceDB`) giúp định vị chính xác cẩm nang y khoa sơ cứu.
- **Xử lý LLM Cục bộ**: Tích hợp với `Ollama` chạy mô hình siêu nhỏ `Qwen2.5:0.5B` với độ trễ thấp và cấu hình nhiệt độ (temperature) 0.1 chống ảo tưởng thông tin y khoa. Có cơ chế fallback tự tổng hợp khi mất kết nối LLM.
- **Xử lý âm thanh Offline (Sherpa-ONNX)**: Nhận dạng giọng nói (ASR Zipformer) và tổng hợp giọng nói (TTS VITS) tiếng Việt hoàn toàn ngoại tuyến.
- **Giao diện đa tiếp cận (Accessibility UI)**: Giao diện đạt chuẩn WCAG 2.2 AA hỗ trợ người cao tuổi/người khuyết tật với các chế độ: phóng to chữ 200%, tương phản màu sắc cao, Karaoke highlight chạy chữ đồng bộ giọng nói, phản hồi rung haptic và vùng nút chạm >80px.

---

## 📂 Cấu Trúc Thư Mục Dự Án

```text
├── backend/
│   ├── core/
│   │   ├── config.py         # Cấu hình đường dẫn, hằng số và hầm Windows 8.3 path
│   │   ├── guardrails.py      # Lớp màng lọc an toàn (CREST-Base & Regex)
│   │   ├── llm.py            # Kết nối Ollama và Bộ tổng hợp Fallback
│   │   ├── rag.py            # Động cơ tìm kiếm lai hợp BM25 + LanceDB
│   │   └── speech.py         # Bộ giải mã/tổng hợp giọng nói (Sherpa-ONNX)
│   ├── data/
│   │   └── first_aid_data.json # Cơ sở dữ liệu 7 ca sơ cứu y khoa nền tảng
│   ├── tests/
│   │   ├── test_e2e.py       # Kiểm thử API End-To-End (FastAPI TestClient)
│   │   ├── test_quality_metrics.py # Unit tests chất lượng truy xuất RAG
│   │   └── benchmark_medical_eval.py # Đánh giá chất lượng RAG trên 41 ca mẫu
│   ├── requirements.txt      # Thư viện Python phụ thuộc
│   └── app.py                # Điểm khởi chạy FastAPI Web Server
├── frontend/
│   ├── app/                  # Các trang Next.js (App Router) và globals.css
│   ├── components/           # Component UI trợ năng (ActionBar, ChatWindow...)
│   ├── hooks/                # Custom React hooks (Accessibility states)
│   ├── lib/                  # modelService.ts (Chuyển mạch ngoại tuyến & Fallback JS)
│   └── package.json          # Thư viện npm/pnpm phụ thuộc
├── models/
│   └── download_models.py    # Script tự động tải các mô hình AI từ Hugging Face
└── Nghiên Cứu Chatbot Y Tế.md # Bài báo nghiên cứu khoa học song ngữ Q1
```

---

## 🛠️ Hướng Dẫn Cài Đặt & Khởi Chạy

### Bước 1: Khởi tạo Môi trường Python & Tải mô hình
1. Cài đặt Python (khuyên dùng bản 3.10 - 3.12).
2. Tạo và kích hoạt môi trường ảo:
   ```powershell
   python -m venv .venv
   .\.venv\Scripts\activate
   ```
3. Cài đặt các thư viện phụ thuộc:
   ```powershell
   pip install -r backend/requirements.txt
   ```
4. Chạy script tải các mô hình AI:
   ```powershell
   python models/download_models.py
   ```

### Bước 2: Khởi chạy Ollama
1. Tải và cài đặt [Ollama](https://ollama.com/).
2. Tải mô hình Qwen2.5-0.5B:
   ```powershell
   ollama pull qwen2.5:0.5b
   ```

### Bước 3: Khởi chạy Backend FastAPI
```powershell
$env:PYTHONIOENCODING="utf-8"
python backend/app.py
```
Backend sẽ khởi động tại `http://127.0.0.1:8000`. Bạn có thể truy cập tài liệu API Swagger tại `http://127.0.0.1:8000/docs`.

### Bước 4: Khởi chạy Frontend Next.js
1. Di chuyển vào thư mục frontend:
   ```powershell
   cd frontend
   ```
2. Cài đặt các thư viện npm (khuyên dùng `pnpm` hoặc `npm`):
   ```powershell
   pnpm install
   ```
3. Chạy môi trường phát triển:
   ```powershell
   pnpm dev
   ```
Frontend sẽ chạy tại `http://localhost:3000`.

---

## 🧪 Quy Trình Chạy Kiểm Thử & Đánh Giá

Nhà phát triển bắt buộc phải chạy các kịch bản kiểm thử sau khi sửa đổi thuật toán tìm kiếm RAG hoặc tri thức y khoa:

- **E2E API Testing**:
  ```powershell
  $env:PYTHONIOENCODING="utf-8"; .\.venv\Scripts\python.exe backend/tests/test_e2e.py
  ```
- **RAG Accuracy Benchmark**:
  ```powershell
  $env:PYTHONIOENCODING="utf-8"; .\.venv\Scripts\python.exe backend/tests/benchmark_medical_eval.py
  ```

---

## 📖 Báo Cáo Nghiên Cứu & Bảo Trì
- **Hướng dẫn bảo trì & Sửa lỗi LanceDB**: Xem chi tiết tại [technical_report.md](file:///c:/Users/phand/Project/chatbot%20y%20t%E1%BA%BF/technical_report.md) (hoặc bản tiếng Anh [technical_report_EN.md](file:///c:/Users/phand/Project/chatbot%20y%20t%E1%BA%BF/technical_report_EN.md)).
- **Bộ Paper Khoa học Q1 song ngữ (Anh-Việt)**: Xem tại [Scientific_Paper_VI.md](file:///c:/Users/phand/Project/chatbot%20y%20t%E1%BA%BF/Scientific_Paper_VI.md) và [Scientific_Paper_EN.md](file:///c:/Users/phand/Project/chatbot%20y%20t%E1%BA%BF/Scientific_Paper_EN.md) trong thư mục gốc.
