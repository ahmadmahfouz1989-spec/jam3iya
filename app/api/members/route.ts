import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const members = await prisma.member.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      draws: true,
      payments: true,
    },
  })
  return NextResponse.json(members)
}

export async function POST(req: Request) {
  const { name, phone } = await req.json()
  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 })
  }
  const member = await prisma.member.create({
    data: { name: name.trim(), phone: phone?.trim() || null },
  })

  // If a round is active, append a new cycle for this member
  const activeRound = await prisma.round.findFirst({
    where: { status: "ACTIVE" },
    include: { cycles: { orderBy: { cycleNumber: "desc" }, take: 1 } },
  })
  if (activeRound && activeRound.cycles.length > 0) {
    const lastCycle = activeRound.cycles[0]
    const nextDate = new Date(lastCycle.date)
    nextDate.setDate(nextDate.getDate() + 14)
    await prisma.cycle.create({
      data: {
        roundId: activeRound.id,
        cycleNumber: lastCycle.cycleNumber + 1,
        date: nextDate,
        status: "UPCOMING",
      },
    })
  }

  return NextResponse.json(member, { status: 201 })
}
