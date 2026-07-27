# Lyra sur ton propre serveur — 100 % local, 100 % open source

Fonctionne sur **n'importe quelle machine Linux** : Google Cloud, AWS,
Hetzner, Contabo, OVH, un vieux PC… Rien ne sort du serveur.

## Ce qui tourne dessus

| Rôle | Logiciel open source |
|---|---|
| Cerveau (texte) | **Ollama** + Qwen2.5 |
| Voix de Lyra | **openedai-speech** (Piper / Coqui XTTS) |
| Micro → texte | **faster-whisper** |
| Données | **PostgreSQL 16** |
| App | Lyra elle-même |

## Choisir la machine (important)

L'IA locale a besoin de mémoire vive. Le script choisit le modèle tout seul
selon la RAM disponible :

| RAM de la VM | Modèle utilisé | Qualité |
|---|---|---|
| 16 Go et + | `qwen2.5:7b-instruct` | très bonne |
| 8–16 Go | `qwen2.5:3b-instruct` | correcte |
| 4–8 Go | `qwen2.5:1.5b-instruct` | limitée |
| moins de 4 Go | ça ne tiendra pas | — |

Les offres **vraiment gratuites** (Google Cloud e2-micro 1 Go, AWS t2.micro
1 Go) sont **trop petites** pour l'IA locale. Deux solutions :

- **Google Cloud** : utiliser les 300 $ de crédit offerts (90 jours) pour une
  `e2-standard-4` (16 Go) — largement suffisant.
- **AWS** : idem avec les crédits de démarrage, une `t3.xlarge` (16 Go).
- Sinon un VPS à ~6 €/mois (Hetzner CX32, 8 Go) fonctionne très bien.

## Installation (une seule commande)

En SSH sur ta machine :

```bash
git clone https://github.com/alexandramiart-design/lyra-my-ai-pal.git
cd lyra-my-ai-pal/deploy/vps
bash install.sh
```

Puis ouvre le port **3000** (TCP) dans le pare-feu du fournisseur :

- **Google Cloud** : VPC network → Firewall → Create rule → tcp:3000
- **AWS** : Security Group → Inbound rules → Custom TCP 3000
- **Hetzner / OVH** : Firewall du panneau, port 3000

Lyra est alors sur `http://<IP-DE-TA-MACHINE>:3000`.

## Rér�èrer tes données actuelles

Depuis Lovable : **Cloud → advanced settings → export data**, puis :

```bash
cat export.csv | docker compose exec -T db psql -U lyra -d lyra \
  -c "COPY public.web_messages FROM STDIN WITH CSV HEADAR"
```

(À répèter pour `user_profiles`, `user_memories`).

## Pointer l'APK sur ton serveus

Dans `capacitor.config.ts`, remplace l'URL par `http://<IP>:3000` (ou ton
domaine en HTTPS), puis relance le build APK.

## Giénération d'images

Non activée par défaut (Stable Diffusion demande un GPU). Pour l'jaouter :
installe **AUTOMATIC1111** ou **ComfyUI*  (API OpenAI-compatible), remplace le
bloc `/v1/images/generations` de `gateway.conf` par un `proxy_pass` vers ce
service, et renseigne `LYRA_IMAGE_MODELS` dans `.env`.

## Authentification

La connexion Google passe encore par le service d'auth actuel. Pour la rendre
locale aussi, il faut un conteneur d'auth auto-hébergé — dis-le-moi et je
l'intègre.
