import { chromium } from "playwright"

const BASE = "http://localhost:3000"
let passed = 0
let failed = 0

function ok(label: string) { console.log(`  ✅ ${label}`); passed++ }
function fail(label: string, err?: any) { console.log(`  ❌ ${label}${err ? ": " + err : ""}`); failed++ }

async function run() {
  // ── 0. Reset database ─────────────────────────────────────────────────────
  console.log("\n0. Resetting database")
  const resetRes = await fetch(BASE + "/api/dev/reset", { method: "POST" })
  resetRes.ok ? console.log("  ✔ DB reset") : console.log("  ⚠ DB reset returned", resetRes.status)

  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext()
  const page = await ctx.newPage()

  // ── 1. Redirect to login when unauthenticated ──────────────────────────────
  console.log("\n1. Auth redirect")
  await page.goto(BASE + "/")
  await page.waitForURL("**/login", { timeout: 5000 })
  page.url().includes("/login") ? ok("Unauthenticated → /login") : fail("Should redirect to /login")

  // ── 2. Wrong password ─────────────────────────────────────────────────────
  console.log("\n2. Login errors")
  await page.waitForSelector("form[data-ready]", { timeout: 8000 })
  const authResponsePromise = page.waitForResponse(
    r => r.url().includes("/api/auth/callback/credentials"),
    { timeout: 8000 }
  )
  await page.fill("input[type=text]", "admin")
  await page.fill("input[type=password]", "wrongpassword")
  await page.click("button[type=submit]")
  await authResponsePromise
  await page.waitForTimeout(500)
  const errInnerText = await page.locator("body").innerText()
  errInnerText.includes("Wrong") ? ok("Wrong password shows error") : fail("Should show wrong password error")

  // ── 3. Admin login ────────────────────────────────────────────────────────
  console.log("\n3. Admin login")
  await page.goto(BASE + "/login")
  await page.waitForSelector("form[data-ready]", { timeout: 8000 })
  await page.fill("input[type=text]", "admin")
  await page.fill("input[type=password]", "admin123")
  await page.click("button[type=submit]")
  await page.waitForURL("**/", { timeout: 8000 })
  page.url() === BASE + "/" ? ok("Admin login → dashboard") : fail("Admin should land on dashboard")

  // ── 4. Dashboard shows empty state ────────────────────────────────────────
  console.log("\n4. Dashboard empty state")
  await page.waitForTimeout(1000)
  const body = await page.textContent("body")
  body?.includes("No active cycle") ? ok("Shows 'No active cycle' empty state") : fail("Should show empty state")

  // ── 5. Members page ───────────────────────────────────────────────────────
  console.log("\n5. Members page")
  await page.goto(BASE + "/members")
  await page.waitForTimeout(800)
  const membersBody = await page.textContent("body")
  membersBody?.includes("Members") ? ok("Members page loads") : fail("Members page failed to load")

  // ── 6. Add 3 members ─────────────────────────────────────────────────────
  console.log("\n6. Adding members")
  const names = ["Nora", "Sara", "Lina"]
  for (const name of names) {
    await page.fill("input[placeholder='Full name']", name)
    await page.click("button[type=submit]")
    await page.waitForTimeout(600)
  }
  const afterAdd = await page.textContent("body")
  for (const name of names) {
    afterAdd?.includes(name) ? ok(`Member "${name}" added`) : fail(`Member "${name}" not found`)
  }

  // ── 7. Settings: start a cycle ────────────────────────────────────────────
  // Use a start date 28 days ago so all 3 rounds auto-open (isCycleOpen = date <= today)
  console.log("\n7. Settings — start cycle")
  await page.goto(BASE + "/settings")
  await page.waitForTimeout(800)
  await page.fill("input[type=number][placeholder='e.g. 500']", "100")
  const past28 = new Date()
  past28.setDate(past28.getDate() - 28)
  await page.fill("input[type=date]", past28.toISOString().slice(0, 10))
  await page.fill("input[placeholder='e.g. 8']", "3")
  await page.click("button[type=submit]")
  await page.waitForTimeout(1000)
  const settingsBody = await page.textContent("body")
  settingsBody?.includes("Cycle started") || settingsBody?.includes("Active cycle")
    ? ok("Cycle started successfully")
    : fail("Cycle creation may have failed")

  // ── 8. Dashboard shows current round ─────────────────────────────────────
  console.log("\n8. Dashboard with active cycle")
  await page.goto(BASE + "/")
  await page.waitForTimeout(1000)
  const dashBody = await page.textContent("body")
  dashBody?.includes("Round 1") ? ok("Dashboard shows Round 1") : fail("Dashboard should show Round 1")
  dashBody?.includes("$0") || dashBody?.includes("Payments") ? ok("Payments section visible") : fail("Payments section missing")
  dashBody?.includes("Mark paid") ? ok("Mark paid buttons present") : fail("Mark paid buttons missing")

  // ── 9. Mark payments for Round 1 ─────────────────────────────────────────
  console.log("\n9. Mark Round 1 payments")
  const markPaidButtons = await page.$$("button:has-text('Mark paid')")
  if (markPaidButtons.length === 0) {
    fail("No 'Mark paid' buttons found")
  } else {
    for (const btn of markPaidButtons) {
      await btn.click()
      await page.waitForTimeout(500)
    }
    await page.waitForTimeout(500)
    const afterPaid = await page.textContent("body")
    afterPaid?.includes("Paid ✓") ? ok(`Round 1: ${markPaidButtons.length} payments marked`) : fail("Payments not marked")
  }

  // ── 10. Rounds page ───────────────────────────────────────────────────────
  console.log("\n10. Rounds page")
  await page.goto(BASE + "/cycles")
  await page.waitForTimeout(800)
  const cyclesBody = await page.textContent("body")
  cyclesBody?.includes("Round 1") ? ok("Rounds page shows Round 1") : fail("Rounds page missing Round 1")
  cyclesBody?.includes("Open") ? ok("Round 1 marked as Open") : fail("Round 1 should be Open")

  // ── 11. Draw page ─────────────────────────────────────────────────────────
  console.log("\n11. Draw page")
  await page.goto(BASE + "/draw")
  await page.waitForTimeout(800)
  const drawBody = await page.textContent("body")
  drawBody?.includes("Draw") ? ok("Draw page loads") : fail("Draw page failed")
  const drawBtn = page.locator("button:has-text('Draw Winner')")
  const drawBtnCount = await drawBtn.count()
  drawBtnCount > 0 ? ok("Draw Winner button visible (all paid)") : fail("Draw Winner button not shown")

  // ── 12. Run Round 1 draw ─────────────────────────────────────────────────
  console.log("\n12. Round 1 draw")
  const winners: string[] = []
  if (drawBtnCount > 0) {
    const resp1 = page.waitForResponse(
      r => /\/api\/cycles\/[^/]+\/draw/.test(r.url()) && r.request().method() === "POST",
      { timeout: 10000 }
    )
    await drawBtn.click()
    await page.waitForTimeout(4000) // spin animation
    const data1 = await (await resp1).json()
    const winner1 = data1.winner?.name
    winner1 ? (ok(`Round 1 winner: ${winner1}`), winners.push(winner1)) : fail("No winner returned from Round 1 draw")
    const afterDraw1 = await page.textContent("body")
    afterDraw1?.includes("$300") || afterDraw1?.includes("300")
      ? ok("Round 1 pot amount shown") : fail("Round 1 pot amount missing")
  }

  // ── 13. Round 2 — mark payments & draw ───────────────────────────────────
  console.log("\n13. Round 2 draw")
  await page.goto(BASE + "/")
  await page.waitForTimeout(1000)
  const dash2 = await page.textContent("body")
  dash2?.includes("Round 2") ? ok("Dashboard advances to Round 2") : fail("Dashboard should show Round 2 after Round 1 draw")

  const markBtns2 = await page.$$("button:has-text('Mark paid')")
  markBtns2.length > 0 ? ok(`Round 2: found ${markBtns2.length} payment buttons`) : fail("Round 2: no payment buttons")
  for (const btn of markBtns2) {
    await btn.click()
    await page.waitForTimeout(500)
  }

  await page.goto(BASE + "/draw")
  await page.waitForTimeout(800)
  const drawBtn2 = page.locator("button:has-text('Draw Winner')")
  const drawBtn2Count = await drawBtn2.count()
  drawBtn2Count > 0 ? ok("Round 2 draw button visible") : fail("Round 2 draw button not shown")

  if (drawBtn2Count > 0) {
    const resp2 = page.waitForResponse(
      r => /\/api\/cycles\/[^/]+\/draw/.test(r.url()) && r.request().method() === "POST",
      { timeout: 10000 }
    )
    await drawBtn2.click()
    await page.waitForTimeout(4000)
    const data2 = await (await resp2).json()
    const winner2 = data2.winner?.name
    winner2 ? (ok(`Round 2 winner: ${winner2}`), winners.push(winner2)) : fail("No winner returned from Round 2 draw")
    const r1 = winners[0]
    winner2 && r1 && winner2 !== r1
      ? ok("Round 2 winner is different from Round 1 (exclusion works)")
      : fail(`Winner exclusion violated: Round 1=${r1}, Round 2=${winner2}`)
  }

  // ── 14. Round 3 — mark payments & draw ───────────────────────────────────
  console.log("\n14. Round 3 draw")
  await page.goto(BASE + "/")
  await page.waitForTimeout(1000)
  const dash3 = await page.textContent("body")
  dash3?.includes("Round 3") ? ok("Dashboard advances to Round 3") : fail("Dashboard should show Round 3 after Round 2 draw")

  const markBtns3 = await page.$$("button:has-text('Mark paid')")
  markBtns3.length > 0 ? ok(`Round 3: found ${markBtns3.length} payment buttons`) : fail("Round 3: no payment buttons")
  for (const btn of markBtns3) {
    await btn.click()
    await page.waitForTimeout(500)
  }

  await page.goto(BASE + "/draw")
  await page.waitForTimeout(800)
  const drawBtn3 = page.locator("button:has-text('Draw Winner')")
  const drawBtn3Count = await drawBtn3.count()
  drawBtn3Count > 0 ? ok("Round 3 draw button visible") : fail("Round 3 draw button not shown")

  if (drawBtn3Count > 0) {
    const resp3 = page.waitForResponse(
      r => /\/api\/cycles\/[^/]+\/draw/.test(r.url()) && r.request().method() === "POST",
      { timeout: 10000 }
    )
    await drawBtn3.click()
    await page.waitForTimeout(4000)
    const data3 = await (await resp3).json()
    const winner3 = data3.winner?.name
    winner3 ? (ok(`Round 3 winner: ${winner3}`), winners.push(winner3)) : fail("No winner returned from Round 3 draw")
    const r1 = winners[0], r2 = winners[1]
    winner3 && r1 && r2 && winner3 !== r1 && winner3 !== r2
      ? ok("Round 3 winner is different from rounds 1 & 2 (exclusion works)")
      : fail(`Winner exclusion violated: winners=${winners.join(", ")}`)
  }

  // ── 15. Verify all 3 members won exactly once ─────────────────────────────
  console.log("\n15. Cycle completion & winner uniqueness")
  const uniqueWinners = new Set(winners)
  uniqueWinners.size === 3
    ? ok(`All 3 members won exactly once: ${winners.join(", ")}`)
    : fail(`Expected 3 unique winners, got ${uniqueWinners.size}: ${winners.join(", ")}`)
  names.every(n => uniqueWinners.has(n))
    ? ok("Every member (Nora, Sara, Lina) won exactly once")
    : fail(`Missing winners from member list: expected ${names.join(", ")}, got ${winners.join(", ")}`)

  // After all rounds, the cycle should be marked complete → no active round
  await page.goto(BASE + "/draw")
  await page.waitForTimeout(800)
  const finalDrawBody = await page.textContent("body")
  finalDrawBody?.includes("No open round") || finalDrawBody?.includes("No active round")
    ? ok("No open rounds remaining — cycle complete")
    : fail("Expected no open rounds after all draws")

  // ── 16. History page ─────────────────────────────────────────────────────
  console.log("\n16. History page")
  await page.goto(BASE + "/history")
  await page.waitForTimeout(800)
  const histBody = await page.textContent("body")
  histBody?.includes("History") ? ok("History page loads") : fail("History page failed")
  names.every(n => histBody?.includes(n)) ? ok("All 3 winners appear in history") : fail("History missing some winners")

  // ── 17. Create member account ─────────────────────────────────────────────
  console.log("\n17. Member account creation")
  await page.goto(BASE + "/settings")
  await page.waitForTimeout(800)
  await page.fill("input[placeholder='e.g. sarah']", "nora")
  await page.fill("input[placeholder='set a password']", "nora123")
  const memberSelect = page.locator("select")
  await memberSelect.selectOption({ label: "Nora" })
  const createBtn = page.locator("button:has-text('Create account')")
  await createBtn.click()
  await page.waitForTimeout(800)
  const afterUser = await page.textContent("body")
  afterUser?.includes("nora") ? ok("Member account 'nora' created") : fail("Account creation failed")

  // ── 18. Sign out ──────────────────────────────────────────────────────────
  console.log("\n18. Sign out")
  const signOutBtn = page.locator("button:has-text('Sign out')").first()
  await signOutBtn.click()
  await page.waitForURL("**/login", { timeout: 5000 })
  page.url().includes("/login") ? ok("Sign out → /login") : fail("Sign out failed")

  // ── 19. Member login ──────────────────────────────────────────────────────
  console.log("\n19. Member login (read-only)")
  await page.waitForSelector("form[data-ready]", { timeout: 8000 })
  await page.fill("input[type=text]", "nora")
  await page.fill("input[type=password]", "nora123")
  await page.click("button[type=submit]")
  await page.waitForURL("**/", { timeout: 5000 })
  ok("Member login → dashboard")

  await page.waitForTimeout(1000)
  const memberDash = await page.textContent("body")
  memberDash?.includes("Mark paid") ? fail("Member should NOT see Mark paid") : ok("Mark paid hidden for member")
  // Cycle is now complete — member should see empty state (no active cycle)
  memberDash?.includes("No active cycle") || memberDash?.includes("Paid ✓") || memberDash?.includes("Pending")
    ? ok("Member dashboard shows correct read-only state")
    : fail("Member dashboard state unexpected")

  // ── 20. Member can't access other pages ───────────────────────────────────
  console.log("\n20. Member access restriction")
  await page.goto(BASE + "/settings")
  await page.waitForURL("**/", { timeout: 5000 })
  page.url() === BASE + "/" ? ok("Member redirected from /settings → /") : fail("Member should be blocked from /settings")

  await page.goto(BASE + "/members")
  await page.waitForURL("**/", { timeout: 5000 })
  page.url() === BASE + "/" ? ok("Member redirected from /members → /") : fail("Member should be blocked from /members")

  await browser.close()

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log(`\n${"─".repeat(40)}`)
  console.log(`  ${passed} passed  |  ${failed} failed`)
  console.log("─".repeat(40))
  process.exit(failed > 0 ? 1 : 0)
}

run().catch(e => { console.error(e); process.exit(1) })
