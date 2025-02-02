import { Audio } from 'expo-av';
import { FFmpegKit, ReturnCode } from 'ffmpeg-kit-react-native';
import * as FileSystem from 'expo-file-system';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface TimestampData {
  timestamp: number;
  score: number;
}

export interface Summary {
  topic: string;
  summary: string;
  key_points: string[];
}

export class AudioProcessor {
  private recording: Audio.Recording | null = null;
  private audioUri: string | null = null;
  private genAI: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  public async startRecording(): Promise<void> {
    try {
      console.log('Requesting audio permissions...');
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        throw new Error('Microphone permission not granted');
      }
      console.log('Audio permissions granted');

      console.log('Setting audio mode...');
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          interruptionModeIOS: 1,  // INTERRUPTION_MODE_IOS_DUCK_OTHERS
          interruptionModeAndroid: 1,  // INTERRUPTION_MODE_ANDROID_DUCK_OTHERS
          shouldDuckAndroid: true,
        });
        console.log('Audio mode set successfully');
      } catch (audioModeError) {
        console.error('Error setting audio mode:', audioModeError);
        throw new Error('Failed to configure audio settings');
      }

      console.log('Creating recording...');
      try {
        const { recording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        console.log('Recording created successfully');
        this.recording = recording;
      } catch (recordingError) {
        console.error('Error creating recording:', recordingError);
        if (recordingError instanceof Error) {
          throw new Error(`Failed to create recording: ${recordingError.message}`);
        }
        throw new Error('Failed to create recording');
      }
    } catch (error) {
      console.error('Failed to start recording:', error);
      if (error instanceof Error) {
        throw new Error(`Recording setup failed: ${error.message}`);
      }
      throw new Error('Recording setup failed with unknown error');
    }
  }

  public async stopRecording(): Promise<string> {
    if (!this.recording) {
      throw new Error('No active recording found');
    }

    try {
      console.log('Stopping recording...');
      await this.recording.stopAndUnloadAsync();
      console.log('Recording stopped');

      const uri = this.recording.getURI();
      if (!uri) {
        throw new Error('Failed to get recording URI - no URI returned');
      }
      console.log('Got recording URI:', uri);
      
      this.audioUri = uri;
      this.recording = null;
      return uri;
    } catch (error) {
      console.error('Failed to stop recording:', error);
      if (error instanceof Error) {
        throw new Error(`Stop recording failed: ${error.message}`);
      }
      throw new Error('Stop recording failed with unknown error');
    }
  }

  public async convertToAac(inputPath: string): Promise<string> {
    const outputPath = `${FileSystem.cacheDirectory}processed_${Date.now()}.aac`;
    
    try {
      const session = await FFmpegKit.execute(
        `-i ${inputPath} -c:a aac -b:a 128k ${outputPath}`
      );
      
      const returnCode = await session.getReturnCode();
      if (ReturnCode.isSuccess(returnCode)) {
        return outputPath;
      } else {
        const logs = await session.getLogs();
        throw new Error(`FFmpeg conversion failed: ${logs}`);
      }
    } catch (error) {
      console.error('Error during audio conversion:', error);
      throw error;
    }
  }

  public generatePrompt(timestamps: TimestampData[]): string {
    const basePrompt = `
    Based on the analysis of the audio segment, provide a summary of the discussion based on the timestamps given and key points covered.
    Include any important details or insights that would be relevant to the user's request.
    
    Use this JSON schema:
    Audio_Sum = {'topic': str, 'summary': str, 'key_points': list[str]}
    Return: Audio_Sum
    
    The timestamps are times where the user lost focus.
    based on the focus timestamps, analyze the key points covered during the specified time intervals.
    `;

    const timestampsDesc = timestamps
      .map(t => `- At ${t.timestamp} seconds: score = ${t.score}`)
      .join('\n');

    return `${basePrompt}\n\nTimestamps:\n${timestampsDesc}`;
  }

  public async generateSummary(audioPath: string, timestamps: TimestampData[]): Promise<Summary> {
    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      // Read the audio file as base64
      const audioContent = await FileSystem.readAsStringAsync(audioPath, {
        encoding: FileSystem.EncodingType.Base64
      });

      const prompt = this.generatePrompt(timestamps);
      const result = await model.generateContent([prompt, { inlineData: { data: audioContent, mimeType: 'audio/aac' } }]);
      
      const response = result.response;
      const text = response.text();
      
      // Extract JSON from the response
      const jsonStr = text.substring(
        text.indexOf('{'),
        text.lastIndexOf('}') + 1
      );
      
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error('Error generating summary:', error);
      throw error;
    }
  }

  public async processAudioWithTimestamps(timestamps: TimestampData[]): Promise<Summary> {
    if (!this.audioUri) {
      throw new Error('No recorded audio available');
    }

    try {
      const aacPath = await this.convertToAac(this.audioUri);
      const summary = await this.generateSummary(aacPath, timestamps);
      
      // Cleanup temporary files
      await FileSystem.deleteAsync(aacPath, { idempotent: true });
      await FileSystem.deleteAsync(this.audioUri, { idempotent: true });
      
      return summary;
    } catch (error) {
      console.error('Error processing audio:', error);
      throw error;
    } finally {
      this.audioUri = null;
    }
  }
}
