"""
Script to update all geofence radii to 2km (2000m)
"""
from sqlalchemy import create_engine
from app.db.session import SessionLocal, Base, engine
from app.models.geofence import Geofence

def update_geofence_radius(new_radius: float = 2000.0):
    db = SessionLocal()
    
    try:
        geofences = db.query(Geofence).all()
        
        if not geofences:
            print("No geofences found in database.")
            return
        
        print(f"Found {len(geofences)} geofence(s):")
        for gf in geofences:
            print(f"  - ID {gf.id}: '{gf.name}' - Current radius: {gf.radius}m")
        
        print(f"\nUpdating all geofences to {new_radius}m radius...")
        
        for gf in geofences:
            gf.radius = new_radius
            db.add(gf)
        
        db.commit()
        
        print("SUCCESS: All geofences updated successfully!")
        
        # Verify
        geofences = db.query(Geofence).all()
        for gf in geofences:
            print(f"  - ID {gf.id}: '{gf.name}' - New radius: {gf.radius}m")
            
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    update_geofence_radius(2000.0)
