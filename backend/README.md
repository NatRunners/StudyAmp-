```markdown
# EEG Analysis Backend API

Real-time EEG data processing and analysis backend using FastAPI and Muse 2 headset (with synthetic data fallback).

## Getting Started

### Prerequisites

- Python 3.11+
- Muse 2 EEG Headset (optional)
- Python packages:

```bash
pip install -r requirements.txt
```

### Running the Server

```bash
uvicorn main:app --host 0.0.0.0 --port 5000 --reload
```

Server runs on `http://localhost:5000`

## API Documentation

### Session Management

#### Create New Session
```http
POST /api/sessions
```

Response:
```json
{
    "session_id": "uuid-string",
    "start_time": "2024-01-01T00:00:00Z",
    "end_time": null,
    "user_id": "user_1",
    "device_id": "device_1", 
    "status": "active"
}
```

#### End Session
```http
DELETE /api/sessions/{session_id}
```

Response:
```json
{
    "message": "Session ended"
}
```

#### Get Session Status
```http
GET /api/sessions/{session_id}/status
```

Response:
```json
{
    "status": "active|ended|not found"
}
```

### Real-time Data Streaming

#### WebSocket Connection
```
ws://localhost:5000/ws/{session_id}
```

Stream Data Format:
```json
{
    "timestamp": 1234567890.123,
    "attention_score": 75.5, [float]
    "eeg_channels": [
        [float,...],  // TP9 
        [float,...],  // AF7
        [float,...],  // AF8
        [float,...]   // TP10
    ],
    "device_status": {
        "battery": 80.0
    }
}
```

## Data Analysis

### EEG Channels
- TP9: Left ear electrode
- AF7: Left forehead electrode  
- AF8: Right forehead electrode
- TP10: Right ear electrode

### Frequency Bands
- Delta: 0.5-4 Hz
- Theta: 4-8 Hz
- Alpha: 8-13 Hz
- Beta: 13-30 Hz
- Gamma: 30-50 Hz

### Attention Score Components
- Alpha Suppression (40%)
- Beta Engagement (30%)
- Frontal Alpha Asymmetry (30%)

## Testing & Visualization

### Terminal Testing
Run visual data stream test:
```bash
python test_stream.py
```

Displays:
- Real-time concentration score (0-100)
- EEG channel values
- Historical concentration graph
- Artifact detection

## Technical Details

- Sample Rate: 256 Hz
- Data Buffer Size: 100 samples
- WebSocket Update Rate: 4 Hz (250ms)
- Signal Filtering: 0.5-50 Hz bandpass
- Artifact Detection: Blinks, jaw clenches, motion

## Error Handling

### HTTP Status Codes
- 200: Success
- 404: Session not found
- 500: Server error

### WebSocket Close Codes  
- 1008: Invalid session
- 1011: Internal error

### Device Fallback
System automatically falls back to synthetic data generation if Muse 2 hardware is unavailable.

## Implementation Notes

Key Components:
- 

### SessionManager

- Handles session lifecycle and WebSocket connections

### DeviceManager

- Manages EEG device/synthetic data

### SignalProcessor

- EEG signal processing and attention scoring
 
### ArtifactDetector

- Detects common EEG artifacts
```