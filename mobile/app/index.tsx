import { Stack } from 'expo-router';
import React from 'react';
import { Alert } from 'react-native';
import { Container } from '~/components/Container';
import { RecordingSession } from '~/components/RecordingSession';
import { GEMINI_API_KEY, validateConfig } from '~/utils/config';

export default function Home() {
  React.useEffect(() => {
    const errors = validateConfig();
    if (errors.length > 0) {
      Alert.alert(
        'Configuration Error',
        errors.join('\n'),
        [{ text: 'OK' }]
      );
    }
  }, []);

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'StudyAmp',
          headerTitleStyle: {
            fontSize: 20,
            fontWeight: 'bold',
          },
        }} 
      />
      <Container>
        <RecordingSession 
          apiKey={GEMINI_API_KEY}
          lowAttentionThreshold={90}
        />
      </Container>
    </>
  );
}
