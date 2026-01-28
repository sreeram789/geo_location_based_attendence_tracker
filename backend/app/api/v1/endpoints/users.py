from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api import deps
from app.core import security
from app.models.user import User, UserRole
from app.schemas import user as user_schema

router = APIRouter()

@router.post("/", response_model=user_schema.User)
def create_user(
    *,
    db: Session = Depends(deps.get_db),
    user_in: user_schema.UserCreate,
) -> Any:
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this username already exists in the system.",
        )
    
    db_obj = User(
        email=user_in.email,
        hashed_password=security.get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role=user_in.role,
        department=user_in.department,
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.get("/", response_model=List[user_schema.User])
def read_users(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user = Depends(deps.get_current_active_admin),
) -> Any:
    return db.query(User).offset(skip).limit(limit).all()

@router.patch("/{id}", response_model=user_schema.User)
def update_user(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    user_in: user_schema.UserUpdate,
    current_user = Depends(deps.get_current_active_admin),
) -> Any:
    user = db.query(User).filter(User.id == id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    update_data = user_in.model_dump(exclude_unset=True)
    if "password" in update_data:
        update_data["hashed_password"] = security.get_password_hash(update_data.pop("password"))
    
    for field, value in update_data.items():
        setattr(user, field, value)
    
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.get("/me", response_model=user_schema.User)
def read_user_me(
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    return current_user
