import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: cycleId } = await params

  const cycle = await prisma.cycle.findUnique({
    where: { id: cycleId },
    include: { draw: true },
  })
  if (!cycle) return NextResponse.json({ error: "Cycle not found" }, { status: 404 })
  if (cycle.draw) return NextResponse.json({ error: "Draw already done for this cycle" }, { status: 400 })

  // Find members who have NOT won in this round
  const winnersThisRound = await prisma.draw.findMany({
    where: { cycle: { roundId: cycle.roundId } },
    select: { winnerId: true },
  })
  const wonIds = new Set(winnersThisRound.map((d) => d.winnerId))

  const activeMembers = await prisma.member.findMany({ where: { isActive: true } })
  const payments = await prisma.payment.findMany({ where: { cycleId } })
  const paidIds = new Set(payments.map((p) => p.memberId))

  // Only members who existed when this cycle was created are expected to pay
  const expectedPayers = activeMembers.filter(
    (m) => new Date(m.createdAt) <= new Date(cycle.createdAt)
  )
  const unpaid = expectedPayers.filter((m) => !paidIds.has(m.id))
  if (unpaid.length > 0) {
    const names = unpaid.map((m) => m.name).join(", ")
    return NextResponse.json(
      { error: `Can't draw yet — still waiting on: ${names}` },
      { status: 400 }
    )
  }

  const eligible = activeMembers.filter((m) => !wonIds.has(m.id))
  if (eligible.length === 0) {
    return NextResponse.json({ error: "No eligible members for draw" }, { status: 400 })
  }

  const winner = eligible[Math.floor(Math.random() * eligible.length)]

  const round = await prisma.round.findUnique({ where: { id: cycle.roundId } })
  const totalPot = (round?.contributionAmount ?? 0) * expectedPayers.length

  const draw = await prisma.draw.create({
    data: { cycleId, winnerId: winner.id, totalPot },
    include: { winner: true },
  })

  await prisma.cycle.update({ where: { id: cycleId }, data: { status: "COMPLETED" } })

  // If all members have won, auto-start next round
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
