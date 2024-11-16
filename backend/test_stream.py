import asyncio
from datetime import datetime, timezone
from rich.live import Live
from rich.table import Table
from device_manager import DeviceManager
from signal_processor import SignalProcessor
from models import EEGData
import numpy as np
from collections import deque
from rich.panel import Panel
from rich.layout import Layout
from rich.text import Text
from rich.progress_bar import ProgressBar

# Initialize history deque for concentration levels
concentration_history = deque(maxlen=100)

def create_table(eeg_data):
    table = Table(title="EEG Data Stream")
    table = Table(title="EEG Data Stream", show_header=True, header_style="bold magenta")
    table.add_column("Channel")
    table.add_column("Current Value")
    table.add_column("Time")
    table.rows.clear()  # Clear previous rows to show instantaneous values
    table.add_column("Current Value")
    table.add_column("Time")
    
    current_time = datetime.now().strftime("%H:%M:%S")
    
    for i, channel in enumerate(eeg_data.eeg_channels):
        if isinstance(channel, (list, np.ndarray)) and len(channel) > 0:
            # Take only the most recent value
            current_value = channel[-1] if isinstance(channel, list) else channel
            table.add_row(
                f"Channel {i+1}", 
                f"{float(current_value):.2f}",
                current_time
            )
        else:
            table.add_row(f"Channel {i+1}", "No Data", current_time)
    return table

def create_concentration_graph():
    graph = ""
    max_length = 50  # Width of the graph
    if concentration_history:
        normalized = [int((value / max(concentration_history)) * max_length) if max(concentration_history) > 0 else 0 for value in concentration_history]
        bars = ''.join(['█' * value for value in normalized])
    else:
        bars = ''
    graph += f"Concentration: {bars}\n"
    return graph

def create_display(eeg_data, focus_score, concentration_score, immersion_score):
    # Update concentration history with the latest attention score
    concentration_history.append(eeg_data.attention_score)

    layout = Layout()
    layout.split_column(
        *[
            Panel(
                ProgressBar(total=100, completed=int(score), width=50),
                title=f"{title}: {score:.1f}",
                subtitle="Alpha Suppression | Beta Engagement | Frontal Asymmetry"
            )
            for score, title in zip(
                [eeg_data.attention_score, focus_score, concentration_score, immersion_score],
                ["Attention Score", "Focus Score", "Concentration Score", "Immersion Score"]
            )
        ],
        Panel(
            Text(create_concentration_graph()),
            title="Concentration Levels Over Time",
            border_style="green"
        ),
        create_table(eeg_data)
    )
    return layout

async def stream_to_terminal():
    device_manager = DeviceManager()
    signal_processor = SignalProcessor()

    try:
        with Live(refresh_per_second=4) as live:
            while True:
                # Fetch raw data
                raw_data = await asyncio.get_event_loop().run_in_executor(
                    None, device_manager.get_data)
                if len(raw_data) == 0:
                    continue  # Skip if no data received

                # Filter signal
                filtered_data = await asyncio.get_event_loop().run_in_executor(
                    None, signal_processor.filter_signal, raw_data)
                filtered_data = np.nan_to_num(filtered_data, nan=0.0)

                # Placeholder data for PPG, accelerometer, and gyroscope
                ppg_data = []   # Replace with actual PPG data if available
                acc_data = []   # Replace with actual accelerometer data if available
                gyro_data = []  # Replace with actual gyroscope data if available

                # Calculate comprehensive scores
                scores = await asyncio.get_event_loop().run_in_executor(
                    None, signal_processor.calculate_comprehensive_score,
                    filtered_data, ppg_data, acc_data, gyro_data
                )

                # Calculate focus score
                focus_score = signal_processor.calculate_focus_score(filtered_data)
                focus_score = np.nan_to_num(focus_score, nan=0.0)  # Ensure focus_score is a valid number

                # Calculate concentration score
                concentration_score = signal_processor.calculate_concentration_score(filtered_data)
                concentration_score = np.nan_to_num(concentration_score, nan=0.0)  # Ensure score is a valid number

                # Calculate immersion score
                immersion_score = signal_processor.calculate_immersion_score(filtered_data)
                immersion_score = np.nan_to_num(immersion_score, nan=0.0)  # Ensure immersion_score is a valid number

                # Prepare EEGData instance
                eeg_channels = filtered_data.tolist()  # Now a list of lists
                eeg_data = EEGData(
                    timestamp=datetime.now(timezone.utc).timestamp(),
                    attention_score=scores['attention_score'],
                    eeg_channels=eeg_channels,
                    device_status={"battery": 80}
                )

                display = create_display(eeg_data, focus_score, concentration_score, immersion_score)
                live.update(display)
                await asyncio.sleep(0.25)
    finally:
        device_manager.stop()

if __name__ == "__main__":
    asyncio.run(stream_to_terminal())

if __name__ == "__main__":
    asyncio.run(stream_to_terminal())
