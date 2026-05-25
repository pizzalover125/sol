import type { Metadata } from 'next'
import { NavBar } from '@/components/layout/NavBar'
import './globals.css'

export const metadata: Metadata = {
  title: 'Sol',
  description: 'Open source event management',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-[#0a0a0a] text-white min-h-screen antialiased">
        <NavBar />
        {children}
      </body>
    </html>
  )
}
