# Báo Cáo Kỹ Thuật / Technical Report

* [Tiếng Việt / Vietnamese Version](#tiếng-việt)
* [English Version](#english-version)

---

## Tiếng Việt

# Báo Cáo Kỹ Thuật: Hướng Dẫn Kiến Trúc Và Bảo Trì Hệ Thống Trợ Lý Y Tế Ngoại Tuyến

Tài liệu này cung cấp cái nhìn chi tiết về kiến trúc phần mềm, cấu trúc luồng dữ liệu, chi tiết triển khai các mô hình AI cục bộ và hướng dẫn quy trình bảo trì, mở rộng hệ thống dành cho các nhà phát triển.

---

### 1. Kiến Trúc Hệ Thống Tổng Thể

Hệ thống được thiết kế theo mô hình **Client-Server cục bộ**. Khi chạy trên di động thực tế, server Python này sẽ được đóng gói hoặc dịch ngược thành các thư viện nhị phân chạy trực tiếp trên thiết bị (hoặc chạy qua một Webview lai hợp).

#### Biểu đồ luồng dữ liệu (Data Flow Diagram)

```mermaid
sequenceDiagram
    autonumber
    actor User as Người dùng (User)
    participant FE as Next.js Frontend
    participant BE as FastAPI Backend
    participant Guard as Guardrails (CREST-Base)
    participant RAG as RAG Engine (BM25 + LanceDB)
    participant LLM as Ollama / Local Fallback
    participant Speech as Sherpa-ONNX (ASR/TTS)

    User->>FE: Gửi giọng nói (Hold-to-Talk)
    FE->>BE: POST /api/stt (Audio binary)
    BE->>Speech: Giải mã ASR (Zipformer-vi)
    Speech-->>BE: Trả về văn bản truy vấn
    BE-->>FE: Trả về văn bản
    FE->>BE: POST /api/chat {"query": text}
    
    BE->>Guard: Kiểm tra an ninh (Regex + CREST-Base)
    alt Không an toàn (Jailbreak / Out of Scope)
        Guard-->>BE: Chặn & từ chối
        BE-->>FE: Phản hồi cảnh báo an toàn
    else Hợp lệ (Safe)
        BE->>RAG: Tìm kiếm tài liệu sơ cứu
        RAG->>RAG: BM25 lọc + Vector Reranking
        RAG-->>BE: Trả về Context y khoa
        BE->>LLM: Sinh phản hồi (Qwen2.5 / Fallback)
        LLM-->>BE: Câu trả lời cấu trúc 3 phần
        BE-->>FE: Trả về nội dung text
    end
    
    FE->>BE: GET /api/tts?text=... (Yêu cầu giọng đọc)
    BE->>Speech: Tổng hợp TTS (VITS-vi)
    Speech-->>BE: Trả về WAV + Timestamps từng từ
    BE-->>FE: Trả về Base64 WAV + Timestamps
    FE->>User: Phát âm thanh + Karaoke Text Highlight + SVG visual guide
```

---

### 2. Chi Tiết Triển Khai Các Thành Phần Lõi (Core Codebase)

#### 2.1. Cấu Hình Hệ Thống (`config.py`)
Nằm tại [config.py](file:///c:/Users/phand/Project/chatbot%20y%20t%E1%BA%BF/backend/core/config.py), file này quản lý mọi hằng số đường dẫn và ngưỡng kích hoạt (Thresholds).
- **Hàm `get_short_path_name`**: Rất quan trọng trên hệ điều hành Windows, giúp chuyển đổi các đường dẫn dài chứa dấu tiếng Việt hoặc khoảng trắng thành định dạng `8.3 format` (ví dụ: `chatbot~1`). Điều này ngăn chặn lỗi sập (crash) từ nhân C++ của thư viện `sherpa-onnx` hoặc `espeak-ng`.
- **Định dạng dữ liệu**: Thiết lập phân đoạn chunk RAG (`CHUNK_SIZE = 300`, `CHUNK_OVERLAP = 25`).

#### 2.2. Màng Lọc Bảo Vệ (`guardrails.py`)
Nằm tại [guardrails.py](file:///c:/Users/phand/Project/chatbot%20y%20t%E1%BA%BF/backend/core/guardrails.py), gồm cơ chế phòng vệ 2 lớp:
- **Lớp 1 (Regex & Từ khóa)**: Phát hiện nhanh bẻ khóa hệ thống (Jailbreak) và tự lọc các câu hỏi hoàn toàn ngoài lề (lập trình, chính trị, mua bán...) để tiết kiệm năng lượng tính toán CPU.
- **Lớp 2 (Học sâu)**: Sử dụng mô hình `repelloai/CREST-Base` (mô hình phân loại đa ngôn ngữ an toàn hệ thống) để phát hiện các cuộc tấn công bẻ khóa tinh vi dùng từ lóng hoặc trộn đa ngôn ngữ Anh-Việt.

#### 2.3. Động Cơ RAG (`rag.py`)
Nằm tại [rag.py](file:///c:/Users/phand/Project/chatbot%20y%20t%E1%BA%BF/backend/core/rag.py), thực hiện tìm kiếm lai hợp:
- **BM25 Okapi**: Tiền lọc từ vựng nhanh trên tập tài liệu sơ cứu.
- **LanceDB & sentence-transformers**: Tính toán độ tương đồng không gian vector bằng mô hình `multilingual-MiniLM-L12-v2`.
- **Heuristic bổ trợ**: Chứa ánh xạ từ đồng nghĩa (`SYNONYM_MAP` như *ngộp -> sặc, hóc*) và bộ định tuyến trực tiếp (`_detect_direct_medical_signal`) để tự động bắt nhanh các tình huống chí mạng (ngừng thở, bỏng sâu, đột quỵ) với độ trễ gần như bằng 0.

#### 2.4. Kết Nối LLM & Fallback (`llm.py`)
Nằm tại [llm.py](file:///c:/Users/phand/Project/chatbot%20y%20t%E1%BA%BF/backend/core/llm.py), chịu trách nhiệm sinh phản hồi:
- **System Prompt**: Cân chỉnh mô hình Qwen chỉ trả lời dựa vào ngữ cảnh (RAG Context) và bắt buộc định dạng câu trả lời thành 3 phần rõ rệt:
  1. 🚨 HÀNH ĐỘNG KHẨN CẤP CẦN LÀM NGAY
  2. 📋 CÁC BƯỚC SƠ CỨU CHI TIẾT
  3. 📚 NGUỒN TÀI LIỆU THAM KHẢO
- **Màng lọc dự phòng (Fallback Synthesizer)**: Nếu không kết nối được với dịch vụ Ollama cục bộ, hệ thống sẽ tự động tổng hợp thông tin thô từ tài liệu RAG thành đúng cấu trúc 3 phần trên để trả về cho người dùng mà không gây gián đoạn hệ thống.

#### 2.5. Xử Lý Giọng Nói Offline (`speech.py`)
Nằm tại [speech.py](file:///c:/Users/phand/Project/chatbot%20y%20t%E1%BA%BF/backend/core/speech.py), là thành phần SOTA về trợ năng:
- **ASR (STT)**: Nạp mô hình Zipformer tiếng Việt thông qua `sherpa-onnx` để nhận dạng khẩu ngữ địa phương hoặc các câu nói ngập ngừng lúc hoảng loạn.
- **TTS**: Sử dụng mô hình VITS tiếng Việt, tạo ra giọng đọc tự nhiên. Hàm sinh âm thanh trả về danh sách `timestamps` chứa thời điểm bắt đầu và thời lượng của từng từ (`word_duration`).
- **Karaoke Highlight**: Khung frontend nhận `timestamps` này để tô sáng màu chữ chuyển động theo tốc độ giọng đọc thời gian thực.

---

### 3. Hướng Dẫn Bảo Trì & Phát Triển Tiếp Cận

#### 3.1. Khởi tạo/Cập nhật các mô hình AI học sâu
Khi triển khai trên máy tính mới hoặc muốn nạp lại các mô hình từ Hugging Face, hãy chạy script:
```powershell
python models/download_models.py
```
Script này sẽ tự động tạo thư mục và tải các mô hình:
- Embedding: `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2`
- Guardrails: `repelloai/CREST-Base`
- STT: `csukuangfj/sherpa-onnx-zipformer-vi-2025-04-20`
- TTS: `csukuangfj/vits-piper-vi_VN-vivos-x_low`
- Gọi API của Ollama để nạp mô hình `qwen2.5:0.5b`.

#### 3.2. Sửa lỗi trùng lặp bảng LanceDB (Mục bảo trì sửa lỗi gấp)
Trong [rag.py](file:///c:/Users/phand/Project/chatbot%20y%20t%E1%BA%BF/backend/core/rag.py#L80-L125), quá trình tạo cơ sở dữ liệu LanceDB gặp lỗi `Table already exists` nếu bảng đã được khởi tạo nhưng trống.

> [!WARNING]
> **Hướng dẫn sửa chữa**: 
> Hãy thay thế khối lệnh khởi tạo LanceDB bằng cách kiểm tra sự tồn tại của bảng, nếu bảng đã có và hợp lệ thì mở ra, ngược lại hãy xóa đi tạo mới một cách an toàn.

Đoạn code sửa đổi đề xuất cho [rag.py:L80-125](file:///c:/Users/phand/Project/chatbot%20y%20t%E1%BA%BF/backend/core/rag.py#L80-L125):
```python
    def _init_vector_db(self):
        try:
            os.makedirs(self.vector_store_path, exist_ok=True)
            db = lancedb.connect(self.vector_store_path)
            table_name = "medical_docs"
            table_names = db.list_tables()
            
            # Xóa bảng cũ nếu nó đã tồn tại để tránh lỗi trùng lặp khi chạy lại
            if table_name in table_names:
                db.drop_table(table_name)
                logger.info("Đã dọn dẹp bảng lancedb cũ.")
                
            if not self.embedding_model:
                logger.warning("Embedding model chưa sẵn sàng, bỏ qua tạo vector DB.")
                return

            vector_rows = []
            for doc in self.documents:
                text = self._build_doc_text(doc)
                vector = self.embedding_model.encode([text], convert_to_numpy=True)[0].astype(np.float32).tolist()
                row = {
                    "id": doc["id"],
                    "text": text,
                    "doc_id": doc["id"],
                    "vector": vector,
                }
                vector_rows.append(row)

            self.lancedb_table = db.create_table(table_name, data=vector_rows)
            self.is_vector_db_ready = True
            logger.info("Đã khởi tạo thành công LanceDB.")
        except Exception as e:
            logger.warning(f"Lỗi khởi tạo LanceDB: {e}. Sử dụng RAG fallback.")
```

#### 3.3. Bổ sung Tài liệu sơ cứu mới
Để thêm tình huống y tế mới (Ví dụ: sơ cứu say nắng, bỏng lạnh):
1. Mở file dữ liệu [first_aid_data.json](file:///c:/Users/phand/Project/chatbot%20y%20t%E1%BA%BF/backend/data/first_aid_data.json).
2. Thêm một đối tượng JSON mới với cấu trúc:
   ```json
   {
     "id": "heatstroke",
     "title": "Sơ cứu say nắng, sốc nhiệt",
     "caseKey": "heatstroke",
     "keywords": ["say nắng", "sốc nhiệt", "nắng nóng", "xỉu ngoài nắng", "nóng đầu"],
     "emergencyAction": "Đưa nạn nhân vào chỗ mát ngay lập tức. Nới lỏng quần áo và làm mát bằng khăn ướt ấm.",
     "detailedSteps": [
       "Di chuyển nạn nhân đến khu vực bóng râm hoặc phòng điều hòa.",
       "Gọi cấp cứu 115 nếu nạn nhân lơ mơ hoặc ngất xỉu.",
       "Lau người nạn nhân bằng nước mát (không dùng nước đá lạnh để tránh co mạch).",
       "Cho uống nước từng ngụm nhỏ nếu nạn nhân hoàn toàn tỉnh táo."
     ],
     "references": "Cẩm nang chăm sóc sức khỏe mùa nắng nóng - Bộ Y Tế Việt Nam"
   }
   ```
3. Khởi tạo lại vector index bằng cách xóa thư mục `backend/data/lancedb` và khởi động lại server backend.
4. Cập nhật thêm đồ họa SVG hướng dẫn trực quan tương ứng với `caseKey` mới (`heatstroke`) trong frontend tại file [VisualGuide.tsx](file:///c:/Users/phand/Project/chatbot%20y%20t%E1%BA%BF/frontend/components/VisualGuide.tsx) (nếu cần).
5. Mở rộng bộ phân loại heuristic trong file [rag.py:L195-211](file:///c:/Users/phand/Project/chatbot%20y%20t%E1%BA%BF/backend/core/rag.py#L195-L211) bằng cách nhận diện tín hiệu trực tiếp từ từ khóa `"say nang"`, `"soc nhiet"`...

#### 3.4. Quy trình Kiểm thử & Đánh giá chất lượng
Mỗi lần sửa đổi thuật toán tìm kiếm RAG hoặc cập nhật tri thức y khoa mới, nhà phát triển bắt buộc phải chạy bộ công cụ đo lường chất lượng:

1. **Chạy E2E Tests (Kiểm thử chức năng API tổng thể)**:
   ```powershell
   $env:PYTHONIOENCODING="utf-8"; .\.venv\Scripts\python.exe backend/tests/test_e2e.py
   ```
2. **Chạy RAG Benchmark (Kiểm định độ chính xác tìm kiếm RAG)**:
   ```powershell
   $env:PYTHONIOENCODING="utf-8"; .\.venv\Scripts\python.exe backend/tests/benchmark_medical_eval.py
   ```
   *Yêu cầu bắt buộc*: Tỷ lệ vượt qua benchmark y tế phải duy trì ở mức **100%** đối với các ca khẩn cấp cốt lõi.

---

## English Version

# Technical Report: Architecture & Maintenance Guide for the Offline Medical Assistant System

This document provides a detailed overview of the software architecture, data flow pipelines, local AI model integration, and development workflows for maintaining and expanding the Offline Medical Assistant System.

---

### 1. Overall System Architecture

The system is designed around a **local Client-Server model**. In production mobile deployments, this Python server is compiled or wrapped as a binary running alongside a hybrid WebView container on-device.

#### Data Flow Diagram

```mermaid
sequenceDiagram
    autonumber
    actor User as User (Patient)
    participant FE as Next.js Frontend
    participant BE as FastAPI Backend
    participant Guard as Guardrails (CREST-Base)
    participant RAG as RAG Engine (BM25 + LanceDB)
    participant LLM as Ollama / Local Fallback
    participant Speech as Sherpa-ONNX (ASR/TTS)

    User->>FE: Hold-to-Talk (Audio Input)
    FE->>BE: POST /api/stt (Audio binary)
    BE->>Speech: Decode ASR (Zipformer-vi)
    Speech-->>BE: Return transcribed query text
    BE-->>FE: Return query text
    FE->>BE: POST /api/chat {"query": text}
    
    BE->>Guard: Security Check (Regex + CREST-Base)
    alt Unsafe (Jailbreak / Out of Scope)
        Guard-->>BE: Block & Reject query
        BE-->>FE: Return security warning response
    else Safe
        BE->>RAG: Query first-aid documents
        RAG->>RAG: BM25 lexical pre-filtering + Vector Reranking
        RAG-->>BE: Return retrieved medical context
        BE->>LLM: Generate response (Qwen2.5 / Fallback)
        LLM-->>BE: Return 3-part structured answer
        BE-->>FE: Return answer text
    end
    
    FE->>BE: GET /api/tts?text=... (Request speech synthesis)
    BE->>Speech: Synthesize TTS (VITS-vi)
    Speech-->>BE: Return WAV audio + Word-level timestamps
    BE-->>FE: Return Base64 WAV + Timestamps
    FE->>User: Play audio + Highlight Karaoke text + Display SVG visual guide
```

---

### 2. Core Component Implementation Details

#### 2.1. System Configuration (`config.py`)
Located at [config.py](file:///c:/Users/phand/Project/chatbot%20y%20t%E1%BA%BF/backend/core/config.py), this module manages path configurations and threshold settings.
- **`get_short_path_name` Utility**: Crucial for Windows deployments. It converts long paths containing Unicode characters or spaces into the short `8.3 format` (e.g., `chatbot~1`). This prevents runtime segmentation faults in C++ cores of `sherpa-onnx` and `espeak-ng`.
- **RAG Chunk Settings**: Configured with `CHUNK_SIZE = 300` and `CHUNK_OVERLAP = 25`.

#### 2.2. Safety Guardrails (`guardrails.py`)
Located at [guardrails.py](file:///c:/Users/phand/Project/chatbot%20y%20t%E1%BA%BF/backend/core/guardrails.py), implementing a dual-layer safety mechanism:
- **Layer 1 (Regex & Keyword Filter)**: Quickly detects obvious jailbreak attempts (prompt injections) and filters out completely irrelevant domains (programming, politics, shopping, math) to save processing power.
- **Layer 2 (Deep Learning)**: Deploys the `repelloai/CREST-Base` model (a lightweight multilingual safety classification model) to identify adversarial prompt jailbreaks using slang or code-switching between English and Vietnamese.

#### 2.3. Hybrid RAG Engine (`rag.py`)
Located at [rag.py](file:///c:/Users/phand/Project/chatbot%20y%20t%E1%BA%BF/backend/core/rag.py), carrying out a two-stage hybrid retrieval:
- **Stage 1 (BM25 Okapi)**: Quickly screens documents for lexical keywords.
- **Stage 2 (LanceDB + SentenceTransformers)**: Computes semantic vector similarities via the `multilingual-MiniLM-L12-v2` embedding model.
- **Routing Heuristics**: Utilizes a synonym mapping (`SYNONYM_MAP` e.g., "ngộp" -> "ngạt, hóc") and direct classifier routing (`_detect_direct_medical_signal`) to instantly route critical scenarios (CPR, burns, bleeding, choking, stroke, snakebites) with near-zero latency.

#### 2.4. LLM Connection & Fallback (`llm.py`)
Located at [llm.py](file:///c:/Users/phand/Project/chatbot%20y%20t%E1%BA%BF/backend/core/llm.py), responsible for response generation:
- **System Prompt Alignment**: Constrains the Ollama Qwen2.5 model to rely strictly on the provided RAG Context and enforces a mandatory 3-part structured format:
  1. 🚨 IMMEDIATE EMERGENCY ACTION
  2. 📋 DETAILED FIRST-AID STEPS
  3. 📚 REFERENCES
- **Fallback Synthesizer**: If the local Ollama service is offline or unreachable, the fallback synthesizer automatically formats the raw RAG context into the exact 3-part structured format, keeping the app functional without service interruption.

#### 2.5. Offline Speech Processing (`speech.py`)
Located at [speech.py](file:///c:/Users/phand/Project/chatbot%20y%20t%E1%BA%BF/backend/core/speech.py), providing speech accessibility features:
- **ASR (STT)**: Loads the Vietnamese Zipformer model using `sherpa-onnx` to recognize conversational dialects and hesitant speech under stress.
- **TTS**: Employs the VITS model to synthesize natural-sounding speech. The generation function outputs a list of word-level `timestamps` containing the start time and duration for each word.
- **Karaoke Highlight**: The Next.js frontend uses these timestamps to highlight words in real-time as the audio plays.

---

### 3. Maintenance & Development Guidelines

#### 3.1. Downloading & Initializing Deep Learning Models
When setting up on a new machine or downloading models from Hugging Face, run the setup script:
```powershell
python models/download_models.py
```
This script initializes directories and downloads the following models:
- Embedding: `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2`
- Guardrails: `repelloai/CREST-Base`
- STT: `csukuangfj/sherpa-onnx-zipformer-vi-2025-04-20`
- TTS: `csukuangfj/vits-piper-vi_VN-vivos-x_low`
- Connects to Ollama to pull `qwen2.5:0.5b`.

#### 3.2. Troubleshooting LanceDB Table Initialization (Maintenance Critical)
In [rag.py](file:///c:/Users/phand/Project/chatbot%20y%20t%E1%BA%BF/backend/core/rag.py#L80-L125), LanceDB table creation might crash with a `Table already exists` error if an empty table structure exists from previous runs.

> [!WARNING]
> **Resolution Guide**:
> Replace the LanceDB initialization code block to drop the old table and recreate it safely if it exists, ensuring index files are re-indexed cleanly.

Reference implementation of the modified `_init_vector_db` in [rag.py:L80-125](file:///c:/Users/phand/Project/chatbot%20y%20t%E1%BA%BF/backend/core/rag.py#L80-L125):
```python
    def _init_vector_db(self):
        try:
            os.makedirs(self.vector_store_path, exist_ok=True)
            db = lancedb.connect(self.vector_store_path)
            table_name = "medical_docs"
            table_names = db.list_tables()
            
            # Drop old table if it exists to avoid duplication errors on re-index
            if table_name in table_names:
                db.drop_table(table_name)
                logger.info("Cleared old lancedb table.")
                
            if not self.embedding_model:
                logger.warning("Embedding model not ready, skipping vector DB creation.")
                return

            vector_rows = []
            for doc in self.documents:
                text = self._build_doc_text(doc)
                vector = self.embedding_model.encode([text], convert_to_numpy=True)[0].astype(np.float32).tolist()
                row = {
                    "id": doc["id"],
                    "text": text,
                    "doc_id": doc["id"],
                    "vector": vector,
                }
                vector_rows.append(row)

            self.lancedb_table = db.create_table(table_name, data=vector_rows)
            self.is_vector_db_ready = True
            logger.info("Successfully initialized LanceDB.")
        except Exception as e:
            logger.warning(f"Error initializing LanceDB: {e}. Falling back to keyword search.")
```

#### 3.3. Appending New First-Aid Guides
To add a new first-aid scenario (e.g., heatstroke, hypothermia):
1. Open the JSON database at [first_aid_data.json](file:///c:/Users/phand/Project/chatbot%20y%20t%E1%BA%BF/backend/data/first_aid_data.json).
2. Append a new JSON object using the following structure:
   ```json
   {
     "id": "heatstroke",
     "title": "First Aid for Heatstroke",
     "caseKey": "heatstroke",
     "keywords": ["heatstroke", "sunstroke", "hot weather", "fainting in sun", "overheating"],
     "emergencyAction": "Move the person to a cool area immediately. Loosen tight clothing and cool them with warm wet towels.",
     "detailedSteps": [
       "Move the victim to shade or an air-conditioned room.",
       "Call emergency services 115 if the victim is confused or unconscious.",
       "Wipe their body with cool water (do not use ice water to prevent vasoconstriction).",
       "Give sips of water if the victim is fully awake and conscious."
     ],
     "references": "Heatstroke Prevention and Care Manual - Vietnam Ministry of Health"
   }
   ```
3. Re-index the vector index by deleting the folder `backend/data/lancedb` and restarting the FastAPI backend server.
4. Add corresponding SVG visual instructions for the new `caseKey` (`heatstroke`) in the frontend at [VisualGuide.tsx](file:///c:/Users/phand/Project/chatbot%20y%20t%E1%BA%BF/frontend/components/VisualGuide.tsx) (if needed).
5. Update the heuristic classifier rules in [rag.py:L195-211](file:///c:/Users/phand/Project/chatbot%20y%20t%E1%BA%BF/backend/core/rag.py#L195-L211) to intercept terms like `"say nang"`, `"soc nhiet"`, etc.

#### 3.4. Testing & Verification Procedures
After modifying RAG search scripts or adding medical content, run the quality assurance scripts:

1. **E2E Functional Tests**:
   ```powershell
   $env:PYTHONIOENCODING="utf-8"; .\.venv\Scripts\python.exe backend/tests/test_e2e.py
   ```
2. **RAG Accuracy Benchmark**:
   ```powershell
   $env:PYTHONIOENCODING="utf-8"; .\.venv\Scripts\python.exe backend/tests/benchmark_medical_eval.py
   ```
   *Requirement*: The RAG retrieval accuracy benchmark score must remain at **100%** for all core first-aid cases.
