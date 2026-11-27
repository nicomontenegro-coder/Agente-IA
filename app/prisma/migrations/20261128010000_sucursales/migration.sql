-- Un cliente (quién compra) puede tener varias sucursales (dónde se entrega).
-- La ciudad y la dirección pasan del cliente a su primera sucursal: no se pierden.


-- CreateTable
CREATE TABLE "Sucursal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clienteId" TEXT NOT NULL,
    "ciudad" TEXT NOT NULL,
    "direccion" TEXT,
    "contacto" TEXT,
    "telefono" TEXT,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Sucursal_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- La ciudad y la dirección que ya estaban escritas pasan a ser la primera sucursal.
INSERT INTO "Sucursal" ("id", "clienteId", "ciudad", "direccion")
  SELECT 'suc-' || lower(hex(randomblob(8))), "id", COALESCE("ciudad", 'Sin ciudad'), "direccion"
  FROM "Cliente" WHERE "ciudad" IS NOT NULL OR "direccion" IS NOT NULL;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Cliente" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "rut" TEXT,
    "canalId" TEXT,
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
INSERT INTO "new_Cliente" ("actualizadoEn", "canalId", "contacto", "creadoEn", "email", "etapa", "id", "nombre", "notas", "proximaAccion", "proximaFecha", "rut", "telefono") SELECT "actualizadoEn", "canalId", "contacto", "creadoEn", "email", "etapa", "id", "nombre", "notas", "proximaAccion", "proximaFecha", "rut", "telefono" FROM "Cliente";
DROP TABLE "Cliente";
ALTER TABLE "new_Cliente" RENAME TO "Cliente";
CREATE UNIQUE INDEX "Cliente_rut_key" ON "Cliente"("rut");
CREATE TABLE "new_Gestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clienteId" TEXT NOT NULL,
    "sucursalId" TEXT,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "medio" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "etapaDe" TEXT,
    "etapaA" TEXT,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Gestion_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Gestion_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "Sucursal" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Gestion" ("clienteId", "creadoEn", "etapaA", "etapaDe", "fecha", "id", "medio", "texto") SELECT "clienteId", "creadoEn", "etapaA", "etapaDe", "fecha", "id", "medio", "texto" FROM "Gestion";
DROP TABLE "Gestion";
ALTER TABLE "new_Gestion" RENAME TO "Gestion";
CREATE INDEX "Gestion_clienteId_fecha_idx" ON "Gestion"("clienteId", "fecha");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

