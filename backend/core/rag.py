import os
import json
import logging
import re
import unicodedata
from typing import List, Dict, Any, Optional
import numpy as np
from rank_bm25 import BM25Okapi
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import lancedb
from backend.core.config import RAG_DATABASE_DIR, RAG_SCORE_THRESHOLD

logger = logging.getLogger(__name__)

VIETNAMESE_STOPWORDS = {"bi", "khi", "va", "hoac", "cho", "gi", "o", "tai", "la", "cua", "co", "de", "su", "cai", "con", "the", "nao", "nhung", "voi", "ra", "nen", "dang", "da", "thi", "con", "mot", "may", "nhung", "duoc", "thay"}
SYNONYM_MAP = {
    "ngop": ["ngat", "hoc", "sac", "di vat", "kho tho"],
    "bong": ["bong", "chay", "nuoc soi", "lua", "nong"],
    "dot quy": ["tai bien", "meo mieng", "yeu tay", "noi ngong", "te"],
    "ep tim": ["cpr", "ngung tho", "ngung tim", "hoi suc", "tim ngung"],
    "chay mau": ["mau", "vet thuong", "dut tay", "cam mau", "bang bo"],
}

def is_phrase_in_text(phrase: str, text: str) -> bool:
    # So khớp nguyên từ/cụm từ tránh lỗi trùng khớp một phần (ví dụ: 'tho' trong 'python' hoặc 'hoc' trong 'khoc')
    pattern = rf"\b{re.escape(phrase)}\b"
    return bool(re.search(pattern, text))

class HybridRAG:
    def __init__(self):
        self.documents: List[Dict[str, Any]] = []
        self.bm25: Optional[BM25Okapi] = None
        self.embedding_model: Optional[SentenceTransformer] = None
        self.secondary_reranker_model: Optional[SentenceTransformer] = None
        self.embedding_model_name: Optional[str] = None
        self.lancedb_table = None
        self.is_vector_db_ready = False
        self.use_embedding_reranker = False
        self.vector_store_path = RAG_DATABASE_DIR
        
        self._load_documents()
        self._build_bm25_index()
        self._load_embedding_model()
        self._init_vector_db()

    def _load_documents(self):
        """
        Nạp dữ liệu sơ cứu từ file JSON.
        """
        try:
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            json_path = os.path.join(base_dir, "data", "first_aid_data.json")
            if os.path.exists(json_path):
                with open(json_path, "r", encoding="utf-8") as f:
                    self.documents = json.load(f)
                logger.info(f"Đã nạp {len(self.documents)} tài liệu y tế sơ cứu.")
            else:
                logger.error(f"Không tìm thấy file dữ liệu tại: {json_path}")
        except Exception as e:
            logger.error(f"Lỗi khi đọc file tài liệu: {e}")

    def _build_bm25_index(self):
        """
        Xây dựng chỉ mục đảo ngược BM25 từ vựng.
        """
        if not self.documents:
            return

        corpus = []
        for doc in self.documents:
            # Gộp Tiêu đề + Từ khóa + Hành động để tạo tập từ vựng cho tài liệu
            doc_text = f"{doc['title']} {' '.join(doc['keywords'])} {doc['emergencyAction']}"
            tokens = self._tokenize(doc_text)
            corpus.append(tokens)
        
        self.bm25 = BM25Okapi(corpus)
        logger.info("Đã xây dựng xong chỉ mục BM25 Okapi.")

    def _init_vector_db(self):
        """Khởi tạo vector store LanceDB và tạo index nếu chưa có."""
        try:
            os.makedirs(self.vector_store_path, exist_ok=True)
            db = lancedb.connect(self.vector_store_path)
            table_name = "medical_docs"
            table_names = db.list_tables()
            if table_name in table_names:
                existing_table = db.open_table(table_name)
                if "vector" in existing_table.schema.names:
                    sample_rows = existing_table.to_pandas().to_dict(orient="records")
                    if sample_rows:
                        sample_vector = sample_rows[0].get("vector", [])
                        expected_dim = len(self.embedding_model.encode([self._build_doc_text(self.documents[0])], convert_to_numpy=True)[0]) if self.embedding_model and self.documents else None
                        if expected_dim is None or len(sample_vector) == expected_dim:
                            self.lancedb_table = existing_table
                            self.is_vector_db_ready = True
                            logger.info("Đã mở LanceDB table medical_docs.")
                            return
                    logger.info("Bảng LanceDB cũ không khớp với kích thước embedding hiện tại, đang tạo lại.")
                    db.drop_table(table_name)
                else:
                    logger.info("Bảng LanceDB cũ thiếu cột vector, đang tạo lại.")
                    db.drop_table(table_name)

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
            logger.info("Đã tạo LanceDB table medical_docs.")
        except Exception as e:
            logger.warning(f"LanceDB chưa sẵn sàng hoặc lỗi: {e}. Hệ thống sẽ dùng fallback heuristic.")

    def _load_embedding_model(self):
        """Tải mô hình embedding từ thư mục cục bộ (offline) hoặc fallback trực tuyến."""
        from backend.core.config import EMBEDDING_DIR
        
        # 1. Thử tải mô hình cục bộ đã được download_models.py lưu trữ
        config_path = os.path.join(EMBEDDING_DIR, "config.json")
        if os.path.exists(config_path):
            try:
                self.embedding_model = SentenceTransformer(EMBEDDING_DIR)
                self.embedding_model_name = "local-multilingual-MiniLM"
                self.use_embedding_reranker = True
                logger.info(f"Đã tải mô hình embedding cục bộ từ: {EMBEDDING_DIR}")
                return
            except Exception as e:
                logger.warning(f"Lỗi nạp mô hình embedding cục bộ: {e}. Thử dùng fallback...")

        # 2. Fallback trực tuyến nếu không tìm thấy thư mục cục bộ
        model_candidates = ["sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2", "intfloat/multilingual-e5-small"]
        for model_name in model_candidates:
            try:
                self.embedding_model = SentenceTransformer(model_name)
                self.embedding_model_name = model_name
                self.use_embedding_reranker = True
                logger.info(f"Đã tải mô hình embedding trực tuyến: {model_name}")
                return
            except Exception as e:
                logger.warning(f"Không thể tải embedding model {model_name}: {e}")

        logger.warning("Không thể tải embedding model, sẽ dùng fallback heuristic Jaccard/Regex.")
        self.use_embedding_reranker = False

    def _build_doc_text(self, doc: Dict[str, Any]) -> str:
        return f"{doc['title']} {doc['emergencyAction']} {' '.join(doc['keywords'])}"

    def _normalize_text(self, text: str) -> str:
        normalized = unicodedata.normalize("NFKD", text.lower())
        normalized = "".join(ch for ch in normalized if not unicodedata.combining(ch))
        return normalized.strip()

    def _tokenize(self, text: str) -> List[str]:
        """
        Hàm chuẩn hóa và tách từ đơn giản tiếng Việt, có lọc từ dừng.
        """
        text = self._normalize_text(text)
        re_clean = "".join([c if c.isalnum() or c.isspace() else " " for c in text])
        words = re_clean.split()
        return [w for w in words if len(w) > 1 and w not in VIETNAMESE_STOPWORDS]

    def _expand_query_terms(self, query_tokens: List[str]) -> List[str]:
        expanded = set(query_tokens)
        normalized_query_tokens = {self._normalize_text(token) for token in query_tokens}

        for token in normalized_query_tokens:
            for key, synonyms in SYNONYM_MAP.items():
                key_tokens = self._tokenize(key)
                if token == key or token in key_tokens:
                    for synonym in synonyms:
                        expanded.update(self._tokenize(synonym))
                elif token in self._tokenize(key):
                    expanded.add(key)

                for synonym in synonyms:
                    synonyms_tokens = self._tokenize(synonym)
                    if token in synonyms_tokens:
                        expanded.add(key)

        return list(expanded)

    def _detect_direct_medical_signal(self, user_query: str) -> Optional[str]:
        normalized_query = self._normalize_text(user_query)
        if any(is_phrase_in_text(token, normalized_query) for token in ["khong tho", "khong the", "bat tinh", "ngung tim", "ngung tho"]) or (is_phrase_in_text("soc", normalized_query) and is_phrase_in_text("kho tho", normalized_query)):
            return "cpr"
        if any(is_phrase_in_text(token, normalized_query) for token in ["nghen", "ngat tho", "ngat do", "ngat", "ngop", "hoc", "sac", "di vat"]):
            return "choking"
        if any(is_phrase_in_text(token, normalized_query) for token in ["chan mau", "chay mau", "mau", "vet thuong", "thuong", "dut tay", "cam mau", "bang bo", "cat tay", "cắt tay", "vet cat", "vết cắt", "mau nhieu", "chay mau nhieu"]):
            return "bleeding"
        if any(is_phrase_in_text(token, normalized_query) for token in ["bong", "nuoc soi", "lua", "nong"]):
            return "burns"
        if any(is_phrase_in_text(token, normalized_query) for token in ["meo mieng", "yeu tay", "noi ngong", "tai bien", "dot quy", "mat mat", "meo", "yếu tay", "ngong", "ngọng"]):
            return "stroke"
        if (any(is_phrase_in_text(token, normalized_query) for token in ["ran can", "ran doc", "ran độc", "ran cắn", "cắn rắn", "vết cắn", "nọc độc", "phù nề"]) or any(is_phrase_in_text(token, normalized_query) for token in ["ran", "can"] if normalized_query.count("ran") + normalized_query.count("can") >= 2)) and any(is_phrase_in_text(token, normalized_query) for token in ["cắn", "ran", "noc", "doc", "phu"]):
            return "snakebite"
        if any(is_phrase_in_text(token, normalized_query) for token in ["tam ly", "hoang loan", "so", "lo au", "sợ", "hoang", "khoc"]):
            return "psychological"
        return None

    def _has_medical_signal(self, text: str) -> bool:
        normalized_query = self._normalize_text(text)
        if not normalized_query:
            return False

        medical_terms = {
            "so cuu", "tim", "phoi", "tho", "mau", "bong", "hoc", "sac", "ngop", "dot quy", "ran can", "ran doc", "tam ly",
            "hoang loan", "cpr", "khong tho", "bat tinh", "meo mieng", "yeu tay", "noi ngong", "tai bien", "ngot"
        }

        if any(is_phrase_in_text(term, normalized_query) for term in medical_terms):
            return True

        pattern = re.compile(r"\b(?:so cuu|tim|phoi|tho|mau|bong|hoc|sac|ngop|dot quy|ran can|ran doc|tam ly|hoang loan|cpr|khong tho|bat tinh|meo mieng|yeu tay|noi ngong|tai bien|ngot)\b")
        return bool(pattern.search(normalized_query))

    def query(self, user_query: str) -> Optional[Dict[str, Any]]:
        """
        Truy vấn lai hợp 2 giai đoạn:
        1. BM25 để tiền lọc.
        2. Tái xếp hạng bằng Jaccard Coefficient (hoặc Cosine Similarity của Vector nếu có).
        """
        if not user_query or not self.documents:
            return None

        query_tokens = self._tokenize(user_query)
        if not query_tokens:
            return None

        direct_signal = self._detect_direct_medical_signal(user_query)
        if direct_signal is not None:
            for doc in self.documents:
                if doc["caseKey"] == direct_signal:
                    return doc

        has_strong_medical_signal = self._has_medical_signal(user_query)
        if not has_strong_medical_signal:
            logger.info("RAG từ chối truy vấn không liên quan y tế.")
            return None

        expanded_query_tokens = self._expand_query_terms(query_tokens)
        if not expanded_query_tokens:
            return None

        # --- GIAI ĐOẠN 1: BM25 Lexical Filtering ---
        bm25_scores = self.bm25.get_scores(expanded_query_tokens)
        
        # Chọn ra các tài liệu có điểm BM25 > 0
        candidate_indices = [i for i, score in enumerate(bm25_scores) if score > 0]
        
        if not candidate_indices:
            candidate_indices = list(range(len(self.documents)))

        # --- GIAI ĐOẠN 2: Semantic Reranking (Embedding nếu có, fallback heuristic) ---
        best_doc = None
        max_score = 0.0

        if self.use_embedding_reranker and self.embedding_model:
            try:
                candidate_docs = [self.documents[idx] for idx in candidate_indices]
                candidate_texts = [self._build_doc_text(doc) for doc in candidate_docs]
                query_embedding = self.embedding_model.encode([user_query], convert_to_numpy=True)
                doc_embeddings = self.embedding_model.encode(candidate_texts, convert_to_numpy=True)
                similarities = cosine_similarity(query_embedding, doc_embeddings)[0]

                for doc, similarity in zip(candidate_docs, similarities):
                    score = float(similarity) * 100.0
                    if score > max_score:
                        max_score = score
                        best_doc = doc
            except Exception as e:
                logger.warning(f"Embedding reranker lỗi, quay về heuristic: {e}")

        if self.secondary_reranker_model and self.use_embedding_reranker:
            try:
                normalized_query = self._normalize_text(user_query)
                candidate_docs = [self.documents[idx] for idx in candidate_indices]
                if any(token in normalized_query for token in ["chay mau", "mau", "vet thuong", "Thuong", "thuong", "dut tay", "cam mau", "bang bo", "cat tay", "cắt tay", "vet cat", "vết cắt", "mau nhieu", "chay mau nhieu"]):
                    for doc in candidate_docs:
                        if doc["caseKey"] == "bleeding":
                            max_score = max(max_score, 96.0)
                            best_doc = doc
                            break
                if any(token in normalized_query for token in ["bỏng", "nuoc soi", "lua", "nong", "bỏng nhiệt", "bỏng da"]):
                    for doc in candidate_docs:
                        if doc["caseKey"] == "burns":
                            max_score = max(max_score, 95.0)
                            best_doc = doc
                            break
                if any(token in normalized_query for token in ["đột quỵ", "dot quy", "méo miệng", "yếu tay", "nói ngọng", "tai bien"]):
                    for doc in candidate_docs:
                        if doc["caseKey"] == "stroke":
                            max_score = max(max_score, 95.0)
                            best_doc = doc
                            break
            except Exception as e:
                logger.warning(f"Secondary reranker lỗi: {e}")

        if self.is_vector_db_ready and self.lancedb_table and self.embedding_model:
            try:
                query_embedding = self.embedding_model.encode([user_query], convert_to_numpy=True)[0]
                query_vector = query_embedding.astype(np.float32).tolist()
                results = self.lancedb_table.search(query_vector, vector_column_name="vector").limit(3).to_list()
                if results:
                    doc_id = results[0]["doc_id"]
                    for doc in self.documents:
                        if doc["id"] == doc_id:
                            if best_doc is None or max_score < 80.0:
                                best_doc = doc
                                max_score = 80.0
                            break
            except Exception as e:
                logger.warning(f"LanceDB search lỗi: {e}")

        if best_doc is None:
            for idx in candidate_indices:
                doc = self.documents[idx]
                score = 0.0

                # 1. Trùng khớp từ khóa (Keywords) - Trọng số rất cao
                normalized_query = self._normalize_text(user_query)
                matching_keywords = [kw for kw in doc["keywords"] if is_phrase_in_text(kw, normalized_query) or any(is_phrase_in_text(token, normalized_query) for token in self._tokenize(kw))]
                score += len(matching_keywords) * 12.0
                score += float(bm25_scores[idx]) * 1.5

                if any(is_phrase_in_text(token, normalized_query) for token in ["khong tho", "khong the", "bat tinh", "ngung tim", "ngung tho", "co giat", "mat y thuc"]):
                    if doc["caseKey"] == "cpr":
                        score += 35.0
                    else:
                        score -= 15.0
                if any(is_phrase_in_text(token, normalized_query) for token in ["hoc", "sac", "ngat tho", "di vat", "ngop"]):
                    if doc["caseKey"] == "choking":
                        score += 32.0
                    else:
                        score -= 10.0
                if any(is_phrase_in_text(token, normalized_query) for token in ["chay mau", "mau", "vet thuong", "thuong", "dut tay", "cam mau", "bang bo", "cat tay", "cắt tay", "vet cat", "vết cắt", "mau nhieu", "chay mau nhieu"]):
                    if doc["caseKey"] == "bleeding":
                        score += 30.0
                    else:
                        score -= 8.0

                # 2. Trùng khớp tiêu đề (Title) - Trọng số trung bình
                title_tokens = self._tokenize(doc["title"])
                title_intersection = [t for t in expanded_query_tokens if t in title_tokens]
                score += len(title_intersection) * 5.0

                # 3. Trùng khớp nội dung hành động khẩn cấp - Trọng số nhẹ
                action_tokens = self._tokenize(doc["emergencyAction"])
                action_intersection = [t for t in expanded_query_tokens if t in action_tokens]
                score += len(action_intersection) * 1.5

                # 4. Tính toán chỉ số tương đồng Jaccard giữa truy vấn và tài liệu
                doc_all_words = set(title_tokens + self._tokenize(" ".join(doc["keywords"])) + action_tokens)
                query_set = set(expanded_query_tokens)
                intersection = query_set.intersection(doc_all_words)
                union = query_set.union(doc_all_words)
                jaccard = len(intersection) / len(union) if union else 0
                score += jaccard * 10.0

                # Xem xét điểm số cao nhất
                if score > max_score:
                    max_score = score
                    best_doc = doc

        # Ngưỡng lọc độ tương đồng tối thiểu
        score_threshold = 4.0 if not self.use_embedding_reranker else 0.2
        has_strong_medical_signal = self._has_medical_signal(user_query)

        if max_score < score_threshold:
            if not has_strong_medical_signal:
                logger.info("RAG từ chối truy vấn không liên quan y tế.")
                return None

        if max_score >= score_threshold:
            logger.info(f"RAG tìm thấy tài liệu phù hợp nhất: {best_doc['title']} (Điểm: {max_score})")
            return best_doc
        
        logger.info("RAG không tìm thấy tài liệu phù hợp vượt ngưỡng điểm.")
        return None

# Singleton instance
rag_engine = HybridRAG()
