from sqlalchemy import create_engine, text
import os

db_path = "backend/attendance.db"
if not os.path.exists(db_path):
    print(f"Error: {db_path} not found")
else:
    engine = create_engine(f"sqlite:///{db_path}")
    with engine.connect() as conn:
        result = conn.execute(text("SELECT id, name, latitude, longitude FROM geofences"))
        rows = result.fetchall()
        print(f"Current Geofences: {len(rows)}")
        for row in rows:
            print(f"- ID: {row[0]}, Name: {row[1]}, Pos: {row[2]}, {row[3]}")
