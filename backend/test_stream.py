import asyncio
from datetime import datetime, timezone
from rich.live import Live
from rich.table import Table
from device_manager import DeviceManager
from signal_processor import SignalProcessor
from models import EEGData
import numpy as np
from collections import deque
from rich.console import Console
from rich.panel import Panel
from rich.layout import Layout
from rich.text import Text
from rich.progress_bar import ProgressBar

# Initialize history deque for concentration levels
concentration_history = deque(maxlen=100)

def create_table(eeg_data):
    table = Table(title="EEG Data Stream")
    table.add_column("Channel")
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

def create_display(eeg_data):
    # Update concentration history with the latest attention score
    concentration_history.append(eeg_data.attention_score)

    layout = Layout()
    layout.split_column(
        Panel(
            ProgressBar(total=100, completed=int(eeg_data.attention_score), width=50),
            title=f"Concentration Score: {eeg_data.attention_score:.1f}",
            subtitle="Alpha Suppression | Beta Engagement | Frontal Asymmetry"
        ),
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

                # Calculate attention score
                attention_score = await asyncio.get_event_loop().run_in_executor(
                    None, signal_processor.calculate_attention, filtered_data)

                # Prepare EEG channel data
                eeg_channels = filtered_data.tolist()  # Now a list of lists

                # Create EEGData instance
                eeg_data = EEGData(
                    timestamp=datetime.now(timezone.utc).timestamp(),
                    attention_score=attention_score,
                    eeg_channels=eeg_channels,
                    device_status={"battery": 80}
                )

                display = create_display(eeg_data)
                live.update(display)
                await asyncio.sleep(0.25)
    finally:
        device_manager.stop()

if __name__ == "__main__":
    asyncio.run(stream_to_terminal())
