import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

import { resolverUrlDb } from './db-url'

// En desarrollo Next.js recarga los módulos en cada cambio. Sin este
// singleton se abriría una conexión nueva cada vez hasta agotarlas.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

function crear() {
  const adapter = new PrismaBetterSqlite3({ url: resolverUrlDb() })
  return new PrismaClient({ adapter })
}

export const db = globalForPrisma.prisma ?? crear()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
