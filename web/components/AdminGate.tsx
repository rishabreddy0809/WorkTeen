'use client'

import { useEffect, useState } from 'react'

// Password is verified server-side via /api/admin-auth — never shipped to the browser.
// Session is stored in sessionStorage as a boolean flag (not the password itself),
// so the user doesn't re-enter on tab switches within the same browser session.

const SESSION_KEY = 'wt_admin_v1'

export default function AdminGate({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed]     = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError]       = useState(false)
  const [loading, setLoading]   = useState(false)
  const [mounted, setMounted]   = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      if (sessionStorage.getItem(SESSION_KEY) === '1') {
        setAuthed(true)
      }
    } catch {
      // sessionStorage blocked (e.g. private mode in some browsers) — ignore
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(false)

    try {
      const res = await fetch('/api/admin-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json() as { success: boolean }

      if (data.success) {
        try { sessionStorage.setItem(SESSION_KEY, '1') } catch { /* ignored */ }
        setAuthed(true)
      } else {
        setError(true)
        setPassword('')
      }
    } catch {
      setError(true)
      setPassword('')
    } finally {
      setLoading(false)
    }
  }

  // Avoid hydration mismatch — don't render the gate at all on the server
  if (!mounted) return null

  if (authed) return <>{children}</>

  return (
    <main className="min-h-screen bg-void flex items-center justify-center px-6 pt-16">
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
            disabled={loading}
          />

          {error && (
            <p className="font-body text-coral text-sm text-center">
              Incorrect password.
            </p>
          )}

          <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
            {loading ? 'Checking…' : 'Enter →'}
          </button>
        </form>
      </div>
    </main>
  )
}
