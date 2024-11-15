from models import SessionData, EEGData
from typing import Dict, List
from datetime import datetime, timezone
import asyncio
import uuid
import logging
from device_manager import DeviceManager
from fastapi.websockets import WebSocket
from signal_processor import SignalProcessor
from asyncio import Lock

class SessionManager:
    def __init__(self):
        self.sessions: Dict[str, SessionData] = {}
        self.websockets: Dict[str, List[WebSocket]] = {}
        self.locks: Dict[str, Lock] = {}

    def create_session(self):
        session_id = str(uuid.uuid4())
        session = SessionData(
            session_id=session_id,
            start_time=datetime.now(timezone.utc),
            user_id="user_1",
            device_id="device_1",
            status="active"
        )
        self.sessions[session_id] = session
        self.websockets[session_id] = []
        self.locks[session_id] = Lock()
        # Start data streaming task
        asyncio.create_task(self.stream_data(session_id))
        return session

    def end_session(self, session_id: str):
        if session_id in self.sessions:
            self.sessions[session_id].status = "ended"
            self.sessions[session_id].end_time = datetime.now(timezone.utc)
            # Clean up resources
            del self.locks[session_id]
            del self.websockets[session_id]

    def get_status(self, session_id: str):
        session = self.sessions.get(session_id)
        if session:
            return {"status": session.status}
        else:
            return {"status": "not found"}

    def get_session(self, session_id: str):
        return self.sessions.get(session_id)

    async def stream_data(self, session_id: str):
        # Instantiate device and signal processors per session
        device_manager = DeviceManager()
        signal_processor = SignalProcessor()
        try:
            while True:
                session = self.sessions.get(session_id)
                if not session or session.status != "active":
                    break  # Exit if session is not active

                # Fetch and process data asynchronously
                raw_data = await asyncio.get_event_loop().run_in_executor(
                    None, device_manager.get_data)
                if len(raw_data) == 0:
                    logging.warning("No data received from device.")
                    await asyncio.sleep(0.25)
                    continue

                filtered_data = await asyncio.get_event_loop().run_in_executor(
                    None, signal_processor.filter_signal, raw_data)
                attention_score = await asyncio.get_event_loop().run_in_executor(
                    None, signal_processor.calculate_attention, filtered_data)
                eeg_data = EEGData(
                    timestamp=datetime.utcnow().timestamp(),
                    attention_score=attention_score,
                    eeg_channels=filtered_data.tolist(),
                    device_status={"battery": 80}
                )

                # Broadcast data to all connected websockets
                async with self.locks[session_id]:
                    for websocket in self.websockets[session_id]:
                        try:
                            await websocket.send_json(eeg_data.model_dump())
                        except Exception as e:
                            logging.error(f"Failed to send data: {e}")
                            await websocket.close()
                            self.websockets[session_id].remove(websocket)

                await asyncio.sleep(0.25)  # Adjust streaming rate as needed
        except Exception as e:
            logging.error(f"Error in stream_data: {e}")
        finally:
            device_manager.stop()

    def register_websocket(self, session_id: str, websocket):
        if session_id in self.websockets:
            self.websockets[session_id].append(websocket)
        else:
            self.websockets[session_id] = [websocket]

    def unregister_websocket(self, session_id: str, websocket):
        if session_id in self.websockets:
            if websocket in self.websockets[session_id]:
                self.websockets[session_id].remove(websocket)