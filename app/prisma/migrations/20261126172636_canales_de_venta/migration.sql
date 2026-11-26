-- CreateTable
CREATE TABLE "ListaVentaCanal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "listaVentaId" TEXT NOT NULL,
    "posicion" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "descuentoPct" REAL NOT NULL,
    CONSTRAINT "ListaVentaCanal_listaVentaId_fkey" FOREIGN KEY ("listaVentaId") REFERENCES "ListaVenta" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
