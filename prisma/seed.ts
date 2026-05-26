import { PrismaLibSql } from "@prisma/adapter-libsql"
import { PrismaClient } from "../app/generated/prisma/client"
import { generateCycleDates } from "../lib/schedule"
import path from "path"

const dbPath = path.resolve(process.cwd(), "dev.db")
const adapter = new PrismaLibSql({ url: `file:${dbPath}` })
const prisma = new PrismaClient({ adapter })

async function main() {
  const existing = await prisma.round.findFirst({ where: { status: "ACTIVE" } })
  if (existing) {
    console.log("Seed already applied — active round exists.")
    return
  }

  const startDate = new Date("2026-06-03T00:00:00.000Z")
  const contributionAmount = 100

  console.log("Database is clean and ready. Set up your round from the Settings page.")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
