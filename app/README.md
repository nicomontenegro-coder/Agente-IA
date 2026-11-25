# App GESI — Compras (P2P)

La app nueva de GESI, organizada por procesos. Por ahora cubre la primera mitad del proceso de
compra, de la necesidad a la orden de compra y sus pagos. El diseño está en `../diseno/p2p.md`.

## Qué hace

- **Compras:** cada compra es el proceso completo, con varios productos, y muestra en qué etapa va
  y qué sigue. Las etapas se marcan solas con lo que registras.
- **RFQ:** se invita a varios proveedores; cada uno tiene su texto en inglés (para enviar) y en
  español (para revisar), con los 10 puntos del formato GESI. Se ve quién respondió y quién no.
- **Cotizaciones y comparativa:** precio por producto, con los filtros de GESI (certificados y
  carta de crédito) y aviso si los incoterms no son comparables.
- **Orden de compra:** copia los precios (quedan congelados) y sale imprimible en inglés y
  español con el formato GESI. Carta de crédito en el primer embarque; T/T en los siguientes.
- **Proveedores, productos y ajustes:** familias, certificados y datos de GESI.

## Usar

```bash
npm install
npm run demo:crear   # base de demostración con datos ficticios
npm run demo         # http://127.0.0.1:3001
npm test             # pruebas de la lógica
npm run typecheck
```

## Cómo está hecha

- Lógica pura y probada en `src/lib/` (`compra.ts`, `proveedores.ts`, `documentos.ts`, `numeros.ts`).
- Reutiliza de Importa: incoterms, formato de números y fechas, textos de RFQ, componentes y estilos.
- Next.js 16, Prisma 7 y SQLite, igual que Importa.

## En el servidor

- Corre en el mismo servidor de Oracle que Importa, en el puerto 3010, y se actualiza sola desde
  GitHub cada dos minutos (`scripts/auto-desplegar.sh`). Se instaló con `scripts/instalar-servidor.sh`.
- Direcciones: **https://compras.gesi.cl** (esta app) e **https://importa.gesi.cl** (Importa), con el
  mismo usuario y clave. También responden las direcciones `sslip.io` con la IP.
- El DNS de gesi.cl está en TuWeb (cPanel, Editor de zona): dos registros A, `importa` y `compras`,
  hacia la IP del servidor. **Si Oracle cambia la IP, se actualizan esos dos registros**; el correo y
  la web de gesi.cl no dependen de ellos. Caddy toma los nombres con `scripts/dominio-propio.sh`.

## Falta

Muestras, documentos de embarque, recepción, calce de 3 vías, landed cost en la comparativa,
y publicarla en el servidor.

## Tono de los textos

Tono estándar de aplicación de negocios, en toda la app:

- Títulos que nombran la acción o el objeto: «Asignar proveedor», «Nuevo proveedor», no preguntas ni frases coloquiales.
- Instrucciones y errores cortos, en imperativo: «Ingresa…», «Selecciona…». Sin explicar el porqué en la pantalla (eso va en los comentarios del código).
- Estados y avisos como etiquetas: «Certificados pendientes», «Montos verificados», «Requiere revisión».
- Nada que hable de «la IA» como si fuera una persona: «Datos leídos del documento», «Lectura automática no disponible».
