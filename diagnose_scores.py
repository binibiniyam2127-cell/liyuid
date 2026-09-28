import os
from sqlalchemy import create_engine, text

db_url = os.getenv("DATABASE_URL", "postgresql+psycopg://liyuid_admin:password@postgres:5432/liyuid_db")
engine = create_engine(db_url)

with engine.connect() as conn:
    lost = conn.execute(text("SELECT id, category, brand, model, primary_color, public_description, location, incident_timestamp, text_embedding FROM items WHERE type = 'lost' ORDER BY created_at DESC LIMIT 1")).mappings().first()
    found = conn.execute(text("SELECT id, category, brand, model, primary_color, public_description, location, incident_timestamp, text_embedding FROM items WHERE type = 'found' ORDER BY created_at DESC LIMIT 1")).mappings().first()

    if not lost or not found:
        print("Missing lost or found items.")
        exit()

    # Query similarity and distance directly via pgvector & PostGIS
    query = text("""
        SELECT 
            1 - (CAST(:lost_emb AS vector) <=> CAST(:found_emb AS vector)) AS semantic_sim,
            ST_Distance(:lost_loc, :found_loc) AS distance_meters,
            ABS(EXTRACT(EPOCH FROM (:lost_time - :found_time))) / 86400.0 AS delta_days;
    """)
    res = conn.execute(query, {
        "lost_emb": str(lost["text_embedding"]),
        "found_emb": str(found["text_embedding"]),
        "lost_loc": lost["location"],
        "found_loc": found["location"],
        "lost_time": lost["incident_timestamp"],
        "found_time": found["incident_timestamp"]
    }).mappings().first()

    s_sem = max(0.0, float(res["semantic_sim"]))
    dist_km = float(res["distance_meters"]) / 1000.0
    s_geo = 1.0 / (1.0 + (dist_km / 5.0))
    s_time = 1.0 / (1.0 + (float(res["delta_days"]) / 3.0))
    
    # Check attribute matching
    matched_attrs = 0
    total_attrs = 3
    if lost["brand"] and found["brand"] and lost["brand"].lower() == found["brand"].lower():
        matched_attrs += 1
    if lost["model"] and found["model"] and lost["model"].lower() == found["model"].lower():
        matched_attrs += 1
    if lost["primary_color"] and found["primary_color"] and lost["primary_color"].lower() == found["primary_color"].lower():
        matched_attrs += 1
    s_attr = matched_attrs / total_attrs

    total_score = (0.40 * s_sem) + (0.30 * s_attr) + (0.15 * s_geo) + (0.15 * s_time)

    print("==================================================")
    print("SCORE BREAKDOWN DIAGNOSTICS")
    print("==================================================")
    print(f"Semantic Similarity (S_sem)  : {s_sem:.4f} (Weight 0.40 -> {0.40*s_sem:.4f})")
    print(f"Attribute Similarity (S_attr): {s_attr:.4f} (Weight 0.30 -> {0.30*s_attr:.4f})")
    print(f"Geospatial Decay (S_geo)      : {s_geo:.4f} (Distance: {dist_km*1000:.1f}m, Weight 0.15 -> {0.15*s_geo:.4f})")
    print(f"Temporal Decay (S_time)       : {s_time:.4f} (Weight 0.15 -> {0.15*s_time:.4f})")
    print("--------------------------------------------------")
    print(f"COMPOSITE TOTAL SCORE         : {total_score:.4f}")
    print("==================================================")