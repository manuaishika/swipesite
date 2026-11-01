import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// PRISMA_LOG=1 prints every query (to find pages that make too many round trips).
export const prisma = globalForPrisma.prisma ?? new PrismaClient(process.env.PRISMA_LOG ? { log: ['query'] } : undefined)

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
