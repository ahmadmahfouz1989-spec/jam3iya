import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isCycleOpen } from "@/lib/schedule"

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

  // Auto-open cycles whose date has arrived
  for (const cycle of activeRound.cycles) {
    if (cycle.status === "UPCOMING" && isCycleOpen(cycle.date)) {
      await prisma.cycle.update({ where: { id: cycle.id }, data: { status: "OPEN" } })
      cycle.status = "OPEN"
    }
  }

  return NextResponse.json({ round: activeRound, members })
}
