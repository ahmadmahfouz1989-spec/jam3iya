import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const activeRound = await prisma.round.findFirst({
    where: { status: "ACTIVE" },
    include: {
      cycles: {
        orderBy: { cycleNumber: "asc" },
        include: {
          payments: { include: { member: true } },
          draw: { include: { winner: true } },
        },
      },
    },
  })

  if (!activeRound) return NextResponse.json(null)

  const members = await prisma.member.findMany({ where: { isActive: true } })

  // Always keep the next undone cycle open so draws can happen at any time
  const hasOpen = activeRound.cycles.some(c => c.status === "OPEN")
  if (!hasOpen) {
    const next = activeRound.cycles.find(c => c.status === "UPCOMING")
    if (next) {
      await prisma.cycle.update({ where: { id: next.id }, data: { status: "OPEN" } })
      next.status = "OPEN"
    }
  }

  return NextResponse.json({ round: activeRound, members })
}
