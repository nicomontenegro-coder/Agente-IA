-- AlterTable
ALTER TABLE "Familia" ADD COLUMN "codigoUnspsc" TEXT;
ALTER TABLE "Familia" ADD COLUMN "segmento" TEXT;

-- CreateTable
CREATE TABLE "Clase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "familiaId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    CONSTRAINT "Clase_familiaId_fkey" FOREIGN KEY ("familiaId") REFERENCES "Familia" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ClaseAtributo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "claseId" TEXT NOT NULL,
    "posicion" INTEGER NOT NULL,
    "clave" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "unidad" TEXT,
    "opciones" TEXT,
    "soloSi" TEXT,
    "obligatorio" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "ClaseAtributo_claseId_fkey" FOREIGN KEY ("claseId") REFERENCES "Clase" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ListaPreciosItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "listaId" TEXT NOT NULL,
    "posicion" INTEGER NOT NULL,
    "familia" TEXT NOT NULL,
    "grupo" TEXT,
    "descripcion" TEXT NOT NULL,
    "especificacion" TEXT,
    "unidad" TEXT NOT NULL,
    "precio" REAL,
    "pn" TEXT,
    "productoId" TEXT,
    CONSTRAINT "ListaPreciosItem_listaId_fkey" FOREIGN KEY ("listaId") REFERENCES "ListaPrecios" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ListaPreciosItem_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ListaPreciosItem" ("descripcion", "especificacion", "familia", "grupo", "id", "listaId", "pn", "posicion", "precio", "unidad") SELECT "descripcion", "especificacion", "familia", "grupo", "id", "listaId", "pn", "posicion", "precio", "unidad" FROM "ListaPreciosItem";
DROP TABLE "ListaPreciosItem";
ALTER TABLE "new_ListaPreciosItem" RENAME TO "ListaPreciosItem";
CREATE TABLE "new_Producto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "codigo" TEXT,
    "nombre" TEXT NOT NULL,
    "especificacion" TEXT,
    "unidad" TEXT NOT NULL DEFAULT 'u',
    "codigoHS" TEXT,
    "certificacionLocal" TEXT,
    "familiaId" TEXT,
    "claseId" TEXT,
    "modelo" TEXT,
    "atributos" TEXT,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Producto_familiaId_fkey" FOREIGN KEY ("familiaId") REFERENCES "Familia" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Producto_claseId_fkey" FOREIGN KEY ("claseId") REFERENCES "Clase" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Producto" ("certificacionLocal", "codigo", "codigoHS", "creadoEn", "especificacion", "familiaId", "id", "nombre", "unidad") SELECT "certificacionLocal", "codigo", "codigoHS", "creadoEn", "especificacion", "familiaId", "id", "nombre", "unidad" FROM "Producto";
DROP TABLE "Producto";
ALTER TABLE "new_Producto" RENAME TO "Producto";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Clase_familiaId_nombre_key" ON "Clase"("familiaId", "nombre");

-- CreateIndex
CREATE UNIQUE INDEX "ClaseAtributo_claseId_clave_key" ON "ClaseAtributo"("claseId", "clave");

-- Las clases y sus atributos son datos (se corrigen sin programar). Se cargan
-- aquí las dos primeras, según UNSPSC a escala GESI: segmento 40, familia 4017.
INSERT OR IGNORE INTO "Familia" ("id", "nombre") VALUES ('fam-tuberias-fittings', 'Tuberías y fittings');
UPDATE "Familia" SET "segmento" = '40 Sistemas de distribución y acondicionamiento', "codigoUnspsc" = '4017' WHERE "nombre" = 'Tuberías y fittings';

INSERT INTO "Clase" ("id", "familiaId", "nombre") SELECT 'clase-tubo', "id", 'Tubo' FROM "Familia" WHERE "nombre" = 'Tuberías y fittings';
INSERT INTO "Clase" ("id", "familiaId", "nombre") SELECT 'clase-fitting', "id", 'Fitting' FROM "Familia" WHERE "nombre" = 'Tuberías y fittings';

INSERT INTO "ClaseAtributo" ("id", "claseId", "posicion", "clave", "nombre", "tipo", "unidad", "opciones", "soloSi", "obligatorio") VALUES
  ('at-tubo-material', 'clase-tubo', 0, 'material', 'Material', 'OPCION', NULL, 'PPR,PVC,PE,PE-RT,cobre,galvanizado', NULL, 1),
  ('at-tubo-union', 'clase-tubo', 1, 'union', 'Unión', 'OPCION', NULL, 'termofusión,cementado,rosca,compresión', NULL, 1),
  ('at-tubo-dn', 'clase-tubo', 2, 'dn', 'Diámetro', 'NUMERO', 'mm', NULL, NULL, 1),
  ('at-tubo-espesor', 'clase-tubo', 3, 'espesor', 'Espesor de pared', 'NUMERO', 'mm', NULL, NULL, 1),
  ('at-tubo-largo', 'clase-tubo', 4, 'largo', 'Largo de tira', 'NUMERO', 'm', NULL, NULL, 0),
  ('at-tubo-aislacion', 'clase-tubo', 5, 'aislacion', 'Aislación', 'OPCION', NULL, 'desnudo,preaislado', NULL, 1),
  ('at-fit-material', 'clase-fitting', 0, 'material', 'Material', 'OPCION', NULL, 'PPR,PVC,bronce,galvanizado,acero inoxidable', NULL, 1),
  ('at-fit-union', 'clase-fitting', 1, 'union', 'Unión', 'OPCION', NULL, 'termofusión,cementado,rosca,compresión', NULL, 1),
  ('at-fit-tipo', 'clase-fitting', 2, 'tipo', 'Tipo', 'OPCION', NULL, 'codo 90°,codo 45°,tee,copla,reducción,terminal,tapón', NULL, 1),
  ('at-fit-dn', 'clase-fitting', 3, 'dn', 'Diámetro', 'NUMERO', 'mm', NULL, NULL, 1),
  ('at-fit-dn2', 'clase-fitting', 4, 'dn2', 'Diámetro 2', 'NUMERO', 'mm', NULL, 'tipo=reducción,tee', 0),
  ('at-fit-rosca', 'clase-fitting', 5, 'rosca', 'Rosca', 'TEXTO', NULL, NULL, 'tipo=terminal', 0),
  ('at-fit-inserto', 'clase-fitting', 6, 'inserto', 'Inserto', 'OPCION', NULL, 'bronce,acero', 'tipo=terminal', 0);
