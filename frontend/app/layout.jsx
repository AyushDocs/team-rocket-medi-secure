import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { Toaster } from "react-hot-toast"
import { Web3Provider } from "../context/Web3Context"
import ErrorBoundary from "@/components/ErrorBoundary"
import { PageLoader } from "@/components/Skeleton"
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
        <ErrorBoundary>
          <Web3Provider>
            <Suspense fallback={<PageLoader />}>{children}</Suspense>
          </Web3Provider>
        </ErrorBoundary>
        <Analytics />
        <Toaster position="top-right" />
      </body>
    </html>
  )
}
