-- El canal de venta deja de ser texto: pasa a ser una tabla, y el cliente y
-- el descuento de cada lista de venta apuntan a ella. El RUT identifica al
-- cliente (único); el nombre deja de serlo. Las gestiones guardan el historial.

CREATE TABLE "CanalVenta" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "posicion" INTEGER NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX "CanalVenta_nombre_key" ON "CanalVenta"("nombre");
INSERT INTO "CanalVenta" ("id", "nombre", "posicion") VALUES
  ('canal-ferreterias', 'Ferreterías', 0),
  ('canal-instaladores', 'Instaladores', 1),
  ('canal-constructoras', 'Constructoras', 2),
  ('canal-otros', 'Otros', 3);
-- Un canal escrito en una lista de venta con otro nombre se conserva como canal propio.
INSERT INTO "CanalVenta" ("id", "nombre", "posicion")
  SELECT 'canal-' || lower(hex(randomblob(8))), t."nombre", 10
  FROM (SELECT DISTINCT trim("nombre") AS "nombre" FROM "ListaVentaCanal") t
  WHERE lower(t."nombre") NOT IN (SELECT lower("nombre") FROM "CanalVenta");

CREATE TABLE "Gestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clienteId" TEXT NOT NULL,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "medio" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "etapaDe" TEXT,
    "etapaA" TEXT,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Gestion_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "Gestion_clienteId_fecha_idx" ON "Gestion"("clienteId", "fecha");
-- El motivo de etapa que ya estaba escrito pasa al historial.
INSERT INTO "Gestion" ("id", "clienteId", "fecha", "medio", "texto", "etapaA")
  SELECT 'ges-' || lower(hex(randomblob(8))), "id", "actualizadoEn", 'NOTA', "notaEtapa", "etapa" FROM "Cliente" WHERE "notaEtapa" IS NOT NULL;

PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Cliente" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "rut" TEXT,
    "canalId" TEXT,
    "ciudad" TEXT,
    "direccion" TEXT,
    "contacto" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "notas" TEXT,
    "etapa" TEXT NOT NULL DEFAULT 'IDENTIFICADO',
    "proximaAccion" TEXT,
    "proximaFecha" DATETIME,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" DATETIME NOT NULL,
    CONSTRAINT "Cliente_canalId_fkey" FOREIGN KEY ("canalId") REFERENCES "CanalVenta" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Cliente" ("id", "nombre", "rut", "canalId", "ciudad", "direccion", "contacto", "telefono", "email", "notas", "etapa", "proximaAccion", "proximaFecha", "creadoEn", "actualizadoEn")
  SELECT "id", "nombre", "rut",
    CASE "tipo" WHEN 'ferretería' THEN 'canal-ferreterias' WHEN 'instalador' THEN 'canal-instaladores'
                WHEN 'constructora' THEN 'canal-constructoras' WHEN 'otro' THEN 'canal-otros' ELSE NULL END,
    "ciudad", "direccion", "contacto", "telefono", "email", "notas", "etapa", "proximaAccion", "proximaFecha", "creadoEn", "actualizadoEn"
  FROM "Cliente";
-- Si dos clientes tenían el mismo RUT, el segundo queda sin RUT (se ve en su ficha) en vez de romper la migración.
UPDATE "new_Cliente" SET "rut" = NULL WHERE "rut" IS NOT NULL AND "rowid" NOT IN (SELECT min("rowid") FROM "new_Cliente" WHERE "rut" IS NOT NULL GROUP BY "rut");
DROP TABLE "Cliente";
ALTER TABLE "new_Cliente" RENAME TO "Cliente";
CREATE UNIQUE INDEX "Cliente_rut_key" ON "Cliente"("rut");

CREATE TABLE "new_ListaVentaCanal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "listaVentaId" TEXT NOT NULL,
    "posicion" INTEGER NOT NULL,
    "canalId" TEXT NOT NULL,
    "descuentoPct" REAL NOT NULL,
    CONSTRAINT "ListaVentaCanal_listaVentaId_fkey" FOREIGN KEY ("listaVentaId") REFERENCES "ListaVenta" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ListaVentaCanal_canalId_fkey" FOREIGN KEY ("canalId") REFERENCES "CanalVenta" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ListaVentaCanal" ("id", "listaVentaId", "posicion", "canalId", "descuentoPct")
  SELECT l."id", l."listaVentaId", l."posicion", c."id", l."descuentoPct"
  FROM "ListaVentaCanal" l JOIN "CanalVenta" c ON lower(c."nombre") = lower(trim(l."nombre"));
DROP TABLE "ListaVentaCanal";
ALTER TABLE "new_ListaVentaCanal" RENAME TO "ListaVentaCanal";
CREATE UNIQUE INDEX "ListaVentaCanal_listaVentaId_canalId_key" ON "ListaVentaCanal"("listaVentaId", "canalId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
