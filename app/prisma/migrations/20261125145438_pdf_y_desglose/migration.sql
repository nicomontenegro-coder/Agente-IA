-- AlterTable
ALTER TABLE "Compra" ADD COLUMN "medidaRef" REAL;
ALTER TABLE "Compra" ADD COLUMN "unidadRef" TEXT;

-- AlterTable
ALTER TABLE "Cotizacion" ADD COLUMN "archivo" TEXT;
ALTER TABLE "Cotizacion" ADD COLUMN "archivoNombre" TEXT;
ALTER TABLE "Cotizacion" ADD COLUMN "gastosDocumento" REAL;
ALTER TABLE "Cotizacion" ADD COLUMN "subtotalDocumento" REAL;
ALTER TABLE "Cotizacion" ADD COLUMN "totalDocumento" REAL;

-- CreateTable
CREATE TABLE "CotizacionDesglose" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cotizacionId" TEXT NOT NULL,
    "posicion" INTEGER NOT NULL,
    "descripcion" TEXT NOT NULL,
    "unidad" TEXT,
    "cantidad" REAL,
    "precioUnitario" REAL,
    "monto" REAL,
    CONSTRAINT "CotizacionDesglose_cotizacionId_fkey" FOREIGN KEY ("cotizacionId") REFERENCES "Cotizacion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LecturaPendiente" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invitacionId" TEXT NOT NULL,
    "archivo" TEXT NOT NULL,
    "archivoNombre" TEXT NOT NULL,
    "lectura" TEXT,
    "error" TEXT,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
