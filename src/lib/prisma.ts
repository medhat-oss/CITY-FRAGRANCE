import { PrismaClient } from '@prisma/client/edge'
import { PrismaNeonHttp } from '@prisma/adapter-neon'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    const connectionString = (process.env.DATABASE_URL ?? '').replace('postgres://', 'postgresql://')
    const adapter = new PrismaNeonHttp(connectionString, {})
    globalForPrisma.prisma = new PrismaClient({ adapter })
  }
  return globalForPrisma.prisma
}

const prisma = new Proxy({} as PrismaClient, {
  get(_, prop) {
    return getPrisma()[prop as keyof PrismaClient]
  },
})

export default prisma
