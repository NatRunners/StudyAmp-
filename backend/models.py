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
    average_attention: Optional[float] = None
    attention_scores: List[float] = []  # Add this field
    summaries: Optional[List[str]] = None
    attention_drops: Optional[List[Dict]] = None

class EEGData(BaseModel):
    timestamp: float
    attention_score: float
    eeg_channels: List[List[float]]
    device_status: Dict[str, float]