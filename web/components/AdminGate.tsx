'use client'

import { useEffect, useState } from 'react'

// Admin auth is checked against NEXT_PUBLIC_ADMIN_PASSWORD (env var, never in the repo).
// Session is stored in sessionStorage so the user doesn't re-enter on tab switches.
// The real security layer is Firestore security rules — this gate is a UX convenience.

const SESSION_KEY = 'wt_admin_v1'

export default function AdminGate({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed]   = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError]     = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const stored = sessionStorage.getItem(SESSION_KEY)
      if (stored && stored === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
        setAuthed(true)
      }
    } catch {
      // sessionStorage blocked (e.g. private mode in some browsers) — ignore
    }
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      try { sessionStorage.setItem(SESSION_KEY, password) } catch { /* ignored */ }
      setAuthed(true)
      setError(false)
    } else {
      setError(true)
      setPassword('')
    }
  }

  // Avoid hydration mismatch — don't render the gate at all on the server
  if (!mounted) return null

  if (authed) return <>{children}</>

  return (
    <main className="min-h-screen flex items-center justify-center px-6 pt-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-xs tracking-widest text-muted uppercase mb-4">WorkTeen</p>
          <h1 className="font-display text-3xl text-ink">Admin</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="input-field w-full text-center tracking-widest"
            placeholder="Password"
            autoFocus
            autoComplete="current-password"
          />

          {error && (
            <p className="font-body text-coral text-sm text-center">
              Incorrect password.
            </p>
          )}

          <button type="submit" className="btn-primary w-full py-3">
            Enter →
          </button>
        </form>
      </div>
    </main>
  )
}
