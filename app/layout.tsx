import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ScamCheck LT — Patikrinkite įtartiną žinutę',
  description:
    'Lietuviškas AI sukčiavimo rizikos vertinimo įrankis. Patikrinkite Vinted, SMS, el. laiškus ir kitas žinutes prieš darydami ką nors.',
  keywords: 'scam checker, sukčiavimas lietuva, vinted sukčiavimas, sms sukčiavimas, scamcheck',
  robots: 'noindex, nofollow', // prototype — not for public indexing yet
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="lt">
      <body>{children}</body>
    </html>
  )
}
