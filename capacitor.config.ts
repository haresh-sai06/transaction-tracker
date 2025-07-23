import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.haresh.transactiontracker',
  appName: 'auto-track-money',
  webDir: 'dist',
  server: {
    url: 'https://6fc43d36-9040-4f96-85b5-a091200fe435.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#ffffff',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: true,
      spinnerColor: '#22c55e'
    },
    StatusBar: {
      style: 'Default',
      backgroundColor: '#ffffff'
    },
    Keyboard: {
      resize: 'ionic',
      resizeOnFullScreen: true
    },
    App: {
      launchUrl: '',
      iosScheme: 'App',
      androidScheme: 'https'
    }
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false
  },
  ios: {
    contentInset: 'automatic',
    scrollEnabled: true
  }
};

export default config;