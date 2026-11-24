#!/bin/bash
# Trae los cambios de GitHub y pone en marcha la app GESI, en el servidor.
#
# Lo llama un temporizador cada dos minutos. Si no hay nada nuevo, sale sin
# hacer ruido. La app nunca queda caída por un cambio malo: se compila en una
# carpeta aparte y solo se cambia la que está en uso si todo salió bien.
set -euo pipefail

REPO=/home/ubuntu/agente-ia
APP=$REPO/app
RAMA="$(cat /home/ubuntu/.gesi-rama 2>/dev/null || echo main)"
RESPALDOS=/home/ubuntu/gesi-respaldos
export DATABASE_URL="file:$APP/prisma/gesi.db"

cd "$REPO"
git fetch --quiet origin "$RAMA"
ACTUAL="$(git rev-parse HEAD)"
NUEVO="$(git rev-parse "origin/$RAMA")"
[ "$ACTUAL" = "$NUEVO" ] && [ -d "$APP/.next-nube" ] && exit 0

echo "── $(date '+%F %T')  ${ACTUAL:0:7} → ${NUEVO:0:7}"

mkdir -p "$RESPALDOS"
if [ -f "$APP/prisma/gesi.db" ]; then
  sqlite3 "$APP/prisma/gesi.db" "VACUUM INTO '$RESPALDOS/previo-$(date +%F-%H%M%S).db'"
fi

git reset --hard "$NUEVO"
cd "$APP"
npm install --no-audit --no-fund
npx prisma generate
npx prisma migrate deploy

rm -rf .next-nueva
if ! GESI_DIST_DIR=.next-nueva npx next build; then
  rm -rf .next-nueva
  echo "✗ La compilación falló. La app sigue andando con la versión anterior."
  exit 1
fi
rm -rf .next-anterior
[ -d .next-nube ] && mv .next-nube .next-anterior
mv .next-nueva .next-nube
sudo systemctl restart gesi

for _ in $(seq 1 30); do
  sleep 2
  if curl -sf -o /dev/null -m 5 http://127.0.0.1:3010/compras; then
    echo "✓ ${NUEVO:0:7} en marcha"
    exit 0
  fi
done

echo "✗ La app no responde con ${NUEVO:0:7}. Volviendo a la anterior."
if [ -d .next-anterior ]; then
  rm -rf .next-nube
  mv .next-anterior .next-nube
  cd "$REPO" && git reset --hard "$ACTUAL"
  sudo systemctl restart gesi
fi
exit 1
