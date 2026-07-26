
# Plan — Espace multi-utilisateurs pour Lyra

Ton compte (`alexandramiart@gmail.com`) reste **intact** : même UI, même mémoire, même bot Telegram, même prompt. Tout ce qui suit ne s'applique qu'aux **autres utilisateurs**.

## 1. Onboarding en 4 étapes (nouveaux comptes uniquement)

Après connexion Google, si le profil n'existe pas encore → wizard plein écran. Barre de progression en haut, bouton **Précédent** en bas à gauche, **Continuer** en bas à droite.

**Étape 1 — Prénom + Genre**
- Champ prénom (obligatoire, libre)
- 2 cartes modernes cliquables : *Homme* / *Femme* (encadrement animé sur sélection, dégradé bleu ou rose selon le choix)
- Sous-option discrète : « Je suis en transition » (case à cocher) → permet à l'IA de savoir que l'accord peut évoluer

**Étape 2 — Avatar**
- Grand rond central pour l'avatar choisi
- Choix entre :
  - Uploader une photo (via input file, stockée en base64 dans le profil)
  - Sélectionner un des ~8 avatars pré-dessinés (générés, adaptés au genre choisi)

**Étape 3 — Thème couleur**
- Barre horizontale scrollable avec ~6 palettes (rose/violet, bleu nuit, vert forêt, orange coucher, gris minimal, cyan néon)
- Aperçu live du bouton principal + fond
- Sauvegardé dans le profil, appliqué via CSS variables

**Étape 4 — Récap + « Commencer »**
- Affiche prénom, avatar, palette
- Bouton *Précédent* / *Terminer*

## 2. Isolation stricte de la mémoire

- Toutes les conversations (`web_messages`) sont déjà filtrées par `user_id` (RLS). ✅
- Le prompt système envoyé à l'IA est **construit dynamiquement** à partir du profil de l'utilisateur (prénom, genre, transition). Ton prompt Lyra actuel reste utilisé uniquement pour ton compte.
- Nouvelle table `user_profiles` : `user_id, display_name, gender, in_transition, avatar_url, theme, telegram_bot_token, telegram_chat_id, onboarded_at`.

## 3. Menu latéral discret (side-notch) — pour tous, y compris toi

Ajout de 2 entrées :
- **Personnalisation** → réouvre l'écran thème + avatar + prénom
- **Telegram** → écran de configuration du bot (voir §4)

Ton compte : le menu apparaît aussi mais tes réglages actuels sont préservés.

## 4. Telegram par utilisateur

Écran dédié dans le menu :
1. Instructions : « Ouvre @BotFather sur Telegram, crée un bot, colle le token ici »
2. Champ token + bouton **Connecter**
3. Barre de progression + étapes affichées en live :
   - « Enregistrement du token… »
   - « Configuration du webhook… »
   - « Vérification du bot… »
   - « ✅ Prêt ! Écris à ton bot sur Telegram »
4. Le token est stocké chiffré dans `user_profiles`. Le webhook Telegram pointe vers `/api/public/telegram/webhook` avec un paramètre `?u=<user_id>` pour router les messages vers le bon utilisateur.
5. Chaque bot ne parle qu'à **son** utilisateur (verrouillage sur le premier `chat_id` qui écrit).
6. Les messages Telegram atterrissent dans `web_messages` du bon `user_id` → mémoire partagée site/Telegram par personne, jamais entre personnes.

Ton bot actuel (`TELEGRAM_API_KEY` connector) continue de fonctionner comme aujourd'hui pour ton compte uniquement.

## 5. Adaptation IA au genre & prénom

Prompt système généré à la volée :
- Homme → « Tu appelles [prénom]. Tu t'adresses à lui au masculin. »
- Femme → « … au féminin. »
- En transition → « L'utilisateur/trice est en transition. Adapte-toi immédiatement s'il/elle demande un changement d'accord (ex: « appelle-moi elle »). Sois bienveillante, jamais bloquante, respecte son identité. »
- Toujours chaleureuse, tendre, jamais moralisatrice, libre dans l'expression.

## 6. Détails techniques

- Migration Supabase : nouvelle table `public.user_profiles` + RLS (`auth.uid() = user_id`) + GRANT.
- Nouveaux server functions : `getMyProfile`, `saveOnboarding`, `updateTheme`, `setupTelegramBot`.
- Route `/onboarding` (protégée) : redirection auto depuis `/` si profil incomplet et email ≠ le tien.
- Nouveau webhook Telegram accepte `?u=<user_id>` pour router ; l'ancien (sans param) reste dédié à ton compte.
- Thèmes appliqués via `data-theme` sur `<html>` + CSS vars dans `styles.css`.

## Livrables

- 5 nouvelles routes/écrans (onboarding × 4 + telegram setup + personnalisation)
- 1 migration DB
- 3–4 server functions
- Menu latéral enrichi
- Prompt IA dynamique
- Aucun changement sur ton expérience actuelle
