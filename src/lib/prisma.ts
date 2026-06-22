import { PrismaClient } from '@prisma/client/edge'
import { PrismaNeonHttp } from '@prisma/adapter-neon'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

const connectionString = (process.env.DATABASE_URL ?? '').replace('postgres://', 'postgresql://')
const adapter = new PrismaNeonHttp(connectionString, {})

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
