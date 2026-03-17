from typing import Any, List, Optional, Dict
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from datetime import datetime, date
from app.api import deps
from app.models.attendance import Attendance
from app.models.geofence import Geofence
from app.schemas import attendance as attendance_schema
from app.utils.geo import haversine_distance

router = APIRouter()

@router.get("/today-status")
def get_today_attendance_status(
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user),
) -> Dict[str, bool]:
    """Get attendance status for all sessions today"""
    today = date.today()
    records = db.query(Attendance).filter(
        Attendance.user_id == current_user.id,
        Attendance.session_name.isnot(None),
    ).all()
    
    # Filter to today's records
    today_records = [r for r in records if r.check_in_time.date() == today]
    
    return {
        "Morning": any(r.session_name == "Morning" for r in today_records),
        "Afternoon": any(r.session_name == "Afternoon" for r in today_records),
        "Evening": any(r.session_name == "Evening" for r in today_records),
    }

@router.get("/history", response_model=List[attendance_schema.Attendance])
def read_my_attendance(
    db: Session = Depends(deps.get_db),
    current_user = Depends(deps.get_current_active_user),
) -> Any:
    return db.query(Attendance).filter(Attendance.user_id == current_user.id).order_by(Attendance.check_in_time.desc()).all()

@router.post("/check-in", response_model=attendance_schema.Attendance)
def check_in(
    *,
    db: Session = Depends(deps.get_db),
    check_in_in: attendance_schema.AttendanceCheckIn,
    current_user = Depends(deps.get_current_active_user),
    request: Request
) -> Any:
    # Validate geofence
    if current_user.assigned_geofence_id and current_user.assigned_geofence_id != check_in_in.geofence_id:
        raise HTTPException(status_code=400, detail="You can only check in at your assigned location")

    geofence = db.query(Geofence).filter(Geofence.id == check_in_in.geofence_id).first()
    if not geofence:
        raise HTTPException(status_code=404, detail="Geofence not found")
    
    # Calculate distance
    distance = haversine_distance(
        check_in_in.latitude, check_in_in.longitude,
        geofence.latitude, geofence.longitude
    )
    
    if distance > geofence.radius:
        raise HTTPException(
            status_code=400, 
            detail=f"Outside geofence area. Distance: {distance:.2f}m, Max allowed: {geofence.radius}m"
        )
    
    # Check if already checked in for this session today
    today = date.today()
    existing = db.query(Attendance).filter(
        Attendance.user_id == current_user.id,
        Attendance.session_name == check_in_in.session_name
    ).all()
    
    # Filter to today's records
    today_existing = [r for r in existing if r.check_in_time.date() == today]
    
    if today_existing:
        raise HTTPException(status_code=400, detail=f"Already checked in for {check_in_in.session_name} session today")
    
    db_obj = Attendance(
        user_id=current_user.id,
        geofence_id=geofence.id,
        check_in_lat=check_in_in.latitude,
        check_in_long=check_in_in.longitude,
        check_in_accuracy=check_in_in.accuracy,
        ip_address=request.client.host,
        browser_info=request.headers.get("user-agent"),
        session_name=check_in_in.session_name
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.post("/check-out", response_model=attendance_schema.Attendance)
def check_out(
    *,
    db: Session = Depends(deps.get_db),
    check_out_in: attendance_schema.AttendanceCheckOut,
    current_user = Depends(deps.get_current_active_user),
) -> Any:
    attendance = db.query(Attendance).filter(
        Attendance.user_id == current_user.id,
        Attendance.check_out_time == None
    ).first()
    
    if not attendance:
        raise HTTPException(status_code=400, detail="Not checked in")
    
    attendance.check_out_time = datetime.utcnow()
    attendance.check_out_lat = check_out_in.latitude
    attendance.check_out_long = check_out_in.longitude
    
    duration = (attendance.check_out_time - attendance.check_in_time).total_seconds() / 60
    attendance.total_duration = int(duration)
    
    db.add(attendance)
    db.commit()
    db.refresh(attendance)
    return attendance
