import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.haresh.transactiontracker',
  appName: 'auto-track-money',
  webDir: 'dist',
  server: {
    url: 'https://transaction-tracker-one.vercel.app/',
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