import prisma from '../lib/prisma'

async function main() {
  console.log('Testing database connection...')
  try {
    await prisma.$connect()
    console.log('✅ Successfully connected to the database')
  } catch (e) {
    console.error('❌ Error connecting to database:', e)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
