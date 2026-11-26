-- CreateTable
CREATE TABLE "ListaPrecios" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "proveedorId" TEXT NOT NULL,
    "archivo" TEXT NOT NULL,
    "archivoNombre" TEXT NOT NULL,
    "fecha" DATETIME NOT NULL,
    "validezDias" INTEGER,
    "moneda" TEXT NOT NULL DEFAULT 'USD',
    "incoterm" TEXT,
    "lugar" TEXT,
    "notas" TEXT,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ListaPrecios_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "Proveedor" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ListaPreciosItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "listaId" TEXT NOT NULL,
    "posicion" INTEGER NOT NULL,
    "familia" TEXT NOT NULL,
    "grupo" TEXT,
    "descripcion" TEXT NOT NULL,
    "especificacion" TEXT,
    "unidad" TEXT NOT NULL,
    "precio" REAL,
    CONSTRAINT "ListaPreciosItem_listaId_fkey" FOREIGN KEY ("listaId") REFERENCES "ListaPrecios" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ListaVenta" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "listaPreciosId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "tipoCambio" REAL,
    "entrega" TEXT,
    "condiciones" TEXT,
    "validezDias" INTEGER,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" DATETIME NOT NULL,
    CONSTRAINT "ListaVenta_listaPreciosId_fkey" FOREIGN KEY ("listaPreciosId") REFERENCES "ListaPrecios" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ListaVentaFamilia" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "listaVentaId" TEXT NOT NULL,
    "familia" TEXT NOT NULL,
    "factor" REAL,
    "factorOrigen" TEXT,
    "margenPct" REAL,
    CONSTRAINT "ListaVentaFamilia_listaVentaId_fkey" FOREIGN KEY ("listaVentaId") REFERENCES "ListaVenta" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ListaVentaFamilia_listaVentaId_familia_key" ON "ListaVentaFamilia"("listaVentaId", "familia");
