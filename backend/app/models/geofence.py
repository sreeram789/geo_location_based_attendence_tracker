from sqlalchemy import Column, Integer, String, Float, Boolean
from app.db.session import Base

class Geofence(Base):
    __tablename__ = "geofences"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    description = Column(String, nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    radius = Column(Float, nullable=False)  # In meters
    is_active = Column(Boolean, default=True)
