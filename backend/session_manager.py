import json
import os
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
        self.data_dir = 'data'
        self.data_file = os.path.join(self.data_dir, 'sessions.json')
        os.makedirs(self.data_dir, exist_ok=True)
        self.load_sessions()

    def load_sessions(self):
        try:
            if os.path.exists(self.data_file):
                with open(self.data_file, 'r') as f:
                    sessions_data = json.load(f)
                    for session_id, session_info in sessions_data.items():
                        session_info['start_time'] = datetime.fromisoformat(session_info['start_time'])
                        if session_info.get('end_time'):
                            session_info['end_time'] = datetime.fromisoformat(session_info['end_time'])
                        self.sessions[session_id] = SessionData(**session_info)
        except Exception as e:
            logging.error(f"Error loading sessions: {e}")

    def save_sessions(self):
        try:
            with open(self.data_file, 'w') as f:
                sessions_data = {
                    session_id: {
                        **session.model_dump(),
                        'start_time': session.start_time.isoformat(),
                        'end_time': session.end_time.isoformat() if session.end_time else None
                    }
                    for session_id, session in self.sessions.items()
                }
                json.dump(sessions_data, f, indent=2)
        except Exception as e:
            logging.error(f"Error saving sessions: {e}")

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
        self.save_sessions()
        # Start data streaming task
        asyncio.create_task(self.stream_data(session_id))
        return session

    def end_session(self, session_id: str):
        if session_id in self.sessions:
            self.sessions[session_id].status = "ended"
            self.sessions[session_id].end_time = datetime.now(timezone.utc)
            self.save_sessions()
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

    def get_session_details(self, session_id: str) -> dict:
        """Retrieve detailed data for a specific session"""
        session = self.sessions.get(session_id)
        if session:
            return session.model_dump()
        else:
            return {}

    def get_all_sessions(self, limit: int = 10, status: str = None):
        """Get recent sessions with optional filtering"""
        try:
            sessions = list(self.sessions.values())
            
            # Filter by status if provided
            if status:
                sessions = [s for s in sessions if s.status == status]
            
            # Sort by start time (newest first)
            sessions.sort(key=lambda x: x.start_time, reverse=True)
            
            # Apply limit
            sessions = sessions[:limit]
            
            return sessions
        except Exception as e:
            logging.error(f"Error retrieving sessions: {e}")
            return []

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

                self.update_session_metrics(session_id, attention_score)

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

    def update_session_metrics(self, session_id: str, attention_score: float, attention_drop: Dict = None):
        """Update session metrics during streaming"""
        try:
            if session_id in self.sessions:
                session = self.sessions[session_id]
                # Initialize empty list if needed
                if not session.attention_scores:
                    session.attention_scores = []
                
                # Add new score
                session.attention_scores.append(attention_score)
                
                # Update average
                if session.attention_scores:
                    session.average_attention = sum(session.attention_scores) / len(session.attention_scores)
                
                # Handle attention drops
                if attention_drop:
                    if not session.attention_drops:
                        session.attention_drops = []
                    session.attention_drops.append(attention_drop)
                
                self.save_sessions()
        except Exception as e:
            logging.error(f"Error updating session metrics: {e}")

    def update_session_summaries(self, session_id: str, summaries: List[str]):
        """Add analysis summaries to session"""
        if session_id in self.sessions:
            self.sessions[session_id].summaries = summaries
            self.save_sessions()

    def register_websocket(self, session_id: str, websocket):
        if session_id in self.websockets:
            self.websockets[session_id].append(websocket)
        else:
            self.websockets[session_id] = [websocket]

    def unregister_websocket(self, session_id: str, websocket):
        if session_id in self.websockets:
            if websocket in self.websockets[session_id]:
                self.websockets[session_id].remove(websocket)

    def delete_session(self, session_id: str):
        """Permanently delete a session and save changes"""
        try:
            if session_id in self.sessions:
                # Clean up any active connections
                if session_id in self.websockets:
                    del self.websockets[session_id]
                if session_id in self.locks:
                    del self.locks[session_id]
                
                # Remove session
                del self.sessions[session_id]
                self.save_sessions()
            else:
                raise ValueError(f"Session {session_id} not found")
        except Exception as e:
            logging.error(f"Error deleting session {session_id}: {e}")
            raise