import type { CapacitorConfig } from '@capacitor/cli';

// Production target by default
const serverUrl = (process.env.CAPACITOR_SERVER_URL || 'https://rakshicoco.vercel.app').trim();

const isHttps = serverUrl.startsWith('https://');

const config: CapacitorConfig = {
  appId: 'com.rakshicoco.erp',
  appName: 'Rakshi Coco',
  webDir: 'out',
  bundledWebRuntime: false,
  server: {
    url: serverUrl,
    cleartext: false, // Strict HTTPS for production
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    }
  }
};

export default config;
