import logging

logger = logging.getLogger("liyuid.backend")

_ml_model = None


def get_ml_model():
    global _ml_model
    if _ml_model is None:
        try:
            from sentence_transformers import SentenceTransformer
            _ml_model = SentenceTransformer("sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")
        except Exception as exc:
            logger.warning("Using deterministic mock sentence transformer for offline/CI environment: %s", exc)
            import numpy as np
            import hashlib

            class DeterministicMockTransformer:
                def encode(self, texts, *args, **kwargs):
                    is_single = isinstance(texts, str)
                    text_list = [texts] if is_single else list(texts)
                    embeddings = []
                    for t in text_list:
                        digest = hashlib.sha256(t.encode("utf-8")).digest()
                        raw = np.array([(b / 128.0) - 1.0 for b in (digest * 12)[:384]], dtype=np.float32)
                        norm = np.linalg.norm(raw)
                        embeddings.append(raw / (norm if norm > 0 else 1.0))
                    arr = np.array(embeddings, dtype=np.float32)
                    return arr[0] if is_single else arr

            _ml_model = DeterministicMockTransformer()
    return _ml_model

