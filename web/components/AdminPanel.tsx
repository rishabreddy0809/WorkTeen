'use client'

import { useEffect, useState } from 'react'
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
  orderBy,
  Timestamp,
} from 'firebase/firestore'
import { AnimatePresence, motion } from 'framer-motion'
import { db } from '@/lib/firebase'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Gig {
  id: string
  title: string
  description: string
  category: string
  payAmount: number
  payType: string
  posterName: string
  posterPhone: string
  address?: string
  zip: string
  preferredDate?: string | null
  status: string
  datePosted: Timestamp | null
}

interface JobListing {
  id: string
  title: string
  employerName: string
  category: string
  minimumAge: number
  maxHoursSchoolDay: number | null
  latestShiftEndSchoolNight: string | null
  payRate: string
  description: string
  datePosted: Timestamp | null
  status: string
  address?: string
  contactEmail?: string | null
  contactPhone?: string | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(ts: Timestamp | null | undefined): string {
  if (!ts?.toDate) return '—'
  return ts.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ─── Gig card ─────────────────────────────────────────────────────────────────

function GigCard({
  gig,
  onAction,
}: {
  gig: Gig
  onAction: (id: string, status: 'approved' | 'rejected') => void
}) {
  const [acting, setActing] = useState(false)

  async function act(status: 'approved' | 'rejected') {
    setActing(true)
    await onAction(gig.id, status)
    // component unmounts on success via AnimatePresence, no need to reset
  }

  return (
    <motion.div
      layout
      className="card mb-4"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <h3 className="font-body font-semibold text-ink">{gig.title}</h3>
          <p className="font-body text-xs text-muted mt-0.5">
            {gig.category}
            {' · '}
            {gig.payType === 'hourly' ? `$${gig.payAmount}/hr` : `$${gig.payAmount} flat`}
            {' · '}
            {gig.zip}
          </p>
        </div>
        <span className="font-mono text-xs text-muted/50 flex-shrink-0">
          {formatDate(gig.datePosted)}
        </span>
      </div>

      {/* Description */}
      <p className="font-body text-sm text-muted leading-relaxed mb-4 whitespace-pre-wrap">
        {gig.description}
      </p>

      {/* Contact row */}
      <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted mb-4">
        <span>
          <span className="text-ink/80">Contact: </span>
          {gig.posterName}
        </span>
        <span>
          <span className="text-ink/80">Phone: </span>
          <a href={`tel:${gig.posterPhone}`} className="text-gold hover:underline">
            {gig.posterPhone}
          </a>
        </span>
        {gig.address && (
          <span>
            <span className="text-ink/80">Address: </span>
            {gig.address}
          </span>
        )}
        {gig.preferredDate && (
          <span>
            <span className="text-ink/80">Date: </span>
            {gig.preferredDate}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-edge/40">
        <button
          onClick={() => act('approved')}
          disabled={acting}
          className="btn-success disabled:opacity-50"
        >
          Approve
        </button>
        <button
          onClick={() => act('rejected')}
          disabled={acting}
          className="btn-danger disabled:opacity-50"
        >
          Reject
        </button>
      </div>
    </motion.div>
  )
}

// ─── Job listing card ─────────────────────────────────────────────────────────

function JobListingCard({
  listing,
  onMarkFilled,
}: {
  listing: JobListing
  onMarkFilled: (id: string) => void
}) {
  const isActive = listing.status === 'active'

  return (
    <div className="card mb-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-body font-semibold text-ink">{listing.title}</h3>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-mono ${
                isActive ? 'text-sage bg-sage/10' : 'text-muted bg-edge/60'
              }`}
            >
              {listing.status}
            </span>
          </div>
          <p className="font-body text-xs text-muted">
            {listing.employerName} · {listing.category} · {listing.payRate}
          </p>
          <p className="font-body text-xs text-muted/70 mt-0.5">
            Min age {listing.minimumAge} · Max {listing.maxHoursSchoolDay}h/school day · Last shift {listing.latestShiftEndSchoolNight}
          </p>
        </div>
        {isActive && (
          <button
            onClick={() => onMarkFilled(listing.id)}
            className="btn-secondary text-xs py-1.5 px-3 flex-shrink-0"
          >
            Mark Filled
          </button>
        )}
      </div>
      {listing.description && (
        <p className="font-body text-sm text-muted/80 mt-3 leading-relaxed">
          {listing.description}
        </p>
      )}
      <p className="font-body text-xs text-muted/40 mt-3">{formatDate(listing.datePosted)}</p>
    </div>
  )
}

// ─── Pending listing card (submitted via /list-a-job) ────────────────────────

function PendingListingCard({
  listing,
  onAction,
}: {
  listing: JobListing
  onAction: (id: string, status: 'active' | 'rejected') => Promise<void>
}) {
  const [acting, setActing] = useState(false)

  async function act(status: 'active' | 'rejected') {
    setActing(true)
    await onAction(listing.id, status)
  }

  return (
    <motion.div
      layout
      className="card mb-4"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <h3 className="font-body font-semibold text-ink">{listing.title}</h3>
          <p className="font-body text-xs text-muted mt-0.5">
            {listing.employerName}
            {' · '}
            {listing.category}
            {' · '}
            {listing.payRate}
          </p>
        </div>
        <span className="font-mono text-xs text-muted/50 flex-shrink-0">
          {formatDate(listing.datePosted)}
        </span>
      </div>

      {/* Description */}
      <p className="font-body text-sm text-muted leading-relaxed mb-4 whitespace-pre-wrap">
        {listing.description}
      </p>

      {/* Details row */}
      <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted mb-4">
        <span>
          <span className="text-ink/80">Min age: </span>
          {listing.minimumAge}
        </span>
        {listing.maxHoursSchoolDay != null && (
          <span>
            <span className="text-ink/80">School day: </span>
            {listing.maxHoursSchoolDay}h max
          </span>
        )}
        {listing.latestShiftEndSchoolNight && (
          <span>
            <span className="text-ink/80">Last shift: </span>
            {listing.latestShiftEndSchoolNight}
          </span>
        )}
        {listing.address && (
          <span>
            <span className="text-ink/80">Address: </span>
            {listing.address}
          </span>
        )}
      </div>

      {/* Contact row */}
      <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted mb-4">
        {listing.contactEmail && (
          <span>
            <span className="text-ink/80">Email: </span>
            <a href={`mailto:${listing.contactEmail}`} className="text-gold hover:underline">
              {listing.contactEmail}
            </a>
          </span>
        )}
        {listing.contactPhone && (
          <span>
            <span className="text-ink/80">Phone: </span>
            <a href={`tel:${listing.contactPhone}`} className="text-gold hover:underline">
              {listing.contactPhone}
            </a>
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-edge/40">
        <button
          onClick={() => act('active')}
          disabled={acting}
          className="btn-success disabled:opacity-50"
        >
          Approve
        </button>
        <button
          onClick={() => act('rejected')}
          disabled={acting}
          className="btn-danger disabled:opacity-50"
        >
          Reject
        </button>
      </div>
    </motion.div>
  )
}

// ─── New job listing form ─────────────────────────────────────────────────────

const LISTING_CATEGORIES = [
  'Food Service',
  'Retail',
  'Lawn & Garden',
  'Admin / Office',
  'Pet Care',
  'Tutoring',
  'Tech',
  'Moving / Labor',
  'Events',
  'Other',
]

const LISTING_INITIAL = {
  title: '',
  employerName: '',
  category: LISTING_CATEGORIES[0],
  minimumAge: '14',
  maxHoursSchoolDay: '3',
  latestShiftEndSchoolNight: '20:00',
  payRate: '',
  description: '',
}

function AddListingForm() {
  const [form, setForm] = useState(LISTING_INITIAL)
  const [submitting, setSubmitting] = useState(false)
  const [saved, setSaved] = useState(false)

  function set(k: keyof typeof LISTING_INITIAL, v: string) {
    setForm(f => ({ ...f, [k]: v }))
    setSaved(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await addDoc(collection(db, 'jobListings'), {
        title:                   form.title.trim(),
        employerName:            form.employerName.trim(),
        category:                form.category,
        minimumAge:              parseInt(form.minimumAge),
        maxHoursSchoolDay:       parseInt(form.maxHoursSchoolDay),
        latestShiftEndSchoolNight: form.latestShiftEndSchoolNight,
        payRate:                 form.payRate.trim(),
        description:             form.description.trim(),
        status:                  'active',
        datePosted:              serverTimestamp(),
      })
      setForm(LISTING_INITIAL)
      setSaved(true)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card mb-8 space-y-4">
      <h3 className="font-body font-semibold text-ink">Add New Listing</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-muted mb-1">Job Title</label>
          <input className="input-field w-full" value={form.title} onChange={e => set('title', e.target.value)} required placeholder="e.g. Cashier" />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Employer Name</label>
          <input className="input-field w-full" value={form.employerName} onChange={e => set('employerName', e.target.value)} required placeholder="e.g. Joe's Diner" />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Category</label>
          <select className="select-field w-full" value={form.category} onChange={e => set('category', e.target.value)}>
            {LISTING_CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Pay Rate</label>
          <input className="input-field w-full" value={form.payRate} onChange={e => set('payRate', e.target.value)} required placeholder="e.g. $15/hr or $120/day" />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Minimum Age</label>
          <input type="number" className="input-field w-full" value={form.minimumAge} onChange={e => set('minimumAge', e.target.value)} min={14} max={17} required />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Max Hours / School Day</label>
          <input type="number" className="input-field w-full" value={form.maxHoursSchoolDay} onChange={e => set('maxHoursSchoolDay', e.target.value)} min={0} max={8} required />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Latest Shift End (School Night)</label>
          <input type="time" className="input-field w-full" value={form.latestShiftEndSchoolNight} onChange={e => set('latestShiftEndSchoolNight', e.target.value)} required />
        </div>
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">Description</label>
        <textarea
          className="textarea-field w-full"
          rows={3}
          value={form.description}
          onChange={e => set('description', e.target.value)}
          required
          placeholder="Role description, responsibilities, schedule…"
        />
      </div>
      <div className="flex items-center gap-4">
        <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-40">
          {submitting ? 'Saving…' : 'Add Listing'}
        </button>
        {saved && (
          <span className="font-body text-sm text-sage">Listing added.</span>
        )}
      </div>
    </form>
  )
}

// ─── Main panel ───────────────────────────────────────────────────────────────

type Tab = 'gigs' | 'listings'

export default function AdminPanel() {
  const [tab, setTab] = useState<Tab>('gigs')
  const [pendingGigs, setPendingGigs] = useState<Gig[]>([])
  const [jobListings, setJobListings] = useState<JobListing[]>([])
  const [loadingGigs, setLoadingGigs] = useState(true)
  const [loadingListings, setLoadingListings] = useState(true)

  // Real-time subscription to pending gigs
  useEffect(() => {
    const q = query(
      collection(db, 'gigs'),
      where('status', '==', 'pending'),
      orderBy('datePosted', 'desc'),
    )
    return onSnapshot(q, snap => {
      setPendingGigs(snap.docs.map(d => ({ id: d.id, ...d.data() } as Gig)))
      setLoadingGigs(false)
    })
  }, [])

  // Real-time subscription to job listings
  useEffect(() => {
    const q = query(collection(db, 'jobListings'), orderBy('datePosted', 'desc'))
    return onSnapshot(q, snap => {
      setJobListings(snap.docs.map(d => ({ id: d.id, ...d.data() } as JobListing)))
      setLoadingListings(false)
    })
  }, [])

  async function handleGigAction(id: string, status: 'approved' | 'rejected') {
    await updateDoc(doc(db, 'gigs', id), { status })
  }

  async function handleMarkFilled(id: string) {
    await updateDoc(doc(db, 'jobListings', id), { status: 'filled' })
  }

  async function handleListingAction(id: string, status: 'active' | 'rejected') {
    // Find the listing before updating so we have its data for the notification.
    const listing = jobListings.find(l => l.id === id)

    // Update Firestore status first.
    await updateDoc(doc(db, 'jobListings', id), { status })

    // Only fire notifications when the listing is being approved (status → 'active').
    // This ensures the notification runs exactly once per approval action, not on
    // every render or on rejection.
    if (status === 'active' && listing) {
      try {
        const res = await fetch('/api/notify-job-approval', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id:          listing.id,
            title:       listing.title,
            employerName: listing.employerName,
            minimumAge:  listing.minimumAge,
          }),
        })
        const result = await res.json()
        console.log(
          `[admin] Notification result for "${listing.title}":`,
          `${result.sent ?? 0} sent, ${result.failed ?? 0} failed`
        )
      } catch (err) {
        // Don't surface notification errors to the admin — the approval already
        // succeeded. Just log so it's visible in the browser console.
        console.error('[admin] Failed to trigger push notifications:', err)
      }
    }
  }

  const pendingJobListings  = jobListings.filter(l => l.status === 'pending')
  const publishedJobListings = jobListings.filter(l => l.status === 'active' || l.status === 'filled')

  return (
    <main className="min-h-screen bg-void pt-24 pb-16 px-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <h1 className="font-display text-3xl text-ink mb-1">Admin</h1>
          <p className="font-body text-sm text-muted">WorkTeen management panel</p>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 mb-8 bg-surface border border-edge rounded-lg p-1 w-fit">
          {(['gigs', 'listings'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex items-center gap-2 px-5 py-2 rounded-md text-sm font-medium transition-colors duration-150 ${
                tab === t ? 'bg-edge text-ink' : 'text-muted hover:text-ink'
              }`}
            >
              {t === 'gigs' ? 'Pending Gigs' : 'Job Listings'}
              {t === 'gigs' && pendingGigs.length > 0 && (
                <span className="bg-gold/20 text-gold text-xs px-1.5 py-0.5 rounded-full font-mono">
                  {pendingGigs.length}
                </span>
              )}
              {t === 'listings' && pendingJobListings.length > 0 && (
                <span className="bg-gold/20 text-gold text-xs px-1.5 py-0.5 rounded-full font-mono">
                  {pendingJobListings.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Pending gigs tab */}
        {tab === 'gigs' && (
          <>
            {loadingGigs ? (
              <p className="font-body text-muted text-sm">Loading…</p>
            ) : pendingGigs.length === 0 ? (
              <p className="font-body text-muted text-sm">No pending gigs. You&apos;re all caught up.</p>
            ) : (
              <AnimatePresence>
                {pendingGigs.map(gig => (
                  <GigCard key={gig.id} gig={gig} onAction={handleGigAction} />
                ))}
              </AnimatePresence>
            )}
          </>
        )}

        {/* Job listings tab */}
        {tab === 'listings' && (
          <>
            {/* Pending submissions from /list-a-job — shown above the add form */}
            {!loadingListings && pendingJobListings.length > 0 && (
              <div className="mb-8">
                <p className="text-xs tracking-[0.2em] text-muted uppercase mb-4">
                  Pending Review
                </p>
                <AnimatePresence>
                  {pendingJobListings.map(l => (
                    <PendingListingCard key={l.id} listing={l} onAction={handleListingAction} />
                  ))}
                </AnimatePresence>
              </div>
            )}

            <AddListingForm />

            {loadingListings ? (
              <p className="font-body text-muted text-sm">Loading…</p>
            ) : publishedJobListings.length === 0 ? (
              <p className="font-body text-muted text-sm">No listings yet. Add one above.</p>
            ) : (
              publishedJobListings.map(l => (
                <JobListingCard key={l.id} listing={l} onMarkFilled={handleMarkFilled} />
              ))
            )}
          </>
        )}
      </div>
    </main>
  )
}
