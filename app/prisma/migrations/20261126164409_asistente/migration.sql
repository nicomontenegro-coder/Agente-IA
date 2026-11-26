-- AlterTable
ALTER TABLE "ListaPreciosItem" ADD COLUMN "pn" TEXT;

-- CreateTable
CREATE TABLE "ChatMensaje" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contexto" TEXT NOT NULL,
    "rol" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Propuesta" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contexto" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "cambios" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resueltaEn" DATETIME
);

-- CreateIndex
CREATE INDEX "ChatMensaje_contexto_creadoEn_idx" ON "ChatMensaje"("contexto", "creadoEn");
