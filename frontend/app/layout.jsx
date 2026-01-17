import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { Web3Provider } from "../context/Web3Context"
import "./globals.css"

export const metadata = {
  title: "HealthShare - Secure Healthcare Data Exchange",
  description:
    "Secure healthcare data exchange system maintaining patient privacy while enabling necessary information sharing between providers.",
  generator: "v0.app",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <Web3Provider>
          <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
        </Web3Provider>
        <Analytics />
      </body>
    </html>
  )
}
