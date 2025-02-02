import { BleManager, Device } from 'react-native-ble-plx';
import { MuseDevice } from './muse';

interface StreamData {
  rawEEG: number[];
  attentionScore: number;
}

type StreamCallback = (data: StreamData) => void;

interface BandPower {
  Alpha: number;
  Beta: number;
}

class SyntheticDataGenerator {
  private sampleRate: number = 256; // Hz
  private lastTimestamp: number = Date.now();
  private channels: string[] = ['AF7', 'AF8', 'TP9', 'TP10'];
  private bandPowers: { [channel: string]: BandPower } = {};

  private generateBandPowers(): void {
    const time = Date.now() / 1000; // Current time in seconds
    
    // Generate realistic band powers that vary over time
    for (const channel of this.channels) {
      // Use different frequencies for natural variation between channels
      const alphaFreq = channel.includes('AF') ? 0.1 : 0.12;
      const betaFreq = channel.includes('AF') ? 0.15 : 0.17;
      
      // Generate power values that oscillate between 0.2 and 0.8
      this.bandPowers[channel] = {
        Alpha: 0.5 + 0.3 * Math.sin(time * alphaFreq),
        Beta: 0.5 + 0.3 * Math.sin(time * betaFreq + Math.PI/4)
      };
    }
  }

  calculateAttentionScore(): number {
    // Update band powers
    this.generateBandPowers();

    // Calculate alpha suppression (1 - mean alpha across channels)
    const alphaMean = Object.values(this.bandPowers)
      .reduce((sum, powers) => sum + powers.Alpha, 0) / this.channels.length;
    const alphaSuppression = 1 - alphaMean;

    // Calculate beta engagement (mean beta across channels)
    const betaMean = Object.values(this.bandPowers)
      .reduce((sum, powers) => sum + powers.Beta, 0) / this.channels.length;

    // Calculate frontal alpha asymmetry
    const leftAlpha = this.bandPowers['AF7'].Alpha;
    const rightAlpha = this.bandPowers['AF8'].Alpha;
    const faa = (rightAlpha - leftAlpha) / (rightAlpha + leftAlpha);

    // Combine scores with weights matching Python implementation
    const score = (
      alphaSuppression * 40 +
      betaMean * 30 +
      ((faa + 1) / 2) * 30
    );

    // Ensure score is between 0 and 100
    return Math.max(0, Math.min(100, score));
  }

  generateData(): number[] {
    const currentTime = Date.now();
    const deltaT = (currentTime - this.lastTimestamp) / 1000; // Convert to seconds
    this.lastTimestamp = currentTime;

    // Generate 4-channel EEG-like data
    const data: number[] = [];
    
    // Generate synthetic EEG data for each channel
    for (const channel of this.channels) {
      const t = currentTime / 1000; // Convert to seconds
      
      // Alpha wave (8-12 Hz) + Beta wave (13-30 Hz) + noise
      const alpha = 5 * Math.sin(2 * Math.PI * 10 * t); // 10 Hz alpha
      const beta = 3 * Math.sin(2 * Math.PI * 20 * t);  // 20 Hz beta
      const noise = (Math.random() - 0.5) * 2;          // Random noise
      
      data.push(alpha + beta + noise);
    }

    return data;
  }
}

export class DeviceManager {
  private bleManager: BleManager;
  private museDevice: MuseDevice | null = null;
  private isSyntheticMode: boolean = false;
  private streamCallback: StreamCallback | null = null;
  private syntheticInterval: ReturnType<typeof setInterval> | null = null;
  private syntheticGenerator: SyntheticDataGenerator;

  constructor() {
    this.bleManager = new BleManager();
    this.syntheticGenerator = new SyntheticDataGenerator();
  }

  async scanForMuseDevices(): Promise<Device[]> {
    return new Promise((resolve, reject) => {
      const discoveredDevices: Device[] = [];
      let scanTimeout: NodeJS.Timeout | null = null;
      
      const cleanupAndResolve = (devices: Device[]) => {
        if (scanTimeout) {
          clearTimeout(scanTimeout);
          scanTimeout = null;
        }
        this.bleManager.stopDeviceScan();
        resolve(devices);
      };

      try {
        this.bleManager.startDeviceScan(null, null, (error, device) => {
          if (error) {
            console.warn('BLE scan error:', error);
            this.enableSyntheticMode();
            // Start synthetic mode immediately on error
            this.startSyntheticStreaming().catch(console.error);
            cleanupAndResolve([]);
            return;
          }
          
          if (device && device.name && device.name.includes('Muse')) {
            discoveredDevices.push(device);
          }
        });

        scanTimeout = setTimeout(() => {
          if (discoveredDevices.length === 0) {
            console.warn('No Muse devices found, switching to synthetic mode');
            this.enableSyntheticMode();
            // Start synthetic mode when no devices are found
            this.startSyntheticStreaming().catch(console.error);
          }
          cleanupAndResolve(discoveredDevices);
        }, 10000);
      } catch (error) {
        console.error('Failed to start BLE scan:', error);
        this.enableSyntheticMode();
        // Start synthetic mode immediately on error
        this.startSyntheticStreaming().catch(console.error);
        cleanupAndResolve([]);
      }
    });
  }

  async connectToMuseDevice(device: Device): Promise<Device> {
    try {
      this.museDevice = new MuseDevice();
      await this.museDevice.connect(device.id);
      this.isSyntheticMode = false;
      return device;
    } catch (error) {
      console.warn('Failed to connect to device, switching to synthetic mode:', error);
      this.museDevice = null;
      this.enableSyntheticMode();
      // Start synthetic mode immediately on connection failure
      await this.startSyntheticStreaming();
      throw new Error('Failed to connect to device: ' + error);
    }
  }

  async startMuseStreaming(device: Device | null, onData: StreamCallback): Promise<void> {
    this.streamCallback = onData;

    if (this.isSyntheticMode || !device) {
      await this.startSyntheticStreaming();
      return;
    }

    if (!this.museDevice) {
      throw new Error('No Muse device connected');
    }

    try {
      // Start a polling interval to read EEG data and calculate attention from the Muse device
      this.syntheticInterval = setInterval(() => {
        if (this.museDevice && this.streamCallback) {
          const eegData = [];
          // Read from all 4 main EEG channels
          for (let channel = 0; channel < 4; channel++) {
            const value = this.museDevice.getEEGData(channel);
            eegData.push(value ?? 0);
          }

          const attentionScore = this.museDevice.calculateAttentionScore();

          this.streamCallback({
            rawEEG: eegData,
            attentionScore
          });
        }
      }, 50); // Poll every 50ms (20Hz)

      console.log('Muse streaming started.');
    } catch (error) {
      console.error('Failed to start Muse streaming:', error);
      this.enableSyntheticMode();
      await this.startSyntheticStreaming();
    }
  }

  private async startSyntheticStreaming(): Promise<void> {
    try {
      this.isSyntheticMode = true;
      
      // Clear any existing interval first
      if (this.syntheticInterval) {
        clearInterval(this.syntheticInterval);
        this.syntheticInterval = null;
      }
      
      // Generate synthetic data at regular intervals
      this.syntheticInterval = setInterval(() => {
        if (this.streamCallback) {
          const rawEEG = this.syntheticGenerator.generateData();
          const attentionScore = this.syntheticGenerator.calculateAttentionScore();
          
          this.streamCallback({
            rawEEG,
            attentionScore
          });
        }
      }, 50); // Update every 50ms (20Hz)

      console.log('Synthetic streaming started.');
    } catch (error) {
      console.error('Failed to start synthetic streaming:', error);
      throw error;
    }
  }

  async stopMuseStreaming(): Promise<void> {
    try {
      if (this.syntheticInterval) {
        clearInterval(this.syntheticInterval);
        this.syntheticInterval = null;
      }

      if (!this.isSyntheticMode && this.museDevice) {
        this.museDevice.disconnect();
        this.museDevice = null;
      }

      this.streamCallback = null;
      console.log(`${this.isSyntheticMode ? 'Synthetic' : 'Muse'} streaming stopped.`);
    } catch (error) {
      console.error('Failed to stop streaming:', error);
      throw error;
    }
  }

  enableSyntheticMode(): void {
    this.isSyntheticMode = true;
  }

  isInSyntheticMode(): boolean {
    return this.isSyntheticMode;
  }
}

export const deviceManager = new DeviceManager();
