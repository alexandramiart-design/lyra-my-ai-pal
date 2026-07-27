import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.lyra',
  appName: 'Lyra',
  webDir: 'dist',
  // Vraie application native : tout le code de l'interface est embarqué
  // dans l'APK (bundle `dist` généré par `bun run build:mobile`).
  // Seuls les appels API (IA, voix, mémoire) partent vers le backend.
  server: {
    androidScheme: 'https',
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;