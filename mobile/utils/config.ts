import { Platform } from 'react-native';
import Constants from 'expo-constants';

// For web/development, use process.env
// For native/production, use Constants.expoConfig.extra
const getEnvVar = (name: string): string => {
  if (Platform.OS === 'web') {
    return process.env[name] || '';
  }
  return Constants.expoConfig?.extra?.[name] || '';
};

export const GEMINI_API_KEY = getEnvVar('GEMINI_API_KEY');

// Validate required environment variables
export const validateConfig = (): string[] => {
  const errors: string[] = [];
  
  if (!GEMINI_API_KEY) {
    errors.push('GEMINI_API_KEY is not set in .env file');
  }
  
  return errors;
};
