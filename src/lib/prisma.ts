import { PrismaClient } from '@prisma/client'
import { PrismaNeonHttp } from '@prisma/adapter-neon'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function prismaSingleton() {
  try {
    const url = process.env.DATABASE_URL
    if (!url) {
      console.error('❌ [Prisma Init Error] DATABASE_URL is missing')
      throw new Error('DATABASE_URL is missing from environment bindings')
    }
    const adapter = new PrismaNeonHttp(url)
    return new PrismaClient({ adapter })
  } catch (e) {
    console.error('❌ [Prisma Init Error]', e)
    throw e
  }
}

export const prisma = globalForPrisma.prisma ?? prismaSingleton()

globalForPrisma.prisma = prisma

export default prisma
