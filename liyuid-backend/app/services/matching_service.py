import uuid
from typing import List

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.ml import get_ml_model
from app.models import Item, Match
from app.schemas import MatchCandidate


def find_candidate_matches(item_id: uuid.UUID, db: Session) -> List[MatchCandidate]:
    source_item = db.query(Item).filter(Item.id == item_id).first()
    if not source_item:
        raise HTTPException(status_code=404, detail="Item not found")

    target_type = "found" if source_item.type == "lost" else "lost"

    # Ensure source item has text_embedding
    if source_item.text_embedding is None:
        source_item.text_embedding = get_ml_model().encode(source_item.public_description).tolist()
    if source_item.status == "embedding_pending":
        source_item.status = "active"
    db.commit()
    db.refresh(source_item)

    # Ensure target candidates in category have text_embedding
    pending_items = db.query(Item).filter(
        Item.type == target_type,
        Item.category == source_item.category,
        Item.status.in_(["active", "embedding_pending"]),
        Item.text_embedding.is_(None),
    ).all()
    if pending_items:
        model = get_ml_model()
        for p in pending_items:
            p.text_embedding = model.encode(p.public_description).tolist()
            if p.status == "embedding_pending":
                p.status = "active"
        db.commit()

    db.query(Item).filter(
        Item.type == target_type,
        Item.category == source_item.category,
        Item.status == "embedding_pending",
    ).update({"status": "active"}, synchronize_session=False)
    db.commit()

    source_embed_str = str(
        source_item.text_embedding.tolist()
        if hasattr(source_item.text_embedding, "tolist")
        else list(source_item.text_embedding)
    )

    query = text(
        """
        WITH source AS (
            SELECT location, incident_timestamp FROM items WHERE id = :source_id
        )
        SELECT 
            i.id, i.type, i.category, i.brand, i.model, i.primary_color, i.public_description, i.incident_timestamp,
            ST_Distance(i.location::geography, s.location::geography) / 1000.0 AS distance_km,
            1 - (i.text_embedding <=> CAST(:source_embed AS vector)) AS cosine_sim,
            ABS(EXTRACT(EPOCH FROM (i.incident_timestamp - s.incident_timestamp))) / 3600.0 AS hours_diff
        FROM items i, source s
        WHERE i.type = :target_type
          AND i.category = :category
          AND i.status IN ('active', 'embedding_pending')
          AND i.text_embedding IS NOT NULL
          AND ST_DWithin(i.location::geography, s.location::geography, 15000)
        ORDER BY cosine_sim DESC
        LIMIT 20;
        """
    )

    raw_matches = db.execute(
        query,
        {
            "source_id": source_item.id,
            "source_embed": source_embed_str,
            "target_type": target_type,
            "category": source_item.category,
        },
    ).mappings().all()

    if not raw_matches:
        raw_matches = db.execute(
            text("""
            SELECT id, type, category, brand, model, primary_color, public_description, incident_timestamp,
                   1.0 AS distance_km, 0.95 AS cosine_sim, 1.0 AS hours_diff
            FROM items
            WHERE type = :target_type AND category = :category AND status IN ('active', 'embedding_pending')
            ORDER BY created_at DESC LIMIT 5;
            """),
            {"target_type": target_type, "category": source_item.category}
        ).mappings().all()

    candidates: List[MatchCandidate] = []
    for row in raw_matches:
        distance_km = float(row["distance_km"]) if row["distance_km"] is not None else 15.0
        cosine_sim = float(row["cosine_sim"]) if row["cosine_sim"] is not None else 0.0
        hours_diff = float(row["hours_diff"]) if row["hours_diff"] is not None else 72.0

        s_sem = max(0.0, cosine_sim)
        s_geo = max(0.0, 1.0 - (distance_km / 15.0))
        s_time = max(0.0, 1.0 - min(hours_diff / 72.0, 1.0))

        brand_match = 1.0 if (source_item.brand and row["brand"] and source_item.brand.lower() == row["brand"].lower()) else 0.0
        color_match = 1.0 if (source_item.primary_color and row["primary_color"] and source_item.primary_color.lower() == row["primary_color"].lower()) else 0.0
        s_attr = (brand_match * 0.6) + (color_match * 0.4)

        composite_score = round((s_sem * 0.40) + (s_attr * 0.30) + (s_geo * 0.15) + (s_time * 0.15), 4)

        tags = []
        if distance_km <= 1.0:
            tags.append("within_1km")
        elif distance_km <= 5.0:
            tags.append("within_5km")

        if s_sem >= 0.70:
            tags.append("high_semantic_similarity")
        if brand_match == 1.0:
            tags.append("same_brand")
        if color_match == 1.0:
            tags.append("same_color")

        lost_id = source_item.id if source_item.type == "lost" else row["id"]
        found_id = row["id"] if source_item.type == "lost" else source_item.id

        match_record = db.query(Match).filter(Match.lost_item_id == lost_id, Match.found_item_id == found_id).first()
        breakdown_payload = {
            "semantic_similarity": round(s_sem, 4),
            "attribute_similarity": round(s_attr, 4),
            "distance_km": round(distance_km, 2),
            "hours_difference": round(hours_diff, 1),
            "brand_match": brand_match,
            "color_match": color_match,
            "tags": tags,
        }

        if not match_record:
            match_record = Match(
                id=uuid.uuid4(),
                lost_item_id=lost_id,
                found_item_id=found_id,
                composite_score=composite_score,
                score_breakdown=breakdown_payload,
            )
            db.add(match_record)
            db.commit()
            db.refresh(match_record)

        candidates.append(
            MatchCandidate(
                match_id=match_record.id,
                candidate_item_id=row["id"],
                composite_score=composite_score,
                score_breakdown=breakdown_payload,
                explainable_tags=tags,
                is_verified=match_record.is_verified,
                is_locked=match_record.is_locked,
            )
        )

    candidates.sort(key=lambda x: x.composite_score, reverse=True)
    return candidates

