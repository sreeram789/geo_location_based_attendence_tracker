from fastapi import APIRouter
from app.api.v1.endpoints import login, users, geofences, attendance, ws, attendance_admin

api_router = APIRouter()
api_router.include_router(login.router, tags=["login"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(geofences.router, prefix="/geofences", tags=["geofences"])
api_router.include_router(attendance.router, prefix="/attendance", tags=["attendance"])
api_router.include_router(attendance_admin.router, prefix="/admin/attendance", tags=["admin-attendance"])
api_router.include_router(ws.router, tags=["websocket"])
