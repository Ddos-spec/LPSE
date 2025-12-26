import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => new PrismaClient()

const hasDatabaseUrl = Boolean(process.env.DATABASE_URL)

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = hasDatabaseUrl
  ? globalThis.prismaGlobal ?? prismaClientSingleton()
  : (new Proxy(
      {},
      {
        get() {
          throw new Error('Prisma Client is unavailable because DATABASE_URL is not set.')
        },
      }
    ) as ReturnType<typeof prismaClientSingleton>)

export default prisma

if (hasDatabaseUrl && process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma
}
