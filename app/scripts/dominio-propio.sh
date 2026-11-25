#!/bin/bash
# Agrega importa.gesi.cl y compras.gesi.cl al servidor, con HTTPS y la misma
# clave de siempre. Las direcciones sslip.io siguen funcionando igual.
#
# Antes: en el DNS de gesi.cl (TuWeb), dos registros A hacia la IP del servidor.
# Se corre una vez, en el servidor, como ubuntu. Se puede repetir sin daño.
set -euo pipefail

DOMINIO="${1:-gesi.cl}"
IMPORTA="importa.$DOMINIO"
COMPRAS="compras.$DOMINIO"
CADDY=/etc/caddy/Caddyfile

[ "$(id -un)" = ubuntu ] || { echo "✗ Esto se corre como ubuntu, en el servidor"; exit 1; }

CLAVE="$(awk '/basic_auth/{f=1} f{print} f&&/}/{exit}' "$CADDY")"
[ -n "$CLAVE" ] || { echo "✗ No encontré la clave de Importa en $CADDY"; exit 1; }

sudo cp "$CADDY" "$CADDY.antes-de-$DOMINIO"
agregar() {
  local nombre="$1" puerto="$2" extra="$3"
  if grep -q "^$nombre {" "$CADDY"; then
    echo "   $nombre ya estaba"
    return
  fi
  { echo; echo "$nombre {"; echo "	encode gzip"; [ -n "$extra" ] && echo "$extra"; echo "$CLAVE"; echo "	reverse_proxy 127.0.0.1:$puerto"; echo "}"; } | sudo tee -a "$CADDY" >/dev/null
  echo "   $nombre → puerto $puerto"
}
echo "── Agregando las direcciones"
agregar "$IMPORTA" 3000 "	request_body {
		max_size 110MB
	}"
agregar "$COMPRAS" 3010 ""

if ! sudo caddy validate --config "$CADDY" >/dev/null 2>&1; then
  sudo cp "$CADDY.antes-de-$DOMINIO" "$CADDY"
  echo "✗ La configuración quedó mal: la dejé como estaba. Nada cambió."
  exit 1
fi
sudo systemctl reload caddy

echo
echo "✓ Listo. Si el DNS ya apunta al servidor, en un par de minutos funcionan:"
echo "    https://$IMPORTA"
echo "    https://$COMPRAS"
echo "  (Caddy saca el certificado HTTPS solo; si el DNS todavía no se propaga, lo reintenta.)"
