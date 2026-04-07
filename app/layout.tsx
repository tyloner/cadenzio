import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/layout/providers"
import { GdprBanner } from "@/components/layout/gdpr-banner"
import { SwRegister } from "@/components/layout/sw-register"

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })

export const metadata: Metadata = {
  title: { default: "Cadenzio", template: "%s · Cadenzio" },
  description: "Your walk, your music. Compose music while you move.",
  manifest: "/manifest.json",
  icons: {
    icon: "/assets/favicon.svg",
    apple: "/api/icon/180",
  },
  openGraph: {
    siteName: "Cadenzio",
    title: "Cadenzio — Your walk, your music",
    description: "Compose music while you move. Every walk becomes a composition.",
    type: "website",
  },
}

export const viewport: Viewport = {
  themeColor: "#14B8A6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          {children}
          <GdprBanner />
          <SwRegister />
        </Providers>
      </body>
    </html>
  )
}
