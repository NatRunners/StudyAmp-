import numpy as np
from scipy.signal import butter, lfilter, welch
from enum import Enum

class Band(Enum):
    Delta = (0.5, 4)
    Theta = (4, 8) 
    Alpha = (8, 13)
    Beta = (13, 30)
    Gamma = (30, 50)

class SignalProcessor:
    def __init__(self):
        self.lowcut = 0.5  # Lowered to capture delta waves
        self.highcut = 50.0  # Increased to capture gamma waves
        self.fs = 256.0  # EEG sampling rate
        self.ppg_fs = 64.0  # PPG sampling rate
        self.acc_fs = 52.0  # Accelerometer sampling rate
        self.order = 5
        self.channels = ['TP9', 'AF7', 'AF8', 'TP10']

    def detect_motion_artifacts(self, acc_data, gyro_data):
        # Detect excessive head movement
        acc_threshold = 1.5  # g
        gyro_threshold = 50  # degrees/s
        
        acc_magnitude = np.sqrt(np.sum(acc_data**2, axis=0))
        gyro_magnitude = np.sqrt(np.sum(gyro_data**2, axis=0))
        
        motion_score = 1.0 - min(1.0, (
            np.mean(acc_magnitude) / acc_threshold + 
            np.mean(gyro_magnitude) / gyro_threshold
        ) / 2)
        
        return motion_score

    def calculate_hrv_features(self, ppg_data):
        # Calculate HRV from PPG signal
        # Higher HRV often indicates better attention/focus
        if len(ppg_data) < self.ppg_fs * 10:  # Need at least 10s
            return 0.5  # Default middle value
            
        # Simple HRV score based on PPG peak intervals
        peaks = self.find_ppg_peaks(ppg_data)
        if len(peaks) < 2:
            return 0.5
            
        intervals = np.diff(peaks) / self.ppg_fs  # Convert to seconds
        hrv_score = min(1.0, np.std(intervals) / 0.1)  # Normalize
        
        return hrv_score

    def find_ppg_peaks(self, ppg_data):
        from scipy.signal import find_peaks
        peaks, _ = find_peaks(ppg_data, distance=self.ppg_fs*0.5)  # Min 0.5s between peaks
        return peaks

    def calculate_band_power(self, data, band):
        freqs, psd = welch(data, fs=self.fs, nperseg=256)
        freq_mask = (freqs >= band[0]) & (freqs <= band[1])
        return np.mean(psd[freq_mask])

    def calculate_attention(self, filtered_data):
        # Calculate power in each frequency band for each channel
        band_powers = {}
        for i, channel in enumerate(self.channels):
            channel_data = filtered_data[i]
            band_powers[channel] = {
                band: self.calculate_band_power(channel_data, band.value)
                for band in Band
            }

        # Calculate components
        alpha_suppression = 1 - np.mean([
            band_powers[ch][Band.Alpha] for ch in self.channels
        ])
        
        beta_engagement = np.mean([
            band_powers[ch][Band.Beta] for ch in self.channels
        ])

        # Calculate frontal asymmetry
        left_alpha = band_powers['AF7'][Band.Alpha]
        right_alpha = band_powers['AF8'][Band.Alpha]
        faa = (right_alpha - left_alpha) / (right_alpha + left_alpha)

        # Combine scores with weights
        score = (
            alpha_suppression * 40 +
            beta_engagement * 30 +
            ((faa + 1) / 2) * 30
        )

        return float(max(0, min(100, score)))

    # Keep existing methods
    def butter_bandpass(self, lowcut, highcut, fs, order=5):
        nyq = 0.5 * fs
        low = lowcut / nyq
        high = highcut / nyq
        b, a = butter(order, [low, high], btype='band')
        return b, a

    def filter_signal(self, data):
        b, a = self.butter_bandpass(self.lowcut, self.highcut, self.fs, self.order)
        filtered = lfilter(b, a, data, axis=0)
        return filtered

    # def calculate_attention(self, filtered_data):
    #     # Calculate power in each frequency band for each channel
    #     band_powers = {}
    #     for i, channel in enumerate(self.channels):
    #         channel_data = filtered_data[i]
    #         band_powers[channel] = {
    #             band: self.calculate_band_power(channel_data, band.value)
    #             for band in Band
    #         }

    #     # Calculate components
    #     alpha_suppression = 1 - np.mean([
    #         band_powers[ch][Band.Alpha] for ch in self.channels
    #     ])
        
    #     beta_engagement = np.mean([
    #         band_powers[ch][Band.Beta] for ch in self.channels
    #     ])

    #     # Calculate frontal asymmetry
    #     left_alpha = band_powers['AF7'][Band.Alpha]
    #     right_alpha = band_powers['AF8'][Band.Alpha]
    #     faa = (right_alpha - left_alpha) / (right_alpha + left_alpha)

    #     # Combine scores with weights
    #     score = (
    #         alpha_suppression * 40 +
    #         beta_engagement * 30 +
    #         ((faa + 1) / 2) * 30
    #     )

    #     return float(max(0, min(100, score)))

    def calculate_comprehensive_score(self, eeg_data, ppg_data, acc_data, gyro_data):
        # Calculate EEG-based attention score
        attention_score = self.calculate_attention(eeg_data)
        
        # Calculate motion artifact score
        motion_score = self.detect_motion_artifacts(acc_data, gyro_data)
        
        # Calculate HRV-based focus score
        hrv_score = self.calculate_hrv_features(ppg_data)
        
        # Combine scores with weights
        # 60% EEG, 20% motion, 20% HRV
        composite_score = (
            attention_score * 0.6 * motion_score +  # Motion affects EEG reliability
            hrv_score * 20
        )
        
        return {
            'composite_score': float(max(0, min(100, composite_score))),
            'attention_score': attention_score,
            'motion_score': motion_score * 100,
            'hrv_score': hrv_score * 100,
        }