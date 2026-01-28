from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.models.geofence import Geofence
from app.schemas import geofence as geofence_schema

router = APIRouter()

@router.post("/", response_model=geofence_schema.Geofence)
def create_geofence(
    *,
    db: Session = Depends(deps.get_db),
    geofence_in: geofence_schema.GeofenceCreate,
    current_user = Depends(deps.get_current_active_admin),
) -> Any:
    db_obj = Geofence(**geofence_in.model_dump())
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.get("/", response_model=List[geofence_schema.Geofence])
def read_geofences(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user = Depends(deps.get_current_active_user),
) -> Any:
    return db.query(Geofence).offset(skip).limit(limit).all()

@router.get("/{id}", response_model=geofence_schema.Geofence)
def read_geofence(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    current_user = Depends(deps.get_current_active_user),
) -> Any:
    geofence = db.query(Geofence).filter(Geofence.id == id).first()
    if not geofence:
        raise HTTPException(status_code=404, detail="Geofence not found")
    return geofence
