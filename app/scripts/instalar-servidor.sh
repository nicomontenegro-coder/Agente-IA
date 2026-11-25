#!/bin/bash
# Instala la app GESI en el mismo servidor de Importa, al lado, sin tocarla.
# Se corre una sola vez, en el servidor, como ubuntu:
#
#   curl -fsSL <este archivo en GitHub> | bash -s -- <rama>
#
# Queda en https://gesi.<la-ip-con-guiones>.sslip.io, con el mismo usuario y
# clave de Importa, y desde ahí se actualiza sola desde GitHub cada dos minutos.
set -euo pipefail

RAMA="${1:-main}"
REPO=/home/ubuntu/agente-ia
APP=$REPO/app

[ "$(id -un)" = ubuntu ] || { echo "✗ Esto se corre como ubuntu, en el servidor"; exit 1; }
command -v node >/dev/null || { echo "✗ Falta Node: este servidor debería tenerlo por Importa"; exit 1; }
command -v caddy >/dev/null || { echo "✗ Falta Caddy: este servidor debería tenerlo por Importa"; exit 1; }

echo "── Código desde GitHub (rama $RAMA)"
echo "$RAMA" > /home/ubuntu/.gesi-rama
if [ ! -d "$REPO/.git" ]; then
  git clone --quiet --branch "$RAMA" https://github.com/nicomontenegro-coder/Agente-IA.git "$REPO"
fi

echo "── Servicio de la app (puerto 3010)"
sudo tee /etc/systemd/system/gesi.service >/dev/null <<UNIT
[Unit]
Description=GESI (compras)
After=network.target

[Service]
User=ubuntu
WorkingDirectory=$APP
Environment=NODE_ENV=production
Environment=TZ=America/Santiago
Environment=GESI_DIST_DIR=.next-nube
Environment=DATABASE_URL=file:$APP/prisma/gesi.db
Environment=GESI_DOCUMENTOS=/home/ubuntu/gesi-documentos
# La clave de la API para leer PDF es la misma de Importa; el guion previo la omite si no existe.
EnvironmentFile=-/etc/importa.env
ExecStart=/usr/bin/node $APP/node_modules/next/dist/bin/next start -H 127.0.0.1 -p 3010
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
UNIT
echo 'ubuntu ALL=(root) NOPASSWD: /usr/bin/systemctl restart gesi' | sudo tee /etc/sudoers.d/gesi-despliegue >/dev/null
sudo chmod 440 /etc/sudoers.d/gesi-despliegue
sudo systemctl daemon-reload
sudo systemctl enable gesi >/dev/null

echo "── Primera instalación y compilación (unos minutos)"
bash "$APP/scripts/auto-desplegar.sh"

echo "── Dirección con HTTPS y la misma clave de Importa"
IP="$(curl -s -m 10 https://api.ipify.org || true)"
[ -n "$IP" ] || { echo "✗ No pude saber la IP pública del servidor"; exit 1; }
DOMINIO="gesi.$(echo "$IP" | tr . -).sslip.io"
if ! grep -q "$DOMINIO" /etc/caddy/Caddyfile; then
  # Copia el bloque de usuario y clave de Importa: un solo acceso para las dos apps.
  CLAVE="$(awk '/basic_auth/{f=1} f{print} f&&/}/{exit}' /etc/caddy/Caddyfile)"
  [ -n "$CLAVE" ] || { echo "✗ No encontré la clave de Importa en /etc/caddy/Caddyfile"; exit 1; }
  sudo cp /etc/caddy/Caddyfile "/etc/caddy/Caddyfile.antes-de-gesi"
  { echo; echo "$DOMINIO {"; echo "	encode gzip"; echo "$CLAVE"; echo "	reverse_proxy 127.0.0.1:3010"; echo "}"; } | sudo tee -a /etc/caddy/Caddyfile >/dev/null
  if ! sudo caddy validate --config /etc/caddy/Caddyfile >/dev/null 2>&1; then
    sudo cp /etc/caddy/Caddyfile.antes-de-gesi /etc/caddy/Caddyfile
    echo "✗ La configuración de Caddy quedó mal: la dejé como estaba. Importa no se tocó."
    exit 1
  fi
  sudo systemctl reload caddy
fi

echo "── Actualización automática (cada dos minutos)"
sudo tee /etc/systemd/system/gesi-despliegue.service >/dev/null <<UNIT
[Unit]
Description=Traer cambios de GitHub y desplegar GESI
After=network-online.target

[Service]
Type=oneshot
User=ubuntu
Environment=HOME=/home/ubuntu
TimeoutStartSec=1800
ExecStart=/bin/bash $APP/scripts/auto-desplegar.sh
UNIT
sudo tee /etc/systemd/system/gesi-despliegue.timer >/dev/null <<'UNIT'
[Unit]
Description=Revisar GitHub cada dos minutos (GESI)

[Timer]
OnBootSec=3min
OnUnitActiveSec=2min
Unit=gesi-despliegue.service

[Install]
WantedBy=timers.target
UNIT
sudo systemctl daemon-reload
sudo systemctl enable --now gesi-despliegue.timer >/dev/null

echo
echo "✓ GESI está en https://$DOMINIO (mismo usuario y clave que Importa)"
