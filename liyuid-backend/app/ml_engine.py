import numpy as np
from sentence_transformers import SentenceTransformer

# Multilingual model handling English, Fidel Amharic, and Amhlish
nlp_model = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")

def compute_text_embedding(text: str) -> list:
    """Extracts a 384-dimensional normalized vector."""
    embedding = nlp_model.encode(text, normalize_embeddings=True)
    return embedding.tolist()

def compute_attribute_jaccard(attr1: dict, attr2: dict) -> float:
    """Measures Jaccard similarity across categorical attributes."""
    keys = ["category", "brand", "model", "primary_color"]
    matches = 0
    total = 0
    for k in keys:
        v1 = str(attr1.get(k, "")).strip().lower()
        v2 = str(attr2.get(k, "")).strip().lower()
        if v1 or v2:
            total += 1
            if v1 and v2 and v1 == v2:
                matches += 1
    return float(matches / total) if total > 0 else 0.0

def compute_composite_score(sem_score: float, attr_score: float, distance_km: float, delta_hours: float) -> tuple[float, dict]:
    """
    S_total = w_sem * S_sem + w_attr * S_attr + w_geo * S_geo + w_time * S_time
    """
    w_sem, w_attr, w_geo, w_time = 0.40, 0.30, 0.15, 0.15
    s_geo = float(np.exp(-distance_km / 5.0))
    s_time = float(np.exp(-abs(delta_hours) / 72.0))
    s_total = (w_sem * sem_score) + (w_attr * attr_score) + (w_geo * s_geo) + (w_time * s_time)
    
    breakdown = {
        "semantic_similarity": round(sem_score, 3),
        "attribute_overlap": round(attr_score, 3),
        "geo_proximity_score": round(s_geo, 3),
        "temporal_proximity_score": round(s_time, 3),
        "distance_km": round(distance_km, 2),
        "delta_hours": round(delta_hours, 1)
    }
    return float(round(s_total, 4)), breakdown