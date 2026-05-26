import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generateCycleDates } from "@/lib/schedule"

export async function GET() {
  const rounds = await prisma.round.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      cycles: {
        include: { draw: { include: { winner: true } } },
        orderBy: { cycleNumber: "asc" },
      },
    },
  })
  return NextResponse.json(rounds)
}

export async function POST(req: Request) {
  const { contributionAmount, startDate, memberCount } = await req.json()
  if (!contributionAmount || !startDate || !memberCount) {
    return NextResponse.json({ error: "contributionAmount, startDate, and memberCount are required" }, { status: 400 })
  }

  await prisma.round.updateMany({ where: { status: "ACTIVE" }, data: { status: "COMPLETED" } })

  const start = new Date(startDate + "T12:00:00.000Z")

  const round = await prisma.round.create({
    data: {
      contributionAmount: Number(contributionAmount),
      startDate: start,
      status: "ACTIVE",
    },
  })

  const cycleDates = generateCycleDates(start, Number(memberCount))
  for (let i = 0; i < cycleDates.length; i++) {
    await prisma.cycle.create({
      data: {
        roundId: round.id,
        cycleNumber: i + 1,
        date: cycleDates[i],
        status: "UPCOMING",
      },
    })
  }

  return NextResponse.json(round, { status: 201 })
}
