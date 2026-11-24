-- CreateTable
CREATE TABLE "Empresa" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "nombre" TEXT NOT NULL DEFAULT 'GESI SpA',
    "rut" TEXT,
    "direccion" TEXT,
    "contacto" TEXT,
    "email" TEXT,
    "telefono" TEXT,
    "garantiaMeses" INTEGER,
    "anticipoPct" REAL NOT NULL DEFAULT 30
);

-- CreateTable
CREATE TABLE "Familia" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Producto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "codigo" TEXT,
    "nombre" TEXT NOT NULL,
    "especificacion" TEXT,
    "unidad" TEXT NOT NULL DEFAULT 'u',
    "codigoHS" TEXT,
    "certificacionLocal" TEXT,
    "familiaId" TEXT,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Producto_familiaId_fkey" FOREIGN KEY ("familiaId") REFERENCES "Familia" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Proveedor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "pais" TEXT,
    "contacto" TEXT,
    "email" TEXT,
    "telefono" TEXT,
    "canal" TEXT NOT NULL DEFAULT 'CORREO',
    "aceptaCartaCredito" BOOLEAN,
    "notas" TEXT,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ProveedorFamilia" (
    "proveedorId" TEXT NOT NULL,
    "familiaId" TEXT NOT NULL,

    PRIMARY KEY ("proveedorId", "familiaId"),
    CONSTRAINT "ProveedorFamilia_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "Proveedor" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProveedorFamilia_familiaId_fkey" FOREIGN KEY ("familiaId") REFERENCES "Familia" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Certificado" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "proveedorId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "vigenteHasta" DATETIME,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Certificado_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "Proveedor" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Compra" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numero" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "incoterm" TEXT NOT NULL DEFAULT 'FOB',
    "lugar" TEXT,
    "destino" TEXT,
    "plazoRespuesta" DATETIME,
    "etapa" TEXT NOT NULL DEFAULT 'NECESIDAD',
    "nota" TEXT,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CompraLinea" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "compraId" TEXT NOT NULL,
    "productoId" TEXT,
    "descripcion" TEXT NOT NULL,
    "especificacion" TEXT,
    "cantidad" REAL NOT NULL,
    "unidad" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "CompraLinea_compraId_fkey" FOREIGN KEY ("compraId") REFERENCES "Compra" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CompraLinea_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Invitacion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "compraId" TEXT NOT NULL,
    "proveedorId" TEXT NOT NULL,
    "enviadaEl" DATETIME,
    "declino" BOOLEAN NOT NULL DEFAULT false,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Invitacion_compraId_fkey" FOREIGN KEY ("compraId") REFERENCES "Compra" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Invitacion_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "Proveedor" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Cotizacion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invitacionId" TEXT NOT NULL,
    "recibidaEl" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "referencia" TEXT,
    "moneda" TEXT NOT NULL DEFAULT 'USD',
    "incoterm" TEXT NOT NULL,
    "lugar" TEXT,
    "leadTimeDias" INTEGER,
    "validezDias" INTEGER,
    "moq" TEXT,
    "aceptaCartaCredito" BOOLEAN,
    "notas" TEXT,
    CONSTRAINT "Cotizacion_invitacionId_fkey" FOREIGN KEY ("invitacionId") REFERENCES "Invitacion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CotizacionLinea" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cotizacionId" TEXT NOT NULL,
    "compraLineaId" TEXT NOT NULL,
    "precioUnitario" REAL,
    CONSTRAINT "CotizacionLinea_cotizacionId_fkey" FOREIGN KEY ("cotizacionId") REFERENCES "Cotizacion" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CotizacionLinea_compraLineaId_fkey" FOREIGN KEY ("compraLineaId") REFERENCES "CompraLinea" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OrdenCompra" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numero" INTEGER NOT NULL,
    "compraId" TEXT NOT NULL,
    "cotizacionId" TEXT NOT NULL,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "moneda" TEXT NOT NULL,
    "incoterm" TEXT NOT NULL,
    "lugar" TEXT,
    "destino" TEXT,
    "consignatario" TEXT,
    "etd" DATETIME,
    "formaPago" TEXT NOT NULL,
    "anticipoPct" REAL,
    "descuentoPct" REAL,
    "garantiaMeses" INTEGER,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OrdenCompra_compraId_fkey" FOREIGN KEY ("compraId") REFERENCES "Compra" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OrdenCompra_cotizacionId_fkey" FOREIGN KEY ("cotizacionId") REFERENCES "Cotizacion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OrdenLinea" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ordenId" TEXT NOT NULL,
    "compraLineaId" TEXT,
    "codigo" TEXT,
    "descripcion" TEXT NOT NULL,
    "especificacion" TEXT,
    "cantidad" REAL NOT NULL,
    "unidad" TEXT NOT NULL,
    "precioUnitario" REAL NOT NULL,
    "posicion" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "OrdenLinea_ordenId_fkey" FOREIGN KEY ("ordenId") REFERENCES "OrdenCompra" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Pago" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ordenId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "monto" REAL,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nota" TEXT,
    CONSTRAINT "Pago_ordenId_fkey" FOREIGN KEY ("ordenId") REFERENCES "OrdenCompra" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Correlativo" (
    "tipo" TEXT NOT NULL PRIMARY KEY,
    "ultimo" INTEGER NOT NULL DEFAULT 0
);

-- CreateIndex
CREATE UNIQUE INDEX "Familia_nombre_key" ON "Familia"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Proveedor_nombre_key" ON "Proveedor"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Compra_numero_key" ON "Compra"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "Invitacion_compraId_proveedorId_key" ON "Invitacion"("compraId", "proveedorId");

-- CreateIndex
CREATE UNIQUE INDEX "Cotizacion_invitacionId_key" ON "Cotizacion"("invitacionId");

-- CreateIndex
CREATE UNIQUE INDEX "CotizacionLinea_cotizacionId_compraLineaId_key" ON "CotizacionLinea"("cotizacionId", "compraLineaId");

-- CreateIndex
CREATE UNIQUE INDEX "OrdenCompra_numero_key" ON "OrdenCompra"("numero");
