import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.lyra',
  appName: 'Lyra',
  webDir: 'dist',
  server: {
    // L'app native charge directement l'app web publiée.
    // Ainsi, toute modif faite dans Lovable est instantanément dispo
    // dans l'APK sans rebuild.
    url: 'https://sweet-git-sparkle.lovable.app',
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;