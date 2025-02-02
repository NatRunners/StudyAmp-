import { BleManager, Device, Characteristic } from 'react-native-ble-plx';

class MuseCircularBuffer {
    private memory: number[];
    private head: number;
    private tail: number;
    private isFull: boolean;
    private lastwrite: number;
    public length: number;

    constructor(size: number) {
        this.memory = new Array(size).fill(0);
        this.head = 0;
        this.tail = 0;
        this.isFull = false;
        this.lastwrite = 0;
        this.length = 0;
    }

    read(): number | null {
        if (this.tail === this.head && !this.isFull) {
            return null;
        } else {
            this.tail = this.next(this.tail);
            this.isFull = false;
            this.length += -1;
            return this.memory[this.tail];
        }
    }

    write(value: number): void {
        this.lastwrite = Date.now();
        if (this.isFull) {
            return;
        } else {
            this.head = this.next(this.head);
            this.memory[this.head] = value;
            if (this.head === this.tail) {
                this.isFull = true;
            }
            this.length += 1;
        }
    }

    private next(n: number): number {
        const nxt = n + 1;
        return nxt === this.memory.length ? 0 : nxt;
    }
}

interface MuseInfo {
    [key: string]: any;
}

enum Band {
    Delta = 'delta',
    Theta = 'theta',
    Alpha = 'alpha',
    Beta = 'beta',
    Gamma = 'gamma'
}

interface BandFrequencies {
    [Band.Delta]: [number, number];
    [Band.Theta]: [number, number];
    [Band.Alpha]: [number, number];
    [Band.Beta]: [number, number];
    [Band.Gamma]: [number, number];
}

const BAND_FREQUENCIES: BandFrequencies = {
    [Band.Delta]: [1, 4],
    [Band.Theta]: [4, 8],
    [Band.Alpha]: [8, 13],
    [Band.Beta]: [13, 30],
    [Band.Gamma]: [30, 50]
};

export class MuseDevice {
    private readonly SERVICE = 0xfe8d;
    private readonly CONTROL_CHARACTERISTIC = '273e0001-4c4d-454d-96be-f03bac821358';
    private readonly BATTERY_CHARACTERISTIC = '273e000b-4c4d-454d-96be-f03bac821358';
    private readonly GYROSCOPE_CHARACTERISTIC = '273e0009-4c4d-454d-96be-f03bac821358';
    private readonly ACCELEROMETER_CHARACTERISTIC = '273e000a-4c4d-454d-96be-f03bac821358';
    private readonly PPG1_CHARACTERISTIC = '273e000f-4c4d-454d-96be-f03bac821358'; // AMBIENT
    private readonly PPG2_CHARACTERISTIC = '273e0010-4c4d-454d-96be-f03bac821358'; // IR
    private readonly PPG3_CHARACTERISTIC = '273e0011-4c4d-454d-96be-f03bac821358'; // RED
    private readonly EEG1_CHARACTERISTIC = '273e0003-4c4d-454d-96be-f03bac821358'; // TP9
    private readonly EEG2_CHARACTERISTIC = '273e0004-4c4d-454d-96be-f03bac821358'; // FP1
    private readonly EEG3_CHARACTERISTIC = '273e0005-4c4d-454d-96be-f03bac821358'; // FP2
    private readonly EEG4_CHARACTERISTIC = '273e0006-4c4d-454d-96be-f03bac821358'; // TP10
    private readonly EEG5_CHARACTERISTIC = '273e0007-4c4d-454d-96be-f03bac821358'; // AUX

    private state: number = 0;
    private device: Device | null = null;
    private bleManager: BleManager;
    private subscriptions: { [key: string]: () => void } = {};
    private batteryLevel: number | null = null;
    private info: MuseInfo = {};
    private infoFragment: string = "";

    private eeg: MuseCircularBuffer[];
    private ppg: MuseCircularBuffer[];
    private accelerometer: MuseCircularBuffer[];
    private gyroscope: MuseCircularBuffer[];

    constructor() {
        const BUFFER_SIZE = 256;
        this.bleManager = new BleManager();

        this.eeg = Array(5).fill(null).map(() => new MuseCircularBuffer(BUFFER_SIZE));
        this.ppg = Array(3).fill(null).map(() => new MuseCircularBuffer(BUFFER_SIZE));
        this.accelerometer = Array(3).fill(null).map(() => new MuseCircularBuffer(BUFFER_SIZE));
        this.gyroscope = Array(3).fill(null).map(() => new MuseCircularBuffer(BUFFER_SIZE));
    }

    private decodeInfo(bytes: Uint8Array): string {
        return Buffer.from(bytes.subarray(1, 1 + bytes[0])).toString('utf8');
    }

    private decodeUnsigned24BitData(samples: Uint8Array): number[] {
        const samples24Bit: number[] = [];
        for (let i = 0; i < samples.length; i = i + 3) {
            samples24Bit.push((samples[i] << 16) | (samples[i + 1] << 8) | samples[i + 2]);
        }
        return samples24Bit;
    }

    private decodeUnsigned12BitData(samples: Uint8Array): number[] {
        const samples12Bit: number[] = [];
        for (let i = 0; i < samples.length; i++) {
            if (i % 3 === 0) {
                samples12Bit.push((samples[i] << 4) | (samples[i + 1] >> 4));
            } else {
                samples12Bit.push(((samples[i] & 0xf) << 8) | samples[i + 1]);
                i++;
            }
        }
        return samples12Bit;
    }

    private encodeCommand(cmd: string): Uint8Array {
        const cmdStr = `X${cmd}\n`;
        const encoded = Buffer.from(cmdStr);
        const result = new Uint8Array(encoded.length);
        result[0] = encoded.length - 1;
        for (let i = 1; i < encoded.length; i++) {
            result[i] = encoded[i];
        }
        return result;
    }

    private batteryData(characteristic: Characteristic): void {
        if (!characteristic.value) return;
        const data = Buffer.from(characteristic.value, 'base64');
        this.batteryLevel = data.readUInt16LE(2) / 512;
    }

    private motionData(data: Buffer, scale: number, ofs: number): number[] {
        return [
            scale * data.readInt16LE(ofs),
            scale * data.readInt16LE(ofs + 2),
            scale * data.readInt16LE(ofs + 4)
        ];
    }

    private accelerometerData(characteristic: Characteristic): void {
        if (!characteristic.value) return;
        const scale = 0.0000610352;
        const data = Buffer.from(characteristic.value, 'base64');
        let ofs = 2;
        for (let i = 0; i < 3; i++) {
            const vals = this.motionData(data, scale, ofs);
            this.accelerometer[0].write(vals[0]);
            this.accelerometer[1].write(vals[1]);
            this.accelerometer[2].write(vals[2]);
            ofs += 6;
        }
    }

    private gyroscopeData(characteristic: Characteristic): void {
        if (!characteristic.value) return;
        const scale = 0.0074768;
        const data = Buffer.from(characteristic.value, 'base64');
        let ofs = 2;
        for (let i = 0; i < 3; i++) {
            const vals = this.motionData(data, scale, ofs);
            this.gyroscope[0].write(vals[0]);
            this.gyroscope[1].write(vals[1]);
            this.gyroscope[2].write(vals[2]);
            ofs += 6;
        }
    }

    private controlData(characteristic: Characteristic): void {
        if (!characteristic.value) return;
        const data = Buffer.from(characteristic.value, 'base64');
        const str = this.decodeInfo(new Uint8Array(data));
        
        for (let i = 0; i < str.length; i++) {
            const c = str[i];
            this.infoFragment += c;
            if (c === '}') {
                try {
                    const tmp = JSON.parse(this.infoFragment);
                    this.infoFragment = "";
                    Object.assign(this.info, tmp);
                } catch (e) {
                    console.error('Failed to parse control data:', e);
                }
            }
        }
    }

    private eegData(n: number, characteristic: Characteristic): void {
        if (!characteristic.value) return;
        const data = Buffer.from(characteristic.value, 'base64');
        const samples = this.decodeUnsigned12BitData(new Uint8Array(data.subarray(2)));
        const processedSamples = samples.map(x => 0.48828125 * (x - 0x800));
        
        for (const sample of processedSamples) {
            this.eeg[n].write(sample);
        }
    }

    private ppgData(n: number, characteristic: Characteristic): void {
        if (!characteristic.value) return;
        const data = Buffer.from(characteristic.value, 'base64');
        const samples = this.decodeUnsigned24BitData(new Uint8Array(data.subarray(2)));
        
        for (const sample of samples) {
            this.ppg[n].write(sample);
        }
    }

    private async sendCommand(cmd: string): Promise<void> {
        if (!this.device) throw new Error('Device not connected');
        
        const characteristic = await this.device.writeCharacteristicWithResponseForService(
            this.SERVICE.toString(16),
            this.CONTROL_CHARACTERISTIC,
            Buffer.from(this.encodeCommand(cmd)).toString('base64')
        );
    }

    async pause(): Promise<void> {
        await this.sendCommand('h');
    }

    async resume(): Promise<void> {
        await this.sendCommand('d');
    }

    async start(): Promise<void> {
        await this.pause();
        await this.sendCommand('p50'); // EEG + PPG
        await this.sendCommand('s');
        await this.resume();
    }

    disconnect(): void {
        if (this.device) {
            Object.values(this.subscriptions).forEach(unsubscribe => unsubscribe());
            this.subscriptions = {};
            this.device.cancelConnection();
        }
        this.device = null;
        this.state = 0;
    }

    private onDisconnected(): void {
        this.device = null;
        this.state = 0;
    }

    private async monitorCharacteristic(
        service: string,
        characteristic: string,
        handler: (char: Characteristic) => void
    ): Promise<() => void> {
        if (!this.device) throw new Error('Device not connected');

        const subscription = this.device.monitorCharacteristicForService(
            service,
            characteristic,
            (error, char) => {
                if (error) {
                    console.error(`Error monitoring ${characteristic}:`, error);
                    return;
                }
                if (char) {
                    handler(char);
                }
            }
        );

        return () => {
            subscription.remove();
        };
    }

    async connect(deviceId: string): Promise<void> {
        if (this.device || this.state !== 0) return;
        
        this.state = 1;
        try {
            this.device = await this.bleManager.connectToDevice(deviceId);
            await this.device.discoverAllServicesAndCharacteristics();

            // Set up disconnect listener
            this.device.onDisconnected(() => this.onDisconnected());

            // Monitor all characteristics
            const serviceId = this.SERVICE.toString(16);
            
            this.subscriptions = {
                control: await this.monitorCharacteristic(
                    serviceId,
                    this.CONTROL_CHARACTERISTIC,
                    char => this.controlData(char)
                ),
                battery: await this.monitorCharacteristic(
                    serviceId,
                    this.BATTERY_CHARACTERISTIC,
                    char => this.batteryData(char)
                ),
                gyro: await this.monitorCharacteristic(
                    serviceId,
                    this.GYROSCOPE_CHARACTERISTIC,
                    char => this.gyroscopeData(char)
                ),
                accel: await this.monitorCharacteristic(
                    serviceId,
                    this.ACCELEROMETER_CHARACTERISTIC,
                    char => this.accelerometerData(char)
                ),
                ppg1: await this.monitorCharacteristic(
                    serviceId,
                    this.PPG1_CHARACTERISTIC,
                    char => this.ppgData(0, char)
                ),
                ppg2: await this.monitorCharacteristic(
                    serviceId,
                    this.PPG2_CHARACTERISTIC,
                    char => this.ppgData(1, char)
                ),
                ppg3: await this.monitorCharacteristic(
                    serviceId,
                    this.PPG3_CHARACTERISTIC,
                    char => this.ppgData(2, char)
                ),
                eeg1: await this.monitorCharacteristic(
                    serviceId,
                    this.EEG1_CHARACTERISTIC,
                    char => this.eegData(0, char)
                ),
                eeg2: await this.monitorCharacteristic(
                    serviceId,
                    this.EEG2_CHARACTERISTIC,
                    char => this.eegData(1, char)
                ),
                eeg3: await this.monitorCharacteristic(
                    serviceId,
                    this.EEG3_CHARACTERISTIC,
                    char => this.eegData(2, char)
                ),
                eeg4: await this.monitorCharacteristic(
                    serviceId,
                    this.EEG4_CHARACTERISTIC,
                    char => this.eegData(3, char)
                ),
                eeg5: await this.monitorCharacteristic(
                    serviceId,
                    this.EEG5_CHARACTERISTIC,
                    char => this.eegData(4, char)
                )
            };

            await this.start();
            await this.sendCommand('v1');
            this.state = 2;
        } catch (error) {
            this.disconnect();
            throw error;
        }
    }

    // Getter methods for data access
    getEEGData(channel: number): number | null {
        return this.eeg[channel]?.read() ?? null;
    }

    getPPGData(channel: number): number | null {
        return this.ppg[channel]?.read() ?? null;
    }

    getAccelerometerData(axis: number): number | null {
        return this.accelerometer[axis]?.read() ?? null;
    }

    getGyroscopeData(axis: number): number | null {
        return this.gyroscope[axis]?.read() ?? null;
    }

    getBatteryLevel(): number | null {
        return this.batteryLevel;
    }

    private calculateBandPower(channelData: number[], band: Band): number {
        const [lowFreq, highFreq] = BAND_FREQUENCIES[band];
        
        // Simple band power calculation - this is a basic implementation
        // In a production environment, you'd want to use a proper FFT
        let bandPower = 0;
        for (let i = 0; i < channelData.length; i++) {
            bandPower += Math.pow(channelData[i], 2);
        }
        
        return bandPower / channelData.length;
    }

    calculateAttentionScore(): number {
        // Get the last 256 samples (1 second of data at 256 Hz) for each channel
        const channelData: { [key: string]: number[] } = {
            'AF7': [],
            'AF8': [],
            'TP9': [],
            'TP10': []
        };

        // Collect samples for each channel
        for (let i = 0; i < 256; i++) {
            const af7 = this.eeg[1].read(); // FP1/AF7
            const af8 = this.eeg[2].read(); // FP2/AF8
            const tp9 = this.eeg[0].read(); // TP9
            const tp10 = this.eeg[3].read(); // TP10

            if (af7 === null || af8 === null || tp9 === null || tp10 === null) {
                return 0; // Not enough data
            }

            channelData['AF7'].push(af7);
            channelData['AF8'].push(af8);
            channelData['TP9'].push(tp9);
            channelData['TP10'].push(tp10);
        }

        // Calculate band powers for each channel
        const bandPowers: { [key: string]: { [key in Band]: number } } = {};
        for (const channel of Object.keys(channelData)) {
            bandPowers[channel] = {
                [Band.Delta]: this.calculateBandPower(channelData[channel], Band.Delta),
                [Band.Theta]: this.calculateBandPower(channelData[channel], Band.Theta),
                [Band.Alpha]: this.calculateBandPower(channelData[channel], Band.Alpha),
                [Band.Beta]: this.calculateBandPower(channelData[channel], Band.Beta),
                [Band.Gamma]: this.calculateBandPower(channelData[channel], Band.Gamma)
            };
        }

        // Calculate components
        const alphaPowers = Object.values(bandPowers).map(bp => bp[Band.Alpha]);
        const betaPowers = Object.values(bandPowers).map(bp => bp[Band.Beta]);
        
        const alphaSuppression = 1 - (alphaPowers.reduce((a, b) => a + b, 0) / alphaPowers.length);
        const betaEngagement = betaPowers.reduce((a, b) => a + b, 0) / betaPowers.length;

        // Calculate frontal asymmetry
        const leftAlpha = bandPowers['AF7'][Band.Alpha];
        const rightAlpha = bandPowers['AF8'][Band.Alpha];
        const faa = (rightAlpha - leftAlpha) / (rightAlpha + leftAlpha);

        // Combine scores with weights
        const score = (
            alphaSuppression * 40 +
            betaEngagement * 30 +
            ((faa + 1) / 2) * 30
        );

        return Math.max(0, Math.min(100, score));
    }
}
