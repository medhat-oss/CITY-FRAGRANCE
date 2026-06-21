import * as prismaClientModule from '@prisma/client'
import * as neonAdapterModule from '@prisma/adapter-neon'
import * as neonHttpModule from '@neondatabase/serverless'

type PrismaClientCtor = new (args?: { adapter?: unknown }) => import('@prisma/client').PrismaClient
type PrismaNeonHttpCtor = new (url: string, options?: Record<string, unknown>) => unknown

function resolveCtor<T>(mod: Record<string, unknown>, name: string): T {
  return (mod[name] ?? (mod as any).default?.[name] ?? (mod as any).default) as T
}

const PrismaClient = resolveCtor<PrismaClientCtor>(prismaClientModule as any, 'PrismaClient')
const PrismaNeonHttp = resolveCtor<PrismaNeonHttpCtor>(neonAdapterModule as any, 'PrismaNeonHttp')
const _neon = resolveCtor<(...args: unknown[]) => unknown>(neonHttpModule as any, 'neon')

const globalForPrisma = globalThis as unknown as {
  prisma: InstanceType<PrismaClientCtor> | undefined
}

function prismaSingleton() {
  try {
    const url = process.env.DATABASE_URL
    if (!url) {
      console.error('❌ [Prisma Init Error] DATABASE_URL is missing')
      throw new Error('DATABASE_URL is missing from environment bindings')
    }
    if (!PrismaClient) throw new Error('PrismaClient could not be resolved from @prisma/client')
    if (!PrismaNeonHttp) throw new Error('PrismaNeonHttp could not be resolved from @prisma/adapter-neon')
    const adapter = new PrismaNeonHttp(url, {})
    return new PrismaClient({ adapter })
  } catch (e) {
    console.error('❌ [Prisma Init Error]', e)
    throw e
  }
}

export const prisma = globalForPrisma.prisma ?? prismaSingleton()

globalForPrisma.prisma = prisma

export default prisma
