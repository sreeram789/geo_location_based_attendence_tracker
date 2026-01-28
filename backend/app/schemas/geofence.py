from typing import Optional
from pydantic import BaseModel

class GeofenceBase(BaseModel):
    name: str
    description: Optional[str] = None
    latitude: float
    longitude: float
    radius: float
    is_active: Optional[bool] = True

class GeofenceCreate(GeofenceBase):
    pass

class GeofenceUpdate(GeofenceBase):
    name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    radius: Optional[float] = None

class Geofence(GeofenceBase):
    id: int

    class Config:
        from_attributes = True
