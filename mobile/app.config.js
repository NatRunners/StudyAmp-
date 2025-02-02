import 'dotenv/config';

export default {
  expo: {
    name: 'mobile',
    slug: 'mobile',
    version: '1.0.0',
    scheme: 'mobile',
    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/favicon.png'
    },
    plugins: [
      'expo-router',
      ['react-native-ble-plx', {
        isBackgroundEnabled: true,
        modes: ['peripheral', 'central'],
        bluetoothAlwaysPermission: 'Allow $(PRODUCT_NAME) to access bluetooth'
      }]
    ],
    experiments: {
      typedRoutes: true,
      tsconfigPaths: true
    },
    extra: {
      GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    },
    newArchEnabled: true,
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff'
    },
    assetBundlePatterns: [
      '**/*'
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.anonymous.mobile',
      permissions: [
        'NSBluetoothAlwaysUsageDescription',
        'NSBluetoothPeripheralUsageDescription',
        'NSLocationWhenInUseUsageDescription',
        'NSMicrophoneUsageDescription',
        'NSDocumentsFolderUsageDescription',
        'NSDownloadsFolderUsageDescription'
      ],
      infoPlist: {
        UIBackgroundModes: ['audio'],
        NSMicrophoneUsageDescription: 'This app needs access to the microphone to record audio during study sessions.',
        NSDocumentsFolderUsageDescription: 'This app needs access to documents for processing audio files.',
        NSDownloadsFolderUsageDescription: 'This app needs access to downloads for processing audio files.',
        UIRequiresPersistentWiFi: true
      },
      config: {
        usesNonExemptEncryption: false
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff'
      },
      package: 'com.anonymous.mobile',
      permissions: [
        'android.permission.BLUETOOTH',
        'android.permission.BLUETOOTH_ADMIN',
        'android.permission.BLUETOOTH_SCAN',
        'android.permission.BLUETOOTH_CONNECT',
        'android.permission.ACCESS_FINE_LOCATION',
        'android.permission.RECORD_AUDIO',
        'android.permission.MODIFY_AUDIO_SETTINGS',
        'android.permission.FOREGROUND_SERVICE',
        'android.permission.READ_EXTERNAL_STORAGE',
        'android.permission.WRITE_EXTERNAL_STORAGE'
      ]
    }
  }
};
