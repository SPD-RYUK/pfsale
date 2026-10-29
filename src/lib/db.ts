import { PrismaClient } from '@prisma/client'

if (typeof window === 'undefined') {
  if (!process.env.DATABASE_URL) {
    try {
      const path = require('path')
      const fs = require('fs')
      const bundledDbPath = path.resolve(process.cwd(), 'db/custom.db')

      if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
        const tmpDbPath = '/tmp/custom.db'
        try {
          if (fs.existsSync(bundledDbPath) && !fs.existsSync(tmpDbPath)) {
            fs.copyFileSync(bundledDbPath, tmpDbPath)
          }
        } catch (e) {
          console.warn('Failed to copy db to /tmp, falling back to bundled path', e)
        }
        if (fs.existsSync(tmpDbPath)) {
          process.env.DATABASE_URL = `file:${tmpDbPath}`
        }
      }

      if (!process.env.DATABASE_URL) {
        process.env.DATABASE_URL = `file:${bundledDbPath}`
      }
    } catch {
      // Ignore if running in non-node environment
    }
  }
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