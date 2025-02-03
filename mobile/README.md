
# Mobile App

This directory houses the mobile version of our project, built to provide a robust and interactive experience on iOS and Android devices. This app implements features like session audio recording, real-time attention monitoring, and audio summarization using an integrated audio processor. 

## Overview

Our mobile app is developed using:
- **React Native** with **Expo** for rapid development and cross-platform support.
- **TypeScript** to ensure type safety and maintainable code.
- Native integrations for audio recording and processing using Expo’s Audio API.
- **FFmpeg-kit-react-native** for on-device audio conversion.
- UI components with smooth animations to visualize user attention and playback state.

## Tech Stack

- **React Native / Expo SDK:** Expo SDK 52 yields streamlined native configuration and development workflows.  
- **TypeScript:** Enhancing code reliability and development ergonomics.
- **Expo Audio API:** For capturing high-quality audio recordings.
- **FFmpeg-kit-react-native:** For processing and converting recorded audio.
- **React Navigation/Expo Router:** For managing app navigation.
- **UI Libraries:** Custom components including `AttentionVisualizer` and `RecordingSession` for interactive user experience.

## Getting Started

Follow these steps to set up and run the mobile app on your machine.

### Prerequisites

1. **Node.js and npm:** Ensure you have Node.js (14.x or later) installed. Download from [nodejs.org](https://nodejs.org/).
2. **Yarn or npm:** Your package manager of choice (Yarn is recommended).
3. **Expo CLI:** Install globally if not already available:
   ```sh
   npm install -g expo-cli
   ```
4. **iOS/Android Setup:**  
   - For iOS, install [Xcode](https://developer.apple.com/xcode/).
   - For Android, install [Android Studio](https://developer.android.com/studio) and set up your Android emulator.
5. **Environment Variables:**  
   Create a `.env` file (or copy from `.env.example`) in the `mobile/` directory for your local configuration. This file may include API keys or other project-specific settings.  
   See the [Expo Environment Variables documentation](https://docs.expo.dev/guides/environment-variables/) for more details.

### Installation

1. Navigate to the `mobile/` directory:
   ```sh
   cd mobile
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
   or if using Yarn:
   ```sh
   yarn install
   ```

### Running the App

1. **Start the Expo Server:**
   ```sh
   expo start
   ```
   This command will launch the Expo development server. You can then use the Expo Go app on your mobile device or use an Android/iOS emulator to preview the application.

2. **iOS Setup:**
   - For iOS simulators, ensure you have Xcode installed.
   - In the Expo Dev Tools, click the **Run on iOS simulator** option.
   - For additional native debugging, see [Debugging on iOS](https://docs.expo.dev/workflow/debugging/#ios-simulator).

3. **Android Setup:**
   - Launch an Android emulator from Android Studio or connect an Android device.
   - In the Expo Dev Tools, click **Run on Android device/emulator**.
   - Refer to [Running on Android](https://docs.expo.dev/workflow/android-studio-emulator/) for more details.

## Project Structure

- **app/**: Contains the main app files including navigation and configuration.
- **assets/**: Stores images, fonts, and other static resources.
- **components/**: Reusable React components like 

AttentionVisualizer

 and other UI elements.
- **expo-env.d.ts & app.config.js**: Expo configuration and environment variable definitions.
- **ios/** and **android/**: Native projects for iOS and Android respectively.

## Additional Information

- **iOS Specifics:**  
  - The iOS folder contains Xcode configurations (e.g., `mobile.xcodeproj`). Ensure that environment variables such as `NODE_BINARY` are set up per instructions in the generated `.xcode.env` files.  
  - Check our [Expo iOS documentation](https://docs.expo.dev/build/ios-build/) for more details on building and debugging on iOS.

- **Android Specifics:**  
  - The Android project is configured via Gradle (check build.gradle).  
  - For more information about Android setups and debugging check out [Expo Android documentation](https://docs.expo.dev/build/android-build/).

- **Audio Processing:**  
  - The `audioProcessor.ts` file contains the logic for handling audio recordings, setting up audio modes, and transforming recordings with FFmpeg.
  - For FFmpeg details, refer to [ffmpeg-kit-react-native documentation](https://github.com/tanersener/ffmpeg-kit).

- **Issues & Troubleshooting:**  
  - Verify that required native modules are linked correctly (e.g. via Expo config plugins).
  - If you encounter issues with native dependencies, try clearing caches:
    ```sh
    expo r -c
    ```
  - Consult the [Expo troubleshooting guide](https://docs.expo.dev/workflow/troubleshooting/) for common issues.

## Contributing

If you would like to contribute, please refer to the main README.md for overall project guidelines. For mobile-specific changes, ensure your pull requests adhere to our existing code structure and Expo configuration guidelines.

## License

This project is licensed under the LICENSE file in the root of the repository.

