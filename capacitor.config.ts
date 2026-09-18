import type { CapacitorConfig } from '@capacitor/cli';

// Localhost for development, can be swapped via environment variables later.
const serverUrl = (process.env.CAPACITOR_SERVER_URL || 'http://10.0.2.2:3000').trim();

const isHttps = serverUrl.startsWith('https://');

const config: CapacitorConfig = {
  appId: 'com.rakshicoco.erp',
  appName: 'Rakshi Coco',
  webDir: 'out', // The CLI requires a webDir to exist even if we use server.url
  bundledWebRuntime: false,
  server: {
    url: serverUrl,
    cleartext: !isHttps, // Allow http cleartext only for local dev; disabled for HTTPS production
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    }
  }
};

export default config;
