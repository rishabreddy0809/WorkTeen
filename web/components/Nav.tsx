'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Nav() {
  const pathname = usePathname()
  const isAdminArea = pathname?.startsWith('/admin') || pathname?.startsWith('/leads')

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-edge/40 bg-void/85 backdrop-blur-md">
      <div className="w-full px-8 h-16 flex items-center justify-between">
        {/* Wordmark */}
        <Link href="/" className="flex items-center gap-2 group">
          <span className="font-display text-xl font-bold text-ink group-hover:text-gold transition-colors duration-200">
            WorkTeen
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-gold flex-shrink-0" aria-hidden />
        </Link>

        {/* Public nav */}
        {!isAdminArea && (
          <div className="flex items-center gap-4">
            <Link
              href="/list-a-job"
              className="font-body text-sm text-muted hover:text-ink transition-colors duration-200 hidden sm:block"
            >
              For Employers
            </Link>
            <Link href="/post-job" className="btn-primary py-2 px-4 text-sm">
              Post a Gig
            </Link>
          </div>
        )}

        {/* Admin nav */}
        {isAdminArea && (
          <div className="flex items-center gap-1">
            <Link
              href="/admin"
              className={`px-4 py-2 rounded-lg text-sm transition-colors duration-150 ${
                pathname === '/admin'
                  ? 'text-gold bg-gold/8'
                  : 'text-muted hover:text-ink'
              }`}
            >
              Gigs
            </Link>
            <Link
              href="/leads"
              className={`px-4 py-2 rounded-lg text-sm transition-colors duration-150 ${
                pathname === '/leads'
                  ? 'text-gold bg-gold/8'
                  : 'text-muted hover:text-ink'
              }`}
            >
              Leads
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}
