# artifact_detector.py
import asyncio
import numpy as np
from datetime import datetime, timezone
from rich.live import Live
from rich.panel import Panel
from rich.text import Text
from device_manager import DeviceManager
from signal_processor import SignalProcessor

class ArtifactDetector:
    def __init__(self):
        self.buffer_size = 512  # Increased buffer size for more data
        self.data_buffer = np.zeros((4, self.buffer_size))
        self.buffer_index = 0

    def update_buffer(self, new_data):
        num_samples = new_data.shape[1]
        if num_samples >= self.buffer_size:
            self.data_buffer[:, -num_samples:] = new_data[:self.data_buffer.shape[0], -num_samples:] if new_data.shape[0] == self.data_buffer.shape[0] else new_data[:self.data_buffer.shape[0], -num_samples:].reshape(self.data_buffer.shape[0], -1)
            self.buffer_index = self.buffer_size
        else:
            self.data_buffer = np.roll(self.data_buffer, -num_samples, axis=1)
            self.data_buffer[:, -num_samples:] = new_data[:self.data_buffer.shape[0], -num_samples:]
            self.buffer_index = min(self.buffer_index + num_samples, self.buffer_size)

    def detect_blink(self):
        # Use band-pass filter to isolate blink-related frequencies
        # Blinks are typically low-frequency (< 4 Hz) signals
        blink_band = (0.5, 4)
        frontal_channels = self.data_buffer[1:3, -self.buffer_size:]  # AF7 and AF8
        power = self.calculate_band_power(frontal_channels, blink_band)
        blink_threshold = 80  # Adjusted threshold
        return np.any(power > blink_threshold)

    def detect_jaw_clench(self):
        # Jaw clenches are high-frequency artifacts
        clench_band = (20, 60)
        all_channels = self.data_buffer[:, -self.buffer_size:]
        power = self.calculate_band_power(all_channels, clench_band)
        normalized_power = power / np.max(power)  # Normalize power values
        clench_threshold = 0.8  # Adjusted threshold for normalized power
        return np.any(normalized_power > clench_threshold)

    def detect_alpha_burst(self):
        # Alpha bursts in the 8-13 Hz band
        alpha_band = (8, 13)
        occipital_channels = self.data_buffer[2:4, -self.buffer_size:]  # Assuming channels 2 and 3 are occipital
        power = self.calculate_band_power(occipital_channels, alpha_band)
        alpha_threshold = 30  # Adjusted threshold
        return np.all(power > alpha_threshold)

    def calculate_band_power(self, data, band):
        from scipy.signal import welch
        fs = 256  # Sampling frequency
        band = np.asarray(band)
        power = []
        for channel_data in data:
            f, Pxx = welch(channel_data, fs=fs, nperseg=256)
            idx_band = np.logical_and(f >= band[0], f <= band[1])
            band_power = np.sum(Pxx[idx_band])
            power.append(band_power)
        return np.array(power)

def create_artifact_display(detections):
    text = Text()
    for event, detected in detections.items():
        status = "✓" if detected else "✗"
        color = "green" if detected else "red"
        text.append(f"{event}: {status}\n", style=color)
    return Panel(text, title="Artifact Detection")

async def main():
    device_manager = DeviceManager()
    signal_processor = SignalProcessor()
    artifact_detector = ArtifactDetector()

    try:
        with Live(refresh_per_second=4) as live:
            while True:
                raw_data = device_manager.get_data()  # Should return numpy array of shape (channels, samples)
                if raw_data is None or raw_data.size == 0:
                    continue

                artifact_detector.update_buffer(raw_data)

                detections = {
                    "Eye Blink": artifact_detector.detect_blink(),
                    "Jaw Clench": artifact_detector.detect_jaw_clench(),
                    "Alpha Burst": artifact_detector.detect_alpha_burst()
                }

                display = create_artifact_display(detections)
                live.update(display)
                await asyncio.sleep(0.25)

    finally:
        device_manager.stop()

if __name__ == "__main__":
    asyncio.run(main())