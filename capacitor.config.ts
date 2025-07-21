import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.6fc43d3690404f9685b5a091200fe435',
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
    }
  }
};

export default config;