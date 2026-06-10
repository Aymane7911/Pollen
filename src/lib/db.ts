import path from 'path'
import dotenv from 'dotenv'
dotenv.config({ path: path.resolve('C:/Users/System Info/Desktop/Pollen-main/.env.local') })

import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

function makePrisma() {
  const connectionString = process.env.PRISMA_DATABASE_URL
  console.log('DB URL at request time:', connectionString?.slice(0, 30))
  return new PrismaClient({
    adapter: new PrismaPg(connectionString!),
  })
}

export const prisma = globalForPrisma.prisma ?? makePrisma()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma