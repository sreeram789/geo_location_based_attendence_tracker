from sqlalchemy import Boolean, Column, Integer, String, Enum, ForeignKey
from sqlalchemy.orm import relationship
import enum
from app.db.session import Base

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    EMPLOYEE = "employee"
    STUDENT = "student"
    MANAGER = "manager"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    role = Column(String, default=UserRole.EMPLOYEE)
    is_active = Column(Boolean, default=True)
    department = Column(String, nullable=True)
    assigned_geofence_id = Column(Integer, ForeignKey("geofences.id"), nullable=True)

    assigned_geofence = relationship("Geofence", backref="users")
