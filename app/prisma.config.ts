import path from 'node:path'
import { defineConfig } from 'prisma/config'

import { resolverUrlDb } from './src/lib/db-url'

// Prisma 7 lee la conexión desde aquí, no desde schema.prisma.
// Para migrar a Postgres más adelante se cambia el `provider` del schema
// y la variable DATABASE_URL: este archivo no necesita tocarse.
export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  migrations: {
    path: path.join('prisma', 'migrations')
  },
  datasource: {
    url: resolverUrlDb()
  }
})
