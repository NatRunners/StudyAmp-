from datetime import datetime
from typing import List, Optional, Dict
from pydantic import BaseModel

class SessionData(BaseModel):
    session_id: str
    start_time: datetime
    end_time: Optional[datetime] = None
    user_id: str
    device_id: str
    status: str

class EEGData(BaseModel):
    timestamp: float
    attention_score: float
    eeg_channels: List[List[float]]
    device_status: Dict[str, float]