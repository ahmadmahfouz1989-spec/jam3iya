import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST() {
  await prisma.draw.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.cycle.deleteMany()
  await prisma.round.deleteMany()
  await prisma.member.deleteMany()
  return NextResponse.json({ ok: true })
}
