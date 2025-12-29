import { Router } from 'express'
import { prisma } from '../lib/prisma.js'

export const lpseRouter = Router()

lpseRouter.get('/', async (req, res) => {
  const startTime = Date.now()

  try {
    const lpseList = await prisma.lpse.findMany({
      orderBy: { nama_lpse: 'asc' }
    })

    const duration = Date.now() - startTime
    console.log(`GET /api/lpse - ${duration}ms`)

    res.json({
      success: true,
      data: lpseList
    })
  } catch (error) {
    console.error('Error fetching LPSE list:', error)
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      details: process.env.NODE_ENV !== 'production'
        ? (error instanceof Error ? error.message : String(error))
        : undefined
    })
  }
})
