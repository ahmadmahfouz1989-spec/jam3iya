import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: cycleId } = await params
  const body = await req.json().catch(() => ({}))
  const { winnerId } = body

  const cycle = await prisma.cycle.findUnique({
    where: { id: cycleId },
    include: { draw: true },
  })
  if (!cycle) return NextResponse.json({ error: "Cycle not found" }, { status: 404 })
  if (cycle.draw) return NextResponse.json({ error: "Draw already done for this cycle" }, { status: 400 })

  const winnersThisRound = await prisma.draw.findMany({
    where: { cycle: { roundId: cycle.roundId } },
    select: { winnerId: true },
  })
  const wonIds = new Set(winnersThisRound.map((d) => d.winnerId))

  const activeMembers = await prisma.member.findMany({ where: { isActive: true } })

  const eligible = activeMembers.filter((m) => !wonIds.has(m.id))
  if (eligible.length === 0) {
    return NextResponse.json({ error: "No eligible members for draw" }, { status: 400 })
  }

  let winner
  if (winnerId) {
    winner = eligible.find((m) => m.id === winnerId)
    if (!winner) {
      return NextResponse.json({ error: "Selected member is not eligible" }, { status: 400 })
    }
  } else {
    winner = eligible[Math.floor(Math.random() * eligible.length)]
  }

  const round = await prisma.round.findUnique({ where: { id: cycle.roundId } })
  const totalPot = (round?.contributionAmount ?? 0) * activeMembers.length

  const draw = await prisma.draw.create({
    data: { cycleId, winnerId: winner.id, totalPot },
    include: { winner: true },
  })

  await prisma.cycle.update({ where: { id: cycleId }, data: { status: "COMPLETED" } })

  const allWinners = await prisma.draw.findMany({
    where: { cycle: { roundId: cycle.roundId } },
    select: { winnerId: true },
  })
  const allWonIds = new Set(allWinners.map((d) => d.winnerId))
  if (activeMembers.every((m) => allWonIds.has(m.id))) {
    await prisma.round.update({ where: { id: cycle.roundId }, data: { status: "COMPLETED" } })
  }

  return NextResponse.json(draw)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: cycleId } = await params

  const cycle = await prisma.cycle.findUnique({ where: { id: cycleId }, include: { draw: true } })
  if (!cycle) return NextResponse.json({ error: "Cycle not found" }, { status: 404 })
  if (!cycle.draw) return NextResponse.json({ error: "No draw to undo" }, { status: 400 })

  await prisma.draw.delete({ where: { cycleId } })
  await prisma.cycle.update({ where: { id: cycleId }, data: { status: "OPEN" } })
  await prisma.round.update({ where: { id: cycle.roundId }, data: { status: "ACTIVE" } })

  return NextResponse.json({ ok: true })
}
