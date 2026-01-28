from sqlalchemy import create_engine
from app.db.session import SessionLocal, Base, engine
from app.models.user import User, UserRole
from app.models.geofence import Geofence
from app.core.security import get_password_hash

def init_db():
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    # Create admin user if not exists
    admin = db.query(User).filter(User.email == "admin@example.com").first()
    if not admin:
        admin = User(
            email="admin@example.com",
            hashed_password=get_password_hash("admin123"),
            full_name="System Admin",
            role=UserRole.ADMIN,
            is_active=True
        )
        db.add(admin)
        print("Admin user created: admin@example.com / admin123")
    
    # Create employee user if not exists
    employee = db.query(User).filter(User.email == "user@example.com").first()
    if not employee:
        employee = User(
            email="user@example.com",
            hashed_password=get_password_hash("user123"),
            full_name="John Employee",
            role=UserRole.EMPLOYEE,
            is_active=True,
            department="Engineering"
        )
        db.add(employee)
        print("Employee user created: user@example.com / user123")
    
    # Create sample geofence if not exists
    geofence = db.query(Geofence).filter(Geofence.name == "Main Office").first()
    if not geofence:
        geofence = Geofence(
            name="Main Office",
            description="Corporate Headquarters",
            latitude=12.9716,  # Bangalore center
            longitude=77.5946, 
            radius=100.0,
            is_active=True
        )
        db.add(geofence)
        print("Sample geofence 'Main Office' created")
    
    db.commit()
    db.close()

if __name__ == "__main__":
    init_db()
    print("Database initialization complete.")
