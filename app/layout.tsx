import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'KW Arizona Living Realty — Agent Dashboard',
  description: 'Market center resources for KW Arizona Living Realty agents',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
