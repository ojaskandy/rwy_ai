import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.coacht.app',
  appName: 'CoachT',
  webDir: 'dist',
  server: {
    url: 'https://www.coacht.xyz',
    cleartext: true
  }
};

export default config;
