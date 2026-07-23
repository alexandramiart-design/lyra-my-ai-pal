import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.lyra',
  appName: 'Lyra',
  webDir: 'dist',
  android: {
    allowMixedContent: false,
  },
};

export default config;