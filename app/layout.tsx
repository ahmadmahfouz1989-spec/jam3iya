import type { Metadata } from "next"
import { Nunito } from "next/font/google"
import { SessionProvider } from "next-auth/react"
import "./globals.css"
import Nav from "@/components/Nav"

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  weight: ["400", "500", "600", "700", "800", "900"],
})

export const metadata: Metadata = {
  title: "jam3iya",
  description: "Rotating savings group manager",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={nunito.variable}>
      <body
        className="min-h-screen text-gray-900"
        style={{
          fontFamily: "var(--font-nunito), sans-serif",
          background: "linear-gradient(135deg, #fdf2f8 0%, #fce7f3 30%, #f3e8ff 70%, #ede9fe 100%)",
          backgroundAttachment: "fixed",
        }}
      >
        <SessionProvider>
          <Nav />
          <main className="max-w-3xl mx-auto px-4 pt-6 pb-28 md:py-8">{children}</main>
        </SessionProvider>
      </body>
    </html>
  )
}
