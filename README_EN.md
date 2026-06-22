# Offline First-Aid Chatbot (Offline First-Aid Multi-Access Assistant)

🇻🇳 [Bản Tiếng Việt Ở Đây / Vietnamese Version Here](file:///c:/Users/phand/Project/chatbot%20y%20t%E1%BA%BF/README.md)

An emergency first-aid assistant system that operates **100% offline (Offline Edge AI)** on mobile devices. It integrates a local large language model (LLM), local hybrid retrieval-augmented generation (RAG) for medical manuals, Vietnamese speech-to-speech interaction (ASR/TTS), and a multi-modal accessible user interface conforming to the international **WCAG 2.2 AA** standard.

---

## 🚀 Key Features

- **Dual-Layer Security Guardrails**: Combines regex-based keyword filters with the deep learning `CREST-Base` classifier to prevent prompt injection (jailbreak) attacks and automatically reject out-of-scope non-medical queries.
- **Hybrid RAG Engine**: Combines lexical search (BM25 Okapi) with semantic vector search (`multilingual-MiniLM-L12-v2` + `LanceDB`) to locate precise first-aid instructions with low latency.
- **Local LLM Inference**: Integrated with `Ollama` running the ultra-small `Qwen2.5:0.5B` model. It operates with a low temperature parameter of 0.1 to avoid medical hallucinations. Features a rule-based fallback synthesizer if the local LLM becomes unreachable.
- **Offline Speech Processing (Sherpa-ONNX)**: Fully offline automatic speech recognition (ASR Zipformer) and speech synthesis (TTS VITS) optimized for the Vietnamese language.
- **Accessibility UI (WCAG 2.2 AA)**: Designed to assist the elderly and physically impaired, featuring 200% text resizing, high color contrast, karaoke-style text highlighting synchronized with TTS voice, haptic feedback, and touch target buttons >80px.

---

## 📂 Project Directory Structure

```text
├── backend/
│   ├── core/
│   │   ├── config.py         # Paths, constants, and Windows 8.3 path converter
│   │   ├── guardrails.py      # Dual-layer safety guardrails (CREST-Base & Regex)
│   │   ├── llm.py            # Ollama API client and local Fallback Synthesizer
│   │   ├── rag.py            # Hybrid retrieval search engine (BM25 + LanceDB)
│   │   └── speech.py         # Offline speech recognition & synthesis (Sherpa-ONNX)
│   ├── data/
│   │   └── first_aid_data.json # JSON database containing 7 core first-aid manuals
│   ├── tests/
│   │   ├── test_e2e.py       # End-to-end FastAPI API test suite
│   │   ├── test_quality_metrics.py # Unit tests for RAG retrieval quality metrics
│   │   └── benchmark_medical_eval.py # RAG retrieval accuracy benchmark on 41 cases
│   ├── requirements.txt      # Python libraries & dependencies
│   └── app.py                # FastAPI Web Server entry point
├── frontend/
│   ├── app/                  # Next.js pages (App Router) and globals.css
│   ├── components/           # Accessible UI components (ActionBar, ChatWindow, etc.)
│   ├── hooks/                # Custom React hooks managing accessibility states
│   ├── lib/                  # modelService.ts (client-side offline logic & fallbacks)
│   └── package.json          # npm/pnpm library dependencies
├── models/
│   └── download_models.py    # Auto-downloader script for deep learning models from Hugging Face
└── Scientific_Paper_EN.md    # Q1 Bilingual Scientific Research Paper (English version)
```

---

## 🛠️ Installation & Execution Guide

### Step 1: Initialize Python Environment & Download Models
1. Install Python (recommended versions: 3.10 - 3.12).
2. Create and activate a Python virtual environment:
   ```powershell
   python -m venv .venv
   .\.venv\Scripts\activate
   ```
3. Install the required Python packages:
   ```powershell
   pip install -r backend/requirements.txt
   ```
4. Run the downloader script to fetch the offline AI models:
   ```powershell
   python models/download_models.py
   ```

### Step 2: Set Up and Start Ollama
1. Download and install [Ollama](https://ollama.com/).
2. Pull the Qwen2.5-0.5B instruct model:
   ```powershell
   ollama pull qwen2.5:0.5b
   ```

### Step 3: Start the Backend FastAPI Server
```powershell
$env:PYTHONIOENCODING="utf-8"
python backend/app.py
```
The backend service will run at `http://127.0.0.1:8000`. You can inspect the Swagger API docs at `http://127.0.0.1:8000/docs`.

### Step 4: Start the Next.js Frontend
1. Navigate into the frontend directory:
   ```powershell
   cd frontend
   ```
2. Install npm packages (recommended using `pnpm` or `npm`):
   ```powershell
   pnpm install
   ```
3. Launch the local development server:
   ```powershell
   pnpm dev
   ```
The frontend application will run at `http://localhost:3000`.

---

## 🧪 Testing & Quality Evaluation

Developers must run the following test scripts whenever modifying RAG algorithms or updating medical data:

- **E2E API Testing**:
  ```powershell
  $env:PYTHONIOENCODING="utf-8"; .\.venv\Scripts\python.exe backend/tests/test_e2e.py
  ```
- **RAG Accuracy Benchmark**:
  ```powershell
  $env:PYTHONIOENCODING="utf-8"; .\.venv\Scripts\python.exe backend/tests/benchmark_medical_eval.py
  ```

---

## 📖 Research Papers & Maintenance Reports
- **Maintenance & LanceDB Troubleshooting**: See [technical_report_EN.md](file:///c:/Users/phand/Project/chatbot%20y%20t%E1%BA%BF/technical_report_EN.md) for details on LanceDB operations.
- **Bilingual Q1 Scientific Paper**:
  - English Version: [Scientific_Paper_EN.md](file:///c:/Users/phand/Project/chatbot%20y%20t%E1%BA%BF/Scientific_Paper_EN.md)
  - Vietnamese Version: [Scientific_Paper_VI.md](file:///c:/Users/phand/Project/chatbot%20y%20t%E1%BA%BF/Scientific_Paper_VI.md)
