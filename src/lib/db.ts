import { PrismaClient } from '@prisma/client'

// Fall back to the repository's SQLite database if DATABASE_URL is not set in the environment
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "file:../db/custom.db";
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error', 'warn'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db