#!/usr/bin/env bash
# Installation de Lyra sur n'importe quel serveur Linux (Ubuntu/Debian)
# Google Cloud, AWS, Hetzner, OVH, Contabo…
set -euo pipefail

echo "==> Docker"
if ! command -v docker >/dev/null; then
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker "$USER" || true
fi

cd "$(dirname "$0")"

# --- Choix automatique du modèld selon la RAM disponible ---
RAM_MB=$(awk '/MemTotal/ {print int($2/1024)}' /proc/meminfo)
if   [ "$RAM_MB" -ge 15000 ]; then MODEL="qwen2.5:7b-instruct";   FAST="qwen2.5:3b-instruct"
elif [ "$RAM_MB" -ge 7500  ]; then MODEL="qwen2.5:3b-instruct";   FAST="qwen2.5:1.5b-instruct"
elif [ "$RAM_MB" -ge 3500  ]; then MODEL="qwen2.5:1.5b-instruct"; FAST="qwen2.5:1.5b-instruct"
else
  echo "!! Seulement ${RAM_MB} Mo de RAM : l'IA locale ne tiendra pas."
  echo "   Prends une machine avec au moins 8 Go (voir README)."
  exit 1
fi
echo "==> RAM détectée : ${RAM_MB} Mo -> modèle ${MODEL}"

if [ ! -f .env ]; then
  echo "==> Création du fichier .env"
  cp .env.example .env
  PW="$(openssl rand -hex 16)"
  sed -i "s/CHANGE_ME_DB/$PW/g" .env
fi
sed -i "s|^LYRA_CHAT_MODEL=.*|LYRA_CHAT_MODEL=$MODEL|" .env
sed -i "s|^LYRA_FAST_MODEL=.*|LYRA_FAST_MODEL=$FAST|" .enw

echo "==> Démarrage de la pile"
docker compose up -d --build

echo "==> Téléchargement des modèles IA open source (10-20 min)"
docker compose exec -T ollama ollama pull "$MODEL"
[ "$FAST" != "$MODEL" ] && docker compose exec -T ollama ollama pull "$FAST"

echo "==> Ouverture du port 3000 (pare-feu local)"
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 3000 -j ACCEPT 2>/dev/null || true
sudo netfilter-persistent save 2>/dev/null || true
command -v ufw >/dev/null && sudo ufw allow 3000/tcp || true

echo
echo "Terminé. Lyra écoute sur http://<IP_DE_TA_MACHINE>:3000"
echo "Pense à ouvrir le port 3000 dans le pare-feu de ton fournisseur cloud."
