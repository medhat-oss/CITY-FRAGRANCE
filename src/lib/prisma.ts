import { PrismaClient } from '@prisma/client/edge'
import { PrismaNeonHttp } from '@prisma/adapter-neon'

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

let prisma: any

function getPrisma() {
  if (!prisma) {
    const cs = (process.env.DATABASE_URL ?? '').replace('postgres://', 'postgresql://')
    const adapter = new PrismaNeonHttp(cs, {})
    const client = new PrismaClient({ adapter })
    prisma = proxyObject(client)
  }
  return prisma
}

export default new Proxy({} as any, {
  get(_target, prop, _receiver) {
    if (prop === 'then' || prop === 'catch') return undefined
    return Reflect.get(getPrisma(), prop, getPrisma())
  },
})
