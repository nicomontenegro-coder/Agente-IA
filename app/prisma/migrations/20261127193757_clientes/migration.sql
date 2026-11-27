-- CreateTable
CREATE TABLE "Cliente" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "rut" TEXT,
    "tipo" TEXT,
    "ciudad" TEXT,
    "direccion" TEXT,
    "contacto" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "notas" TEXT,
    "etapa" TEXT NOT NULL DEFAULT 'IDENTIFICADO',
    "notaEtapa" TEXT,
    "proximaAccion" TEXT,
    "proximaFecha" DATETIME,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_nombre_key" ON "Cliente"("nombre");
