from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from models import SessionData, EEGData
from device_manager import DeviceManager
from signal_processor import SignalProcessor
from session_manager import SessionManager
from datetime import datetime, timezone
from starlette.middleware.cors import CORSMiddleware
import asyncio
import logging

app = FastAPI()

# security stuff
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Allows only your React app's origin
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers
)

# Initialize managers
# device_manager = DeviceManager()
# signal_processor = SignalProcessor()
session_manager = SessionManager()

@app.post("/api/sessions")
async def create_session():
    return session_manager.create_session()

@app.delete("/api/sessions/{session_id}")
async def end_session(session_id: str):
    session_manager.end_session(session_id)
    return {"message": "Session ended"}

@app.get("/api/sessions/{session_id}/status")
async def get_session_status(session_id: str):
    return session_manager.get_status(session_id)

@app.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    # Validate session ID
    session = session_manager.get_session(session_id)
    if not session or session.status != "active":
        await websocket.close(code=1008)  # Policy Violation
        return
    
    await websocket.accept()
    session_manager.register_websocket(session_id, websocket)
    try:
        while True:
            message = await websocket.receive_text()  # Keep the connection alive
            # No need to process incoming messages in this case
    except WebSocketDisconnect:
        session_manager.unregister_websocket(session_id, websocket)
    except Exception as e:
        logging.error(f"WebSocket error: {e}")
        await websocket.close(code=1011)
