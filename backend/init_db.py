from sqlalchemy import create_engine
from app.db.session import SessionLocal, Base, engine
from app.models.user import User, UserRole
from app.models.geofence import Geofence
from app.models.attendance import Attendance
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
    
    # Create sample geofence if none exist
    geofence_count = db.query(Geofence).count()
    if geofence_count == 0:
        geofence = Geofence(
                name="BIT Campus",
                description="Bannari Amman Institute of Tech",
                latitude=11.4986,
                longitude=77.2743,
                radius=2000.0,
                is_active=True
            )
        db.add(geofence)
        print("Sample geofence 'BIT Campus' created with 2km radius")
    else:
        print(f"Skipping sample geofence creation: {geofence_count} existing perimeters found.")
    
    db.commit()
    db.close()

if __name__ == "__main__":
    init_db()
    print("Database initialization complete.")
