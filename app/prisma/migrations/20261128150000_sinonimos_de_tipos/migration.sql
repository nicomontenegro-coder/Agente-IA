
-- CreateTable
CREATE TABLE "ClaseSinonimo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "claseId" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "patron" TEXT NOT NULL,
    "prioridad" INTEGER NOT NULL,
    CONSTRAINT "ClaseSinonimo_claseId_fkey" FOREIGN KEY ("claseId") REFERENCES "Clase" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);


-- Tipos de fitting y sus sinónimos (semilla: SINONIMOS_BASE en src/lib/clases.ts).
UPDATE "ClaseAtributo" SET "opciones" = 'tee con soporte,codo con soporte,cruz,tee,codo largo,curva S,puente,codo 45°,codo 90°,reducción,unión americana,copla,terminal,tapa,tapón' WHERE "id" = 'at-fit-tipo';
UPDATE "ClaseAtributo" SET "soloSi" = 'tipo=reducción,tee,codo 90°' WHERE "id" = 'at-fit-dn2';
-- Rosca e inserto valen para cualquier fitting: un codo o una tee también pueden traer rosca con inserto metálico.
UPDATE "ClaseAtributo" SET "soloSi" = NULL WHERE "id" IN ('at-fit-rosca', 'at-fit-inserto');
UPDATE "ClaseAtributo" SET "opciones" = 'bronce,acero inoxidable' WHERE "id" = 'at-fit-inserto';
INSERT INTO "ClaseSinonimo" ("id", "claseId", "valor", "patron", "prioridad") VALUES
  ('sin-fit-0', 'clase-fitting', '', 'v[aá]lvula|valve|llave|\bcock\b|abrazadera|clamp|termofusora|fusion machine|tijera|scissors|colector|manifold|filtro|filter|pe-?rt', 0),
  ('sin-fit-1', 'clase-fitting', 'tee con soporte', 'tee.*soporte|joint female tee', 10),
  ('sin-fit-2', 'clase-fitting', 'codo con soporte', 'codo.*soporte|joint female elbow', 11),
  ('sin-fit-3', 'clase-fitting', 'cruz', '\bcruz\b|\bcross\b', 20),
  ('sin-fit-4', 'clase-fitting', 'tee', '\btee\b', 21),
  ('sin-fit-5', 'clase-fitting', 'codo largo', 'codo largo|long elbow', 30),
  ('sin-fit-6', 'clase-fitting', 'curva S', 'curva s\b|s bend', 31),
  ('sin-fit-7', 'clase-fitting', 'puente', 'puente|bridge', 32),
  ('sin-fit-8', 'clase-fitting', 'codo 45°', 'codo 45|45 ?° ?elbow', 33),
  ('sin-fit-9', 'clase-fitting', 'codo 90°', 'codo 90|90 ?° ?elbow|codo reductor|elbow reducer|codo (hembra|macho)|elbow (female|male)', 34),
  ('sin-fit-10', 'clase-fitting', 'reducción', 'copla reductora|coupling reducer|reducci[oó]n|reducer', 40),
  ('sin-fit-11', 'clase-fitting', 'unión americana', 'uni[oó]n americana|\bunion\b', 41),
  ('sin-fit-12', 'clase-fitting', 'copla', 'uni[oó]n recta|straight connector|copla|coupling|socket', 42),
  ('sin-fit-13', 'clase-fitting', 'terminal', 'adaptador|adaptor|adapter|terminal', 50),
  ('sin-fit-14', 'clase-fitting', 'tapa', '\btapa\b|\bcap\b', 60),
  ('sin-fit-15', 'clase-fitting', 'tapón', 'tap[oó]n|\bplug\b', 61);
