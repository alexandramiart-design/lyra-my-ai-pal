import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.lyra',
  appName: 'Lyra',
  webDir: 'dist',
  server: {
    // Charge directement le site en ligne pour que Lyra reste connectée
    // à sa mémoire et au bot Telegram sans avoir à rebuild l'app.
    url: 'https://lyra-my-ai-pal.lovable.app',
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;