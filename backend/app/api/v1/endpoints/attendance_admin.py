from typing import Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.api import deps
from app.models.attendance import Attendance
from app.models.user import User
from app.schemas import attendance as attendance_schema

router = APIRouter()

@router.get("/all", response_model=List[attendance_schema.Attendance])
def read_all_attendance(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user = Depends(deps.get_current_active_admin),
) -> Any:
    return db.query(Attendance).order_by(Attendance.check_in_time.desc()).offset(skip).limit(limit).all()

@router.get("/stats", response_model=Any)
def get_attendance_stats(
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_admin),
) -> Any:
    total_present = db.query(func.count(Attendance.id)).filter(Attendance.check_out_time == None).scalar()
    total_users = db.query(func.count(User.id)).scalar()
    
    return {
        "present": total_present,
        "absent": total_users - total_present,
        "total": total_users
    }

