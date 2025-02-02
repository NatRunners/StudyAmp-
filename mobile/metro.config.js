/* eslint-disable no-undef */
// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const nodeLibs = require('node-libs-react-native');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Polyfill Node.js core modules
config.resolver.extraNodeModules = {
  ...nodeLibs,
  ...config.resolver.extraNodeModules,
  os: require.resolve('os-browserify/browser'),
  fs: require.resolve('./shim/fs.js'),
  crypto: require.resolve('./shim/crypto.js'),
  https: require.resolve('https-browserify'),
  path: require.resolve('path-browserify'),
  zlib: require.resolve('browserify-zlib'),
};

module.exports = withNativeWind(config, { input: './global.css' });
