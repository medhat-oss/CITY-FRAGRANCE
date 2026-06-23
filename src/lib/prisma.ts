let prismaClient: any
let prismaInitPromise: Promise<void> | null = null

async function initPrisma(): Promise<void> {
  const { PrismaClient } = await import('@prisma/client/edge')
  const { PrismaNeonHttp } = await import('@prisma/adapter-neon')
  const connectionString = (process.env.DATABASE_URL ?? '').replace('postgres://', 'postgresql://')
  const adapter = new PrismaNeonHttp(connectionString, {})
  prismaClient = new PrismaClient({ adapter })
}

function createBuildMock(): any {
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
  return new Proxy(function () {} as any, handler)
}

function createPrismaProxy(): any {
  function getTarget(): any {
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      return createBuildMock()
    }
    if (!prismaInitPromise) {
      prismaInitPromise = initPrisma()
    }
    return prismaInitPromise.then(() => prismaClient)
  }

  return new Proxy({} as any, {
    get(_, prop) {
      if (prop === 'then' || prop === 'catch') return undefined
      const lazyFn = async (...args: any[]) => {
        const target = await getTarget()
        const val = target[prop]
        return typeof val === 'function' ? val(...args) : val
      }
      return new Proxy(lazyFn, {
        get(__, method) {
          if (method === 'then' || method === 'catch') return undefined
          return async (...args: any[]) => {
            const target = await getTarget()
            return target[prop][method](...args)
          }
        },
        apply(__, _this, args) {
          return (async () => {
            const target = await getTarget()
            const val = target[prop]
            return typeof val === 'function' ? val(...args) : val
          })()
        },
      })
    },
  })
}

const prisma = createPrismaProxy()
export default prisma
