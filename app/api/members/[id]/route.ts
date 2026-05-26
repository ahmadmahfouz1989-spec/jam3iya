import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { name, phone, isActive } = await req.json()
  const member = await prisma.member.update({
    where: { id },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(phone !== undefined && { phone: phone?.trim() || null }),
      ...(isActive !== undefined && { isActive }),
    },
  })
  return NextResponse.json(member)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.payment.deleteMany({ where: { memberId: id } })
  await prisma.draw.deleteMany({ where: { winnerId: id } })
  await prisma.member.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
