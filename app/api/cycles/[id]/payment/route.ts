import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: cycleId } = await params
  const { memberId } = await req.json()

  const cycle = await prisma.cycle.findUnique({ where: { id: cycleId } })
  if (!cycle) return NextResponse.json({ error: "Cycle not found" }, { status: 404 })

  const member = await prisma.member.findUnique({ where: { id: memberId } })
  if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 })

  const payment = await prisma.payment.upsert({
    where: { memberId_cycleId: { memberId, cycleId } },
    update: { paidAt: new Date(), amount: cycle.id ? 0 : 0 },
    create: { memberId, cycleId, amount: 0 },
  })

  // We'll compute amount from the round's contributionAmount
  const round = await prisma.round.findUnique({ where: { id: cycle.roundId } })
  await prisma.payment.update({
    where: { id: payment.id },
    data: { amount: round?.contributionAmount ?? 0 },
  })

  return NextResponse.json({ ok: true })
}
