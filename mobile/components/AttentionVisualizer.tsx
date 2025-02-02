import React, { useEffect, useState } from 'react';
import { View, Text, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

interface AttentionVisualizerProps {
  score: number;
}

export function AttentionVisualizer({ score }: AttentionVisualizerProps) {
  const [attentionHistory, setAttentionHistory] = useState<number[]>([]);
  const windowWidth = Dimensions.get('window').width;

  useEffect(() => {
    // Keep the last 20 readings in history
    setAttentionHistory(prev => {
      const newHistory = [...prev, score];
      return newHistory.slice(-20);
    });
  }, [score]);

  const chartConfig = {
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    color: (opacity = 1) => `rgba(0, 128, 255, ${opacity})`,
    strokeWidth: 2,
    propsForDots: {
      r: "4",
      strokeWidth: "2",
    },
    paddingRight: 0  // Reduce padding to shrink Y-axis label area
  };

  const data = {
    labels: attentionHistory.map((_, i) => ''),  // Empty labels for cleaner look
    datasets: [{
      data: attentionHistory.length ? attentionHistory : [0],
      color: (opacity = 1) => `rgba(0, 128, 255, ${opacity})`,
      strokeWidth: 2
    }]
  };

  return (
    <View className="mt-6">
      <Text className="mb-2 text-lg font-semibold">Attention Score Over Time:</Text>
      <View className="bg-white rounded-lg p-2">
        <LineChart
          data={data}
          width={windowWidth - 50}  // Account for padding
          height={220}
          chartConfig={chartConfig}
          bezier
          style={{
            marginVertical: 8,
            borderRadius: 16,
            paddingRight: 0,  // Reduce padding to shrink Y-axis label area
          }}
          yAxisLabel=""
          yAxisSuffix=""
          formatYLabel={() => ''}
          withDots={false}
          withInnerLines={false}
          withOuterLines={true}
          withVerticalLines={false}
          withHorizontalLines={true}
        />
        <Text className="text-center text-lg font-bold text-blue-500">
          Current: {Math.round(score)}
        </Text>
      </View>
    </View>
  );
}
