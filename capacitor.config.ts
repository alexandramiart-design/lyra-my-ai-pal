import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.lyra',
  appName: 'Lyra',
  webDir: 'dist',
  // L'app native charge l'application Lyra complète (SSR + API IA, voix,
  // mémoire) depuis le backend. Sans ça l'écran reste blanc car le bundle
  // statique ne peut pas servir les routes serveur.
  server: {
    url: 'https://sweet-git-sparkle.lovable.app',
    androidScheme: 'https',
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;