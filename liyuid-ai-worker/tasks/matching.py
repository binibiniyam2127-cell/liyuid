import json
import uuid
from sqlalchemy import text

from tasks.common import SessionLocal
from tasks.config import NOTIFICATION_SCORE_THRESHOLD, app
from tasks.notifications import dispatch_match_notification

_model = None


def get_embedding_model():
    """Lazy loader for multilingual SentenceTransformer model."""
    global _model
    if _model is None:
        from sentence_transformers import SentenceTransformer
        _model = SentenceTransformer("sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")
    return _model


@app.task(name="tasks.process_item_embedding_and_match")
def process_item_embedding_and_match(item_id: str):
    """
    1. Computes 384-d semantic embedding for the item description.
    2. Runs hybrid PostGIS spatial and cosine similarity search.
    3. Persists/updates matches and triggers notifications if score >= threshold.
    """
    db = SessionLocal()
    try:
        item_query = text("""
            SELECT id, type, category, brand, primary_color, public_description 
            FROM items 
            WHERE id = :item_id
        """)
        item = db.execute(item_query, {"item_id": item_id}).mappings().first()
        if not item:
            print(f"[Worker] Item {item_id} not found.")
            return {"status": "item_not_found"}

        # Compute & store vector embedding
        model = get_embedding_model()
        embedding = model.encode(item["public_description"]).tolist()
        update_query = text("""
            UPDATE items 
            SET text_embedding = CAST(:embedding AS vector) 
            WHERE id = :item_id
        """)
        db.execute(update_query, {"embedding": str(embedding), "item_id": item_id})
        db.commit()

        target_type = "found" if item["type"] == "lost" else "lost"
        match_search_query = text("""
            WITH source AS (
                SELECT location, incident_timestamp, text_embedding 
                FROM items 
                WHERE id = :item_id
            )
            SELECT 
                i.id, i.brand, i.primary_color,
                ST_Distance(i.location::geography, s.location::geography) / 1000.0 AS distance_km,
                1 - (i.text_embedding <=> s.text_embedding) AS cosine_sim,
                ABS(EXTRACT(EPOCH FROM (i.incident_timestamp - s.incident_timestamp))) / 3600.0 AS hours_diff
            FROM items i, source s
            WHERE i.type = :target_type
              AND i.category = :category
              AND i.status = 'active'
              AND i.text_embedding IS NOT NULL
              AND ST_DWithin(i.location::geography, s.location::geography, 15000)
            ORDER BY cosine_sim DESC
            LIMIT 10;
        """)

        candidates = db.execute(match_search_query, {
            "item_id": item_id,
            "target_type": target_type,
            "category": item["category"]
        }).mappings().all()

        dispatched_matches = []

        for cand in candidates:
            dist_km = float(cand["distance_km"]) if cand["distance_km"] is not None else 15.0
            cos_sim = float(cand["cosine_sim"]) if cand["cosine_sim"] is not None else 0.0
            hours_diff = float(cand["hours_diff"]) if cand["hours_diff"] is not None else 72.0

            # Multi-factor score components
            s_sem = max(0.0, cos_sim)
            s_geo = max(0.0, 1.0 - (dist_km / 15.0))
            s_time = max(0.0, 1.0 - min(hours_diff / 72.0, 1.0))

            brand_m = 1.0 if (item["brand"] and cand["brand"] and item["brand"].lower() == cand["brand"].lower()) else 0.0
            color_m = 1.0 if (item["primary_color"] and cand["primary_color"] and item["primary_color"].lower() == cand["primary_color"].lower()) else 0.0
            s_attr = (brand_m * 0.6) + (color_m * 0.4)

            composite = round((s_sem * 0.40) + (s_attr * 0.30) + (s_geo * 0.15) + (s_time * 0.15), 4)

            lost_id = item["id"] if item["type"] == "lost" else cand["id"]
            found_id = cand["id"] if item["type"] == "lost" else item["id"]

            existing_match = db.execute(
                text("SELECT id FROM matches WHERE lost_item_id = :lost_id AND found_item_id = :found_id"),
                {"lost_id": lost_id, "found_id": found_id}
            ).mappings().first()

            breakdown_json = json.dumps({
                "distance_km": round(dist_km, 2),
                "semantic_similarity": round(s_sem, 4),
                "attribute_similarity": round(s_attr, 4),
                "hours_difference": round(hours_diff, 1),
                "brand_match": brand_m,
                "color_match": color_m
            })

            if not existing_match:
                new_match_id = str(uuid.uuid4())
                insert_match = text("""
                    INSERT INTO matches (
                        id, lost_item_id, found_item_id, composite_score, 
                        score_breakdown, is_verified, verification_attempts, created_at
                    )
                    VALUES (
                        :id, :lost_id, :found_id, :score, 
                        CAST(:breakdown AS jsonb), FALSE, 0, NOW()
                    );
                """)
                db.execute(insert_match, {
                    "id": new_match_id,
                    "lost_id": lost_id,
                    "found_id": found_id,
                    "score": composite,
                    "breakdown": breakdown_json
                })
                db.commit()
                target_match_id = new_match_id
            else:
                target_match_id = str(existing_match["id"])
                update_match = text("""
                    UPDATE matches 
                    SET composite_score = :score, score_breakdown = CAST(:breakdown AS jsonb)
                    WHERE id = :id
                """)
                db.execute(update_match, {
                    "score": composite,
                    "breakdown": breakdown_json,
                    "id": target_match_id
                })
                db.commit()

            # Automatic FR-06 Notification Dispatch Trigger
            if composite >= NOTIFICATION_SCORE_THRESHOLD:
                dispatch_match_notification.delay(target_match_id)
                dispatched_matches.append(target_match_id)

        return {
            "status": "completed",
            "item_id": item_id,
            "candidates_found": len(candidates),
            "dispatched_matches": dispatched_matches
        }

    except Exception as exc:
        db.rollback()
        print(f"[Match Process Error] {exc}")
        return {"status": "error", "error": str(exc)}
    finally:
        db.close()
