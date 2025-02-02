import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Audio } from 'expo-av';
import { AttentionVisualizer } from './AttentionVisualizer';
import { AudioProcessor } from '../utils/audioProcessor';

interface TimestampData {
  timestamp: number;
  score: number;
}

interface Summary {
  topic: string;
  summary: string;
  key_points: string[];
}

interface RecordingSessionProps {
  apiKey: string;  // Gemini API key
  lowAttentionThreshold?: number;  // Optional threshold for low attention (default: 50)
}

export function RecordingSession({ apiKey, lowAttentionThreshold = 50 }: RecordingSessionProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentScore, setCurrentScore] = useState(100);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const audioProcessor = useRef<AudioProcessor | null>(null);
  const lowAttentionPeriods = useRef<TimestampData[]>([]);
  const sessionStartTime = useRef<number>(0);

  useEffect(() => {
    // Initialize AudioProcessor
    try {
      console.log('Initializing AudioProcessor...');
      audioProcessor.current = new AudioProcessor(apiKey);
      console.log('AudioProcessor initialized successfully');
    } catch (error) {
      console.error('Failed to initialize AudioProcessor:', error);
      setError('Failed to initialize audio processor');
    }
  }, [apiKey]);

  const requestPermissions = async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        Alert.alert(
          'Permission Required',
          'This app needs access to your microphone to record audio.',
          [{ text: 'OK' }]
        );
        return false;
      }
      return true;
    } catch (err) {
      console.error('Permission error:', err);
      return false;
    }
  };

  const handleStartRecording = async () => {
    if (!audioProcessor.current) {
      setError('Audio processor not initialized');
      return;
    }

    try {
      console.log('Starting recording session...');
      setError(null);
      setSummary(null);

      // Request microphone permissions first
      console.log('Checking permissions...');
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        const error = 'Microphone permission is required to record audio.';
        console.error(error);
        setError(error);
        return;
      }
      console.log('Permissions granted');

      lowAttentionPeriods.current = [];
      sessionStartTime.current = Date.now() / 1000; // Convert to seconds
      
      console.log('Starting audio recording...');
      await audioProcessor.current.startRecording();
      console.log('Recording started successfully');
      setIsRecording(true);
    } catch (err) {
      setError('Failed to start recording. Please check permissions.');
      console.error('Recording error:', err);
    }
  };

  const handleStopRecording = async () => {
    if (!audioProcessor.current) {
      console.error('Cannot stop recording: audio processor not initialized');
      return;
    }

    try {
      console.log('Stopping recording...');
      setIsProcessing(true);
      await audioProcessor.current.stopRecording();
      console.log('Recording stopped successfully');

      // Only process if we have low attention periods
      if (lowAttentionPeriods.current.length > 0) {
        console.log(`Processing ${lowAttentionPeriods.current.length} low attention periods...`);
        const result = await audioProcessor.current.processAudioWithTimestamps(
          lowAttentionPeriods.current
        );
        console.log('Audio processing completed successfully');
        setSummary(result);
      } else {
        setSummary({
          topic: "Session Summary",
          summary: "No significant attention drops were detected during this session.",
          key_points: ["Maintained consistent attention throughout the session"]
        });
      }
    } catch (err) {
      setError('Failed to process recording. Please try again.');
      console.error('Processing error:', err);
    } finally {
      setIsRecording(false);
      setIsProcessing(false);
    }
  };

  // Simulate attention score updates (in real app, this would come from Muse device)
  useEffect(() => {
    if (!isRecording) return;

    const interval = setInterval(() => {
      // Simulate attention score between 0-100
      const newScore = Math.max(0, Math.min(100, 
        currentScore + (Math.random() - 0.5) * 20
      ));
      
      setCurrentScore(newScore);

      // Track low attention periods
      if (newScore < lowAttentionThreshold) {
        const timestamp = Date.now() / 1000 - sessionStartTime.current;
        lowAttentionPeriods.current.push({
          timestamp,
          score: newScore
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isRecording, currentScore, lowAttentionThreshold]);

  return (
    <View className="p-4">
      {/* Attention Visualization */}
      <AttentionVisualizer score={currentScore} />

      {/* Recording Controls */}
      <View className="mt-6 items-center">
        {!isRecording ? (
          <TouchableOpacity
            onPress={handleStartRecording}
            disabled={isProcessing}
            className={`rounded-full bg-blue-500 px-8 py-4 ${isProcessing ? 'opacity-50' : ''}`}
          >
            <Text className="text-lg font-semibold text-white">
              Start Recording
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleStopRecording}
            className="rounded-full bg-red-500 px-8 py-4"
          >
            <Text className="text-lg font-semibold text-white">
              Stop Recording
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Processing Indicator */}
      {isProcessing && (
        <View className="mt-4 items-center">
          <ActivityIndicator size="large" color="#0000ff" />
          <Text className="mt-2 text-gray-600">Processing recording...</Text>
        </View>
      )}

      {/* Error Display */}
      {error && (
        <View className="mt-4 rounded-lg bg-red-100 p-4">
          <Text className="text-red-600">{error}</Text>
        </View>
      )}

      {/* Summary Display */}
      {summary && (
        <View className="mt-6 rounded-lg bg-white p-4 shadow-md">
          <Text className="mb-2 text-xl font-bold">{summary.topic}</Text>
          <Text className="mb-4 text-gray-700">{summary.summary}</Text>
          
          {summary.key_points.length > 0 && (
            <View>
              <Text className="mb-2 text-lg font-semibold">Key Points:</Text>
              {summary.key_points.map((point, index) => (
                <View key={index} className="mb-1 flex-row">
                  <Text className="mr-2">•</Text>
                  <Text className="flex-1 text-gray-700">{point}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}
