'use client'

import { useState } from 'react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { db } from '@/lib/firebase'

const CATEGORIES = [
  'Food Service',
  'Retail',
  'Outdoor / Lawn',
  'Grocery',
  'Entertainment',
  'Other',
] as const

const INITIAL = {
  businessName: '',
  title: '',
  category: 'Food Service' as string,
  minimumAge: '14',
  maxHoursSchoolDay: '',
  latestShiftEndSchoolNight: '',
  payRate: '',
  address: '',
  description: '',
  contactEmail: '',
  contactPhone: '',
  complianceAck: false,
}

function SuccessState() {
  const prefersReduced = useReducedMotion()

  return (
    <motion.div
      key="success"
      className="text-center py-20"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: prefersReduced ? 0 : 0.35 }}
    >
      <div className="relative w-[88px] h-[88px] mx-auto mb-10">
        {!prefersReduced && (
          <motion.div
            className="absolute inset-0 rounded-full border border-sage/45"
            initial={{ scale: 0.75, opacity: 1 }}
            animate={{ scale: 1.85, opacity: 0 }}
            transition={{ delay: 0.44, duration: 0.72, ease: 'easeOut' }}
          />
        )}
        <motion.div
          className="absolute inset-0 rounded-full border border-sage/22"
          style={{ background: 'rgba(76,175,130,0.07)' }}
          initial={{ scale: prefersReduced ? 1 : 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: prefersReduced ? 0 : 0.38, ease: [0.34, 1.56, 0.64, 1] }}
        />
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 88 88" fill="none" aria-hidden>
          <motion.path
            d="M26 44L38 56L62 30"
            stroke="#4CAF82"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: prefersReduced ? 1 : 0, opacity: prefersReduced ? 1 : 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ delay: prefersReduced ? 0 : 0.3, duration: prefersReduced ? 0 : 0.48, ease: 'easeInOut' }}
          />
        </svg>
      </div>

      <h2 className="font-display text-2xl md:text-3xl text-ink mb-4">
        Submission received.
      </h2>
      <p className="font-body text-muted text-base leading-relaxed max-w-[42ch] mx-auto">
        Thanks! Rishab will review this and reach out before it goes live in the WorkTeen app. Usually within a day or two.
      </p>
    </motion.div>
  )
}

export default function ListAJobForm() {
  const [form, setForm] = useState(INITIAL)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  function set<K extends keyof typeof INITIAL>(key: K, value: (typeof INITIAL)[K]) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!form.contactEmail.trim() && !form.contactPhone.trim()) {
      setError('Please provide at least a contact email or phone number.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Request timed out')), 10_000)
      )
      await Promise.race([
        addDoc(collection(db, 'jobListings'), {
          title:                     form.title.trim(),
          employerName:              form.businessName.trim(),
          category:                  form.category,
          minimumAge:                parseInt(form.minimumAge),
          maxHoursSchoolDay:         form.maxHoursSchoolDay ? parseInt(form.maxHoursSchoolDay) : null,
          latestShiftEndSchoolNight: form.latestShiftEndSchoolNight || null,
          payRate:                   form.payRate.trim(),
          address:                   form.address.trim(),
          description:               form.description.trim(),
          contactEmail:              form.contactEmail.trim() || null,
          contactPhone:              form.contactPhone.trim() || null,
          status:                    'pending', // always pending — approved by admin before going live
          datePosted:                serverTimestamp(),
        }),
        timeout,
      ])
      setSubmitted(true)
    } catch (err) {
      console.error('[ListAJobForm] Firebase write failed:', err)
      setError('Something went wrong — check the browser console for details.')
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
          {/* Business name */}
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5" htmlFor="job-business">
              Business or company name
            </label>
            <input
              id="job-business"
              className="input-field w-full"
              value={form.businessName}
              onChange={e => set('businessName', e.target.value)}
              placeholder="Joe's Diner"
              required
              maxLength={100}
            />
          </div>

          {/* Job title */}
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5" htmlFor="job-title">
              Job title
            </label>
            <input
              id="job-title"
              className="input-field w-full"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="Cashier, Host, Lawn crew member..."
              required
              maxLength={100}
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5" htmlFor="job-category">
              Category
            </label>
            <select
              id="job-category"
              className="select-field w-full"
              value={form.category}
              onChange={e => set('category', e.target.value)}
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Pay rate */}
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5" htmlFor="job-pay">
              Pay rate
            </label>
            <input
              id="job-pay"
              className="input-field w-full"
              value={form.payRate}
              onChange={e => set('payRate', e.target.value)}
              placeholder="$15/hr, $120/day..."
              required
              maxLength={60}
            />
          </div>

          {/* Min age + school-day hours */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5" htmlFor="job-age">
                Minimum age you&apos;d hire
              </label>
              <input
                id="job-age"
                type="number"
                className="input-field w-full"
                value={form.minimumAge}
                onChange={e => set('minimumAge', e.target.value)}
                required
                min={13}
                max={18}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5" htmlFor="job-hours">
                Max hours / school day{' '}
                <span className="text-muted/50 text-xs font-normal">optional</span>
              </label>
              <input
                id="job-hours"
                type="number"
                className="input-field w-full"
                value={form.maxHoursSchoolDay}
                onChange={e => set('maxHoursSchoolDay', e.target.value)}
                placeholder="3"
                min={0}
                max={8}
              />
            </div>
          </div>

          {/* Latest shift end */}
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5" htmlFor="job-shift">
              Latest shift end on a school night{' '}
              <span className="text-muted/50 text-xs font-normal">optional</span>
            </label>
            <input
              id="job-shift"
              type="time"
              className="input-field w-full"
              value={form.latestShiftEndSchoolNight}
              onChange={e => set('latestShiftEndSchoolNight', e.target.value)}
            />
          </div>

          {/* Business address */}
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5" htmlFor="job-address">
              Business address
            </label>
            <input
              id="job-address"
              className="input-field w-full"
              value={form.address}
              onChange={e => set('address', e.target.value)}
              placeholder="123 Main St, Springfield, MA"
              required
              maxLength={200}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5" htmlFor="job-desc">
              Role description
            </label>
            <textarea
              id="job-desc"
              className="textarea-field w-full"
              rows={4}
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="What will a teen be doing day-to-day? Any requirements around experience, transportation, or schedule?"
              required
              maxLength={1000}
            />
          </div>

          {/* Contact — at least one required, enforced on submit */}
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">
              Contact info{' '}
              <span className="text-muted/50 text-xs font-normal">email, phone, or both</span>
            </label>
            <div className="space-y-3">
              <input
                type="email"
                className="input-field w-full"
                value={form.contactEmail}
                onChange={e => set('contactEmail', e.target.value)}
                placeholder="hiring@yourbusiness.com"
                maxLength={200}
                aria-label="Contact email"
              />
              <input
                type="tel"
                className="input-field w-full"
                value={form.contactPhone}
                onChange={e => set('contactPhone', e.target.value)}
                placeholder="(555) 000-0000"
                aria-label="Contact phone"
              />
            </div>
          </div>

          {/* Compliance acknowledgement */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative mt-0.5 flex-shrink-0">
              <input
                type="checkbox"
                className="sr-only"
                checked={form.complianceAck}
                onChange={e => set('complianceAck', e.target.checked)}
                required
              />
              <div
                className={`w-5 h-5 rounded border flex items-center justify-center transition-colors duration-150 ${
                  form.complianceAck
                    ? 'bg-gold border-gold'
                    : 'border-edge group-hover:border-muted/80'
                }`}
              >
                {form.complianceAck && (
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
              I confirm this role complies with Massachusetts child labor laws for the minimum age listed, and that someone will review applications from this listing.
            </span>
          </label>

          {error && (
            <p className="font-body text-coral text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting || !form.complianceAck}
            className="btn-primary w-full py-4 text-base disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? 'Submitting…' : 'Submit for Review →'}
          </button>

          <p className="font-body text-xs text-muted/50 text-center">
            Rishab reviews every submission personally. Expect a response within a day or two.
          </p>
        </motion.form>
      )}
    </AnimatePresence>
  )
}
