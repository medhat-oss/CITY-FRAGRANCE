import { PrismaClient } from '@prisma/client'
import { PrismaNeonHttp } from '@prisma/adapter-neon'

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof prismaSingleton> | undefined
}

function prismaSingleton() {
  const adapter = new PrismaNeonHttp(process.env.DATABASE_URL!, {})
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? prismaSingleton()

globalForPrisma.prisma = prisma

export default prisma
