import path from 'node:path'

/**
 * Resuelve la ruta de la base de datos a una ruta absoluta.
 *
 * Hace falta porque el CLI de Prisma resuelve las rutas relativas desde la
 * carpeta `prisma/`, mientras que el adaptador las resuelve desde donde se
 * ejecuta el proceso. Con `file:./dev.db` cada uno abría un archivo distinto
 * y la app veía una base vacía. Con ruta absoluta, ambos apuntan al mismo.
 */
export function resolverUrlDb(): string {
  const crudo = process.env.DATABASE_URL ?? 'file:./prisma/dev.db'

  // Postgres, MySQL y demás ya vienen con host: no hay nada que resolver.
  if (!crudo.startsWith('file:')) return crudo

  const relativa = crudo.slice('file:'.length)
  if (path.isAbsolute(relativa)) return `file:${relativa}`

  return `file:${path.resolve(process.cwd(), relativa)}`
}
