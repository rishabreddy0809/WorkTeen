import type { Metadata } from 'next'
import { Playfair_Display, Inter } from 'next/font/google'
import './globals.css'
import Nav from '@/components/Nav'

// Display face — used only for headlines, with restraint
const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

// Body face — everything else
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'WorkTeen: Real Gigs for Teens',
  description:
    'Post local gigs and connect with verified teen workers. Built by Rishab, a teen who got tired of being ghosted.',
  openGraph: {
    title: 'WorkTeen: Real Gigs for Teens',
    description: 'Real gigs. Real teens. Actually hired.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body className="font-body">
        <Nav />
        {children}
      </body>
    </html>
  )
}
