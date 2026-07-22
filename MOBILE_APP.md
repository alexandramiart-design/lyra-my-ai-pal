# Lyra — Build de l'app Android / iOS

L'app mobile est configurée avec **Capacitor**. Elle charge directement
`https://lyra-my-ai-pal.lovable.app`, donc **toute la mémoire de Lyra reste
intacte** — l'app est juste un "conteneur" natif autour du site.

> ✅ Le projet Android est déjà généré et poussé sur GitHub. Tu n'as plus qu'à
> l'ouvrir dans Android Studio pour builder l'APK.

## Liens
- Repo GitHub : `https://github.com/alexandramiart-design/lyra-my-ai-pal`
- Dossier Android : `android/`

## Build de l'APK Android (rapide)

### Prérequis
- [Android Studio](https://developer.android.com/studio)
- Optionnel : [Node.js 20+](https://nodejs.org) et [Bun](https://bun.sh) si tu veux
  modifier la config ou resyncroniser

### Étapes
1. **Clone le repo**
   ```bash
   git clone https://github.com/alexandramiart-design/lyra-my-ai-pal.git
   cd lyra-my-ai-pal
   ```

2. **Ouvre le dossier Android dans Android Studio**
   ```bash
   npx cap open android
   ```
   ou ouvre directement le dossier `android/` dans Android Studio.

3. **Builder l'APK**
   - Dans Android Studio : `Build` → `Build Bundle(s) / APK(s)` → `Build APK(s)`
   - Le fichier `.apk` apparaît dans :
     ```
     android/app/build/outputs/apk/debug/app-debug.apk
     ```
   - Transfère-le sur ton téléphone et installe-le.

### Si tu veux resyncroniser le web dans l'app
```bash
bun install
bun run build
npx cap sync android
```

## Build iOS (Mac uniquement)
Le dossier iOS n'est pas encore généré. Si tu veux l'ajouter plus tard :
```bash
bunx cap add ios
bunx cap open ios
```

## Mettre à jour l'app plus tard
Comme l'app pointe vers l'URL Lovable publiée, **tu n'as PAS besoin de
rebuild l'APK** quand tu modifies le site : il suffit de re-publier depuis
Lovable et l'app se met à jour automatiquement au prochain lancement.

Rebuild l'APK uniquement si tu veux :
- Changer l'icône, le nom ou le splash screen de l'app
- Ajouter des plugins natifs (caméra, notifications push, etc.)
- Changer l'URL cible dans `capacitor.config.ts`

## Mémoire de Lyra
La mémoire est stockée côté serveur (Lovable Cloud) et n'est **jamais**
embarquée dans l'app. Aucun risque de la perdre en rebuildant l'APK.