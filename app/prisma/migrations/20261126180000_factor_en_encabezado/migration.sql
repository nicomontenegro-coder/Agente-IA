-- El factor de internación pasa de cada familia al encabezado de la lista de
-- venta: es uno solo para toda la lista. Las familias ganan la unidad de venta
-- (el tubo se cotiza por metro y se vende por tira de 4 m).

ALTER TABLE "ListaVenta" ADD COLUMN "factor" REAL;
ALTER TABLE "ListaVenta" ADD COLUMN "factorOrigen" TEXT;

-- Lo ya escrito no se pierde: el encabezado toma el factor de la primera
-- familia que lo tenga, con su origen.
UPDATE "ListaVenta" SET
  "factor" = (SELECT f."factor" FROM "ListaVentaFamilia" f WHERE f."listaVentaId" = "ListaVenta"."id" AND f."factor" IS NOT NULL ORDER BY f."rowid" LIMIT 1),
  "factorOrigen" = (SELECT f."factorOrigen" FROM "ListaVentaFamilia" f WHERE f."listaVentaId" = "ListaVenta"."id" AND f."factor" IS NOT NULL ORDER BY f."rowid" LIMIT 1);

PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ListaVentaFamilia" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "listaVentaId" TEXT NOT NULL,
    "familia" TEXT NOT NULL,
    "margenPct" REAL,
    "unidadVenta" TEXT,
    "contenido" REAL,
    CONSTRAINT "ListaVentaFamilia_listaVentaId_fkey" FOREIGN KEY ("listaVentaId") REFERENCES "ListaVenta" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ListaVentaFamilia" ("id", "listaVentaId", "familia", "margenPct") SELECT "id", "listaVentaId", "familia", "margenPct" FROM "ListaVentaFamilia";
DROP TABLE "ListaVentaFamilia";
ALTER TABLE "new_ListaVentaFamilia" RENAME TO "ListaVentaFamilia";
CREATE UNIQUE INDEX "ListaVentaFamilia_listaVentaId_familia_key" ON "ListaVentaFamilia"("listaVentaId", "familia");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
