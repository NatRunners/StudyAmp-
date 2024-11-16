import numpy as np
from scipy.signal import butter, filtfilt, welch, lfilter
from enum import Enum
import warnings

# Suppress specific warnings
warnings.filterwarnings("ignore", message="nperseg = 256 is greater than input length")
warnings.filterwarnings("ignore", message="Mean of empty slice.")
warnings.filterwarnings("ignore", message="invalid value encountered in scalar divide")

class Band(Enum):
    Delta = (0.5, 4)
    Theta = (4, 8) 
    Alpha = (8, 13)
    Beta = (13, 30)
    Gamma = (30, 100)

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
        # Convert lists to NumPy arrays
        acc_data = np.array(acc_data)
        gyro_data = np.array(gyro_data)

        # Handle empty data cases
        if acc_data.size == 0 or gyro_data.size == 0:
            return 0.0  # Return a default motion score if data is empty

        # Detect excessive head movement
        acc_threshold = 1.5  # g
        gyro_threshold = 50  # degrees/s

        # Calculate the magnitude of the accelerometer and gyroscope data
        acc_magnitude = np.sqrt(np.sum(acc_data**2, axis=1))
        gyro_magnitude = np.sqrt(np.sum(gyro_data**2, axis=1))

        # Calculate motion score
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
        
         # Detect motion artifacts
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
    
    def calculate_focus_score(self, eeg_data, sampling_rate=256):
        """
        Calculate focus score from EEG data
        Parameters:
            eeg_data: numpy array of shape (channels, samples)
            sampling_rate: int, sampling frequency in Hz
        Returns:
            focus_score: float between 0 and 100
        """
        # Define frequency bands
        THETA = (4, 8)
        ALPHA = (8, 12)
        SMR = (12, 15)    # Sensorimotor rhythm
        MID_BETA = (15, 20)
        BETA = (12, 30)
        
        def get_band_power(data, band, sampling_rate):
            """Calculate power in specific frequency band using welch method"""
            f, psd = welch(data, fs=sampling_rate, nperseg=sampling_rate)
            idx = np.logical_and(f >= band[0], f <= band[1])
            return np.mean(psd[idx])

        # Calculate band powers for each channel
        channel_scores = []
        for channel_data in eeg_data:
            # Get band powers
            theta_power = get_band_power(channel_data, THETA, sampling_rate)
            alpha_power = get_band_power(channel_data, ALPHA, sampling_rate)
            smr_power = get_band_power(channel_data, SMR, sampling_rate)
            mid_beta_power = get_band_power(channel_data, MID_BETA, sampling_rate)
            beta_power = get_band_power(channel_data, BETA, sampling_rate)
            
            # Calculate component ratios
            beta_theta_ratio = beta_power / theta_power
            smr_midbeta_theta_ratio = (smr_power + mid_beta_power) / theta_power
            alpha_beta_ratio = alpha_power / beta_power
            
            # Combine ratios with empirically determined weights
            channel_score = (
                0.4 * beta_theta_ratio +
                0.4 * smr_midbeta_theta_ratio +
                -0.2 * alpha_beta_ratio  # Inverse relationship
            )
            
            channel_scores.append(channel_score)
        
        # Normalize to 0-100 scale
        final_score = np.mean(channel_scores)
        normalized_score = 100 * (final_score - 2) / 24  # Assuming typical range 2-26
        
        return np.clip(normalized_score, 0, 100)
    
    def calculate_concentration_score(self, eeg_data, sampling_rate=256):
        """
        Calculate concentration score using Beta/Theta ratio for frontal channels.
        Parameters:
            eeg_data: numpy array of shape (channels, samples)
            sampling_rate: int, sampling frequency in Hz
        Returns:
            concentration_score: float between 0 and 100
        """
        # Define frequency bands
        THETA_BAND = (4, 8)
        BETA_BAND = (12, 30)

        def get_band_power(data, band):
            f, psd = welch(data, fs=sampling_rate, nperseg=min(len(data), sampling_rate))
            idx = np.logical_and(f >= band[0], f <= band[1])
            return np.mean(psd[idx]) if np.any(idx) else 0.0

        # Focus on frontal channels (e.g., channels 0 and 1)
        frontal_channels = eeg_data[:2]
        ratios = []
        for channel_data in frontal_channels:
            theta_power = get_band_power(channel_data, THETA_BAND)
            beta_power = get_band_power(channel_data, BETA_BAND)
            # Avoid division by zero
            ratio = beta_power / theta_power if theta_power != 0 else 0.0
            ratios.append(ratio)

        # Average the ratios
        average_ratio = np.mean(ratios)

        # Normalize the score based on expected ratio range (e.g., 1.8 to 2.4)
        normalized_score = (average_ratio - 1.8) / 0.6
        concentration_score = np.clip(normalized_score, 0, 1)
        return float(concentration_score)

    def calculate_immersion_score(self, eeg_data, sampling_rate=256):
        """
        Calculate immersion score using Theta/Alpha ratio for occipital channels.
        Parameters:
            eeg_data: numpy array of shape (channels, samples)
            sampling_rate: int, sampling frequency in Hz
        Returns:
            immersion_score: float between 0 and 100
        """
        # Define frequency bands
        THETA_BAND = (4, 8)
        ALPHA_BAND = (8, 12)

        def get_band_power(data, band):
            f, psd = welch(data, fs=sampling_rate, nperseg=min(len(data), sampling_rate))
            idx = np.logical_and(f >= band[0], f <= band[1])
            return np.mean(psd[idx]) if np.any(idx) else 0.0

        # Focus on occipital channels (e.g., last two channels)
        occipital_channels = eeg_data[-2:]
        ratios = []
        for channel_data in occipital_channels:
            theta_power = get_band_power(channel_data, THETA_BAND)
            alpha_power = get_band_power(channel_data, ALPHA_BAND)
            # Avoid division by zero
            ratio = theta_power / alpha_power if alpha_power != 0 else 0.0
            ratios.append(ratio)

        # Average the ratios
        average_ratio = np.mean(ratios)

        # Normalize the score based on expected ratio range (e.g., 0.6 to 1.0)
        normalized_score = 100 * (average_ratio - 0.1) / 9.9
        immersion_score = np.clip(normalized_score, 0, 100)
        return float(immersion_score)