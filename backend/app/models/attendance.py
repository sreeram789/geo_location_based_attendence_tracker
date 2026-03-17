from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base
import uuid

class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    geofence_id = Column(Integer, ForeignKey("geofences.id", ondelete="SET NULL"), nullable=True)
    
    check_in_time = Column(DateTime(timezone=True), server_default=func.now())
    check_in_lat = Column(Float, nullable=False)
    check_in_long = Column(Float, nullable=False)
    check_in_accuracy = Column(Float, nullable=True)
    
    check_out_time = Column(DateTime(timezone=True), nullable=True)
    check_out_lat = Column(Float, nullable=True)
    check_out_long = Column(Float, nullable=True)
    
    total_duration = Column(Integer, nullable=True)  # Duration in minutes
    is_auto_checkout = Column(Boolean, default=False)
    remarks = Column(String, nullable=True)
    ip_address = Column(String, nullable=True)
    browser_info = Column(String, nullable=True)
    session_name = Column(String, nullable=True)

    user = relationship("User", backref="attendance_records")
    geofence = relationship("Geofence", backref="attendance_records")
