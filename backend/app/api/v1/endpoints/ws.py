from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from app.api import deps
from app.api.websocket_manager import manager
from jose import jwt, JWTError
from app.core.config import settings
from app.core.security import ALGORITHM

router = APIRouter()

@router.websocket("/ws/{token}")
async def websocket_endpoint(websocket: WebSocket, token: str):
    # Manual token verification for WebSocket since Depends doesn't work well here
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload.get("sub"))
    except (JWTError, ValueError):
        await websocket.close(code=1008)
        return

    await manager.connect(user_id, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            # Handle incoming location data from frontend
            # This can be used for the periodic verification
            print(f"Received location from user {user_id}: {data}")
    except WebSocketDisconnect:
        manager.disconnect(user_id)
