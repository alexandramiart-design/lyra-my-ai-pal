# Lyra — Build de l'app Android / iOS

L'app mobile est configurée avec **Capacitor**. Elle charge directement
`https://lyra-my-ai-pal.lovable.app`, donc **toute la mémoire de Lyra reste
intacte** — l'app est juste un "conteneur" natif autour du site.

## Étapes (à faire une seule fois, sur ton ordi après clone GitHub)

### Prérequis
- [Node.js 20+](https://nodejs.org) et [Bun](https://bun.sh)
- Pour Android : [Android Studio](https://developer.android.com/studio)
- Pour iOS : un Mac avec [Xcode](https://developer.apple.com/xcode/)

### Setup
```bash
# 1. Clone le repo depuis GitHub
git clone <ton-repo-github>
cd <ton-repo>

# 2. Installe les dépendances
bun install

# 3. Ajoute la plateforme voulue
bunx cap add android    # pour Android
bunx cap add ios        # pour iOS (Mac uniquement)

# 4. Build web + sync natif
bun run build
bunx cap sync
```

### Ouvrir dans l'IDE natif
```bash
bunx cap open android   # ouvre Android Studio
bunx cap open ios       # ouvre Xcode
```

### Générer l'APK Android
Dans Android Studio :
1. `Build` → `Build Bundle(s) / APK(s)` → `Build APK(s)`
2. Le `.apk` apparaît dans `android/app/build/outputs/apk/debug/`
3. Transfère-le sur ton téléphone et installe-le

### Mettre à jour l'app plus tard
Comme l'app pointe vers l'URL Lovable publiée, **tu n'as PAS besoin de
rebuild l'app** quand tu modifies le site : il suffit de re-publier depuis
Lovable et l'app se met à jour automatiquement au prochain lancement.

Rebuild l'APK uniquement si tu veux :
- Changer l'icône, le nom ou le splash screen de l'app
- Ajouter des plugins natifs (caméra, notifications push, etc.)
- Changer l'URL cible dans `capacitor.config.ts`

## Mémoire de Lyra
La mémoire est stockée côté serveur (Lovable Cloud) et n'est **jamais**
embarquée dans l'app. Aucun risque de la perdre en rebuildant l'APK.