-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_LecturaPendiente" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "compraId" TEXT,
    "invitacionId" TEXT,
    "archivo" TEXT NOT NULL,
    "archivoNombre" TEXT NOT NULL,
    "lectura" TEXT,
    "error" TEXT,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_LecturaPendiente" ("archivo", "archivoNombre", "creadoEn", "error", "id", "invitacionId", "lectura") SELECT "archivo", "archivoNombre", "creadoEn", "error", "id", "invitacionId", "lectura" FROM "LecturaPendiente";
DROP TABLE "LecturaPendiente";
ALTER TABLE "new_LecturaPendiente" RENAME TO "LecturaPendiente";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
