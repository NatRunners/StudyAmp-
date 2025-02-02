import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, Alert } from 'react-native';
import { AttentionVisualizer } from '~/components/AttentionVisualizer';

import { Button } from '~/components/Button';
import { Container } from '~/components/Container';
import { deviceManager } from '~/utils/deviceManager';
import type { Device } from 'react-native-ble-plx';

export default function Details() {
  const { name } = useLocalSearchParams();
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);
    const [attentionScore, setAttentionScore] = useState<number>(0);

  const endSession = async () => {
    if (isStreaming) {
      await deviceManager.stopMuseStreaming();
      setIsStreaming(false);
    }
    setSelectedDevice(null);
    setDevices([]);
    setIsSessionActive(false);
  };

  const startScan = async () => {
    try {
      setIsScanning(true);
      setDevices([]);
      const foundDevices = await deviceManager.scanForMuseDevices();
      setDevices(foundDevices);
      
      // If we switched to synthetic mode during scan, create a synthetic device
      if (deviceManager.isInSyntheticMode()) {
        const syntheticDevice = { id: 'synthetic', name: 'Synthetic Muse' } as Device;
        setSelectedDevice(syntheticDevice);
        setDevices([syntheticDevice]);
        setIsSessionActive(true);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to scan for devices: ' + error);
      // If error occurred and we're in synthetic mode, set up synthetic device
      if (deviceManager.isInSyntheticMode()) {
        const syntheticDevice = { id: 'synthetic', name: 'Synthetic Muse' } as Device;
        setSelectedDevice(syntheticDevice);
        setDevices([syntheticDevice]);
        setIsSessionActive(true);
      }
    } finally {
      setIsScanning(false);
    }
  };

  const connectToDevice = async (device: Device) => {
    try {
      setSelectedDevice(device);
      await deviceManager.connectToMuseDevice(device);
      setIsSessionActive(true);
      Alert.alert('Success', 'Connected to device successfully');
    } catch (error) {
      Alert.alert(
        'Connection Error',
        'Failed to connect to device. Would you like to use synthetic data for testing?',
        [
          {
            text: 'Use Synthetic Data',
            onPress: () => {
              deviceManager.enableSyntheticMode();
              setSelectedDevice(device); // Keep the device selected for UI consistency
              setIsSessionActive(true);
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => setSelectedDevice(null),
          },
        ]
      );
    }
  };

  const toggleStreaming = async () => {
    // If no device is selected and synthetic mode is active, create a dummy device
    if (!selectedDevice && deviceManager.isInSyntheticMode()) {
      setSelectedDevice({ id: 'synthetic', name: 'Synthetic Muse' } as Device);
      await new Promise(resolve => setTimeout(resolve, 0)); // Let state update
    }
    if (!selectedDevice) return;

    try {
      if (!isStreaming) {
        await deviceManager.startMuseStreaming(selectedDevice, (data) => {
          setAttentionScore(data.attentionScore);
          console.log('Attention Score:', data.attentionScore);
        });
        setIsStreaming(true);
      } else {
        await deviceManager.stopMuseStreaming();
        setIsStreaming(false);
      }
    } catch (error) {
      Alert.alert('Error', `Failed to ${isStreaming ? 'stop' : 'start'} streaming: ` + error);
      setIsStreaming(false);
    }
  };

  useEffect(() => {
    return () => {
      // Clean up on unmount
      if (isStreaming) {
        deviceManager.stopMuseStreaming().catch(console.error);
      }
    };
  }, [isStreaming]);

  const renderDevice = ({ item }: { item: Device }) => (
    <View className="mb-2 rounded-lg bg-gray-100 p-4">
      <Text className="text-lg font-bold">{item.name || 'Unknown Device'}</Text>
      <Text className="text-sm text-gray-600">ID: {item.id}</Text>
      <Button
        title={selectedDevice?.id === item.id ? 'Connected' : 'Connect'}
        onPress={() => connectToDevice(item)}
        disabled={selectedDevice?.id === item.id}
      />
    </View>
  );

  return (
    <>
      <Stack.Screen options={{ title: 'Device Connection' }} />
      <Container>
        <View className="flex-1">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-xl font-bold">Muse Device Manager</Text>
            {(selectedDevice || deviceManager.isInSyntheticMode()) && (
              <View className="bg-gray-50 rounded-full px-3 py-1">
                <Text className="text-sm font-medium text-gray-600">
                  {selectedDevice?.name || 'Synthetic Muse'}
                </Text>
                {deviceManager.isInSyntheticMode() && (
                  <Text className="text-xs text-orange-600">Synthetic Mode</Text>
                )}
              </View>
            )}
          </View>

          {!isSessionActive ? (
            <>
              <Button
                title={isScanning ? 'Scanning...' : 'Start Session'}
                onPress={startScan}
                disabled={isScanning}
              />

              {isScanning && (
                <ActivityIndicator size="large" className="my-4" />
              )}

              {devices.length > 0 && (
                <View className="my-4">
                  <Text className="mb-2 text-lg font-semibold">Available Devices:</Text>
                  <FlatList
                    data={devices}
                    renderItem={renderDevice}
                    keyExtractor={item => item.id}
                    className="max-h-60"
                  />
                </View>
              )}
            </>
          ) : (
            <View className="flex-1">
              <Button
                title="End Session"
                onPress={endSession}
                className="mb-4"
              />
              {isStreaming ? (
                <Button
                  title="Stop Streaming"
                  onPress={toggleStreaming}
                  className="mb-4"
                />
              ) : (
                <Button
                  title="Start Streaming"
                  onPress={toggleStreaming}
                  className="mb-4"
                />
              )}
              {isStreaming && <AttentionVisualizer score={attentionScore} />}
            </View>
          )}
        </View>
      </Container>
    </>
  );
}
