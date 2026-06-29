import { PrismaClient } from '@prisma/client/edge'
import { PrismaNeonHttp } from '@prisma/adapter-neon'

const connectionString = (process.env.DATABASE_URL ?? '').replace('postgres://', 'postgresql://')

let client: PrismaClient | null = null

function getClient(): PrismaClient {
  if (!client) {
    const adapter = new PrismaNeonHttp(connectionString, {})
    client = new PrismaClient({ adapter })
  }
  return client
}

function buildMock() {
  const noop = (..._args: any[]) => Promise.resolve([])
  return new Proxy({} as any, {
    get(_t, prop) {
      if (prop === 'then' || prop === 'catch') return undefined
      const fn = noop
      return new Proxy(fn, {
        get() { return fn },
        apply() { return Promise.resolve([]) },
      })
    },
    apply() { return Promise.resolve([]) },
  })
}

function proxyObject(obj: any): any {
  return new Proxy(obj, {
    get(target, prop, receiver) {
      if (prop === 'then' || prop === 'catch') return undefined
      const value = Reflect.get(target, prop, receiver)
      if (typeof value === 'function') return value.bind(target)
      if (value !== null && typeof value === 'object') return proxyObject(value)
      return value
    },
  })
}

function makePrisma() {
  if (process.env.NEXT_PHASE === 'phase-production-build') return buildMock()
  return proxyObject(getClient())
}

const prisma = makePrisma()
export default prisma
