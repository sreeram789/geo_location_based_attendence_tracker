from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class AttendanceBase(BaseModel):
    geofence_id: int

class AttendanceCheckIn(AttendanceBase):
    latitude: float
    longitude: float
    accuracy: Optional[float] = None
    session_name: Optional[str] = None

class AttendanceCheckOut(BaseModel):
    latitude: float
    longitude: float

class Attendance(AttendanceBase):
    id: str
    user_id: int
    check_in_time: datetime
    check_in_lat: float
    check_in_long: float
    check_out_time: Optional[datetime] = None
    total_duration: Optional[int] = None
    session_name: Optional[str] = None

    class Config:
        from_attributes = True
