import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  const { id: cycleId, memberId } = await params
  await prisma.payment.deleteMany({ where: { cycleId, memberId } })
  return NextResponse.json({ ok: true })
}
