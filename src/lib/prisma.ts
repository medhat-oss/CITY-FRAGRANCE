import { PrismaClient } from '@prisma/client/edge'
import { PrismaNeonHttp } from '@prisma/adapter-neon'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

function createRealPrisma(): PrismaClient {
  const connectionString = (process.env.DATABASE_URL ?? '').replace('postgres://', 'postgresql://')
  const adapter = new PrismaNeonHttp(connectionString, {})
  return new PrismaClient({ adapter })
}

function createBuildMock(): PrismaClient {
  const handler: ProxyHandler<any> = {
    get(_target, prop) {
      if (prop === 'then' || prop === 'catch') return undefined
      const fn = (..._args: any[]) => Promise.resolve([])
      return new Proxy(fn, handler)
    },
    apply(_target, _thisArg, _args) {
      return Promise.resolve([])
    },
  }
  return new Proxy(function () {} as any, handler) as PrismaClient
}

function getPrisma(): PrismaClient {
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return createBuildMock()
  }
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createRealPrisma()
  }
  return globalForPrisma.prisma
}

const prisma = new Proxy({} as PrismaClient, {
  get(_, prop) {
    return getPrisma()[prop as keyof PrismaClient]
  },
})

export default prisma
