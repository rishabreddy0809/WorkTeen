'use client'

import { useState } from 'react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { db } from '@/lib/firebase'

const CATEGORIES = [
  'Yard Work',
  'Babysitting / Childcare',
  'Pet Care',
  'Moving Help',
  'Car Wash / Detailing',
  'Tutoring',
  'Tech Help',
  'Errands',
  'Event Help',
  'Other',
] as const

const INITIAL = {
  title: '',
  description: '',
  category: CATEGORIES[0] as string,
  payAmount: '',
  payType: 'hourly' as 'hourly' | 'fixed',
  posterName: '',
  posterPhone: '',
  zip: '',
  preferredDate: '',
  safetyAck: false,
}

// ─── Success state — the designed reward moment ───────────────────────────────

function SuccessState() {
  const prefersReduced = useReducedMotion()
  const instant = prefersReduced ? 0 : undefined

  return (
    <motion.div
      key="success"
      className="text-center py-20"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: prefersReduced ? 0 : 0.35 }}
    >
      {/* Animated checkmark cluster */}
      <div className="relative w-[88px] h-[88px] mx-auto mb-10">
        {/* Outer ring — expands and fades, the "exhale" */}
        {!prefersReduced && (
          <motion.div
            className="absolute inset-0 rounded-full border border-sage/45"
            initial={{ scale: 0.75, opacity: 1 }}
            animate={{ scale: 1.85, opacity: 0 }}
            transition={{ delay: 0.44, duration: 0.72, ease: 'easeOut' }}
          />
        )}
        {/* Circle background — springs into place */}
        <motion.div
          className="absolute inset-0 rounded-full border border-sage/22"
          style={{ background: 'rgba(76,175,130,0.07)' }}
          initial={{ scale: instant ?? 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: instant ?? 0.38, ease: [0.34, 1.56, 0.64, 1] }}
        />
        {/* Checkmark path — draws itself */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 88 88"
          fill="none"
          aria-hidden
        >
          <motion.path
            d="M26 44L38 56L62 30"
            stroke="#4CAF82"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: instant ?? 0, opacity: instant ?? 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ delay: instant ?? 0.3, duration: instant ?? 0.48, ease: 'easeInOut' }}
          />
        </svg>
      </div>

      <h2 className="font-display text-2xl md:text-3xl text-ink mb-4">
        You&apos;re all set.
      </h2>
      <p className="font-body text-muted text-base leading-relaxed max-w-[38ch] mx-auto">
        Your post is being reviewed and will appear in the WorkTeen app once approved.
      </p>
    </motion.div>
  )
}

// ─── Main form ────────────────────────────────────────────────────────────────

export default function PostJobForm() {
  const [form, setForm] = useState(INITIAL)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  function set<K extends keyof typeof INITIAL>(key: K, value: (typeof INITIAL)[K]) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await addDoc(collection(db, 'gigs'), {
        title:         form.title.trim(),
        description:   form.description.trim(),
        category:      form.category,
        payAmount:     parseFloat(form.payAmount),
        payType:       form.payType,
        posterName:    form.posterName.trim(),
        posterPhone:   form.posterPhone.trim(),
        zip:           form.zip.trim(),
        preferredDate: form.preferredDate || null,
        // status is ALWAYS "pending" — written here, never from form values
        status:        'pending',
        datePosted:    serverTimestamp(),
        reported:      false,
      })
      setSubmitted(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AnimatePresence mode="wait">
      {submitted ? (
        <SuccessState key="success" />
      ) : (
        <motion.form
          key="form"
          onSubmit={handleSubmit}
          className="space-y-6"
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
        >
          {/* What do you need? */}
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5" htmlFor="gig-title">
              What do you need help with?
            </label>
            <input
              id="gig-title"
              className="input-field w-full"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="e.g. Mow my lawn, Clean garage, Help move furniture"
              required
              maxLength={100}
            />
          </div>

          {/* Details */}
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5" htmlFor="gig-desc">
              Details
            </label>
            <textarea
              id="gig-desc"
              className="textarea-field w-full"
              rows={4}
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="What needs doing, any requirements, tools needed, when you need it by…"
              required
              maxLength={1000}
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5" htmlFor="gig-category">
              Category
            </label>
            <select
              id="gig-category"
              className="select-field w-full"
              value={form.category}
              onChange={e => set('category', e.target.value)}
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Pay */}
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Pay</label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted/70 text-sm select-none pointer-events-none">
                  $
                </span>
                <input
                  type="number"
                  className="input-field w-full pl-7"
                  value={form.payAmount}
                  onChange={e => set('payAmount', e.target.value)}
                  placeholder="0"
                  required
                  min={1}
                  step={0.5}
                  aria-label="Pay amount"
                />
              </div>
              {/* /hr or flat toggle */}
              <div className="flex bg-surface border border-edge rounded-lg overflow-hidden flex-shrink-0">
                {(['hourly', 'fixed'] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => set('payType', t)}
                    className={`px-4 py-3 text-sm font-medium transition-colors duration-150 ${
                      form.payType === t
                        ? 'bg-edge text-ink'
                        : 'text-muted hover:text-ink'
                    }`}
                  >
                    {t === 'hourly' ? '/hr' : 'flat'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5" htmlFor="gig-name">
                Your Name
              </label>
              <input
                id="gig-name"
                className="input-field w-full"
                value={form.posterName}
                onChange={e => set('posterName', e.target.value)}
                placeholder="First name is fine"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5" htmlFor="gig-phone">
                Phone{' '}
                <span className="text-gold text-xs font-normal">required</span>
              </label>
              <input
                id="gig-phone"
                type="tel"
                className="input-field w-full"
                value={form.posterPhone}
                onChange={e => set('posterPhone', e.target.value)}
                placeholder="(555) 000-0000"
                required
              />
            </div>
          </div>

          {/* Location + Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5" htmlFor="gig-zip">
                Zip Code
              </label>
              <input
                id="gig-zip"
                className="input-field w-full"
                value={form.zip}
                onChange={e => set('zip', e.target.value)}
                placeholder="94102"
                required
                pattern="\d{5}"
                maxLength={5}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5" htmlFor="gig-date">
                Preferred Date{' '}
                <span className="text-muted/50 text-xs font-normal">optional</span>
              </label>
              <input
                id="gig-date"
                type="date"
                className="input-field w-full"
                value={form.preferredDate}
                onChange={e => set('preferredDate', e.target.value)}
              />
            </div>
          </div>

          {/* Safety acknowledgement */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative mt-0.5 flex-shrink-0">
              <input
                type="checkbox"
                className="sr-only"
                checked={form.safetyAck}
                onChange={e => set('safetyAck', e.target.checked)}
                required
              />
              <div
                className={`w-5 h-5 rounded border flex items-center justify-center transition-colors duration-150 ${
                  form.safetyAck
                    ? 'bg-gold border-gold'
                    : 'border-edge group-hover:border-muted/80'
                }`}
              >
                {form.safetyAck && (
                  <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" aria-hidden>
                    <path
                      d="M2 6L5 9L10 3"
                      stroke="#0F0F13"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
            </div>
            <span className="text-sm text-muted leading-snug">
              I understand this post will be reviewed before appearing in the WorkTeen app.
            </span>
          </label>

          {error && (
            <p className="font-body text-coral text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting || !form.safetyAck}
            className="btn-primary w-full py-4 text-base disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? 'Submitting…' : 'Submit Gig Post →'}
          </button>

          <p className="font-body text-xs text-muted/50 text-center">
            No account needed. Posts are reviewed within 24 hours.
          </p>
        </motion.form>
      )}
    </AnimatePresence>
  )
}
