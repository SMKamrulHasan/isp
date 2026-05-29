import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.neuralvision.lab',
  appName: 'Camera IQ Analyzer',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
