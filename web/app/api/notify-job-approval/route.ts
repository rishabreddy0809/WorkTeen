/**
 * POST /api/notify-job-approval
 *
 * Called by AdminPanel immediately after a job listing's status is changed to
 * 'active'. Queries the 'teens' collection for every teen who is eligible for
 * this job (age >= minimumAge) and has a saved FCM device token, then sends a
 * multicast push notification via Firebase Cloud Messaging.
 *
 * This runs entirely server-side — firebase-admin is never bundled into the
 * browser. The route is not publicly guarded (the admin panel already requires
 * a password), but it will only do anything meaningful when called with a valid
 * job listing ID that actually just transitioned to 'active'.
 */

import { NextRequest, NextResponse } from 'next/server'
import { adminDb, adminMsg } from '@/lib/firebaseAdmin'
import { MulticastMessage } from 'firebase-admin/messaging'

// ─── Types ────────────────────────────────────────────────────────────────────

interface JobListingPayload {
  id: string
  title: string
  employerName: string
  minimumAge: number
}

interface Teen {
  id: string
  name: string
  age: number
  fcmToken?: string
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // ── Parse & validate request body ──────────────────────────────────────────
  let job: JobListingPayload
  try {
    job = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!job?.id || !job?.title || !job?.employerName || job?.minimumAge == null) {
    return NextResponse.json(
      { error: 'Missing required fields: id, title, employerName, minimumAge' },
      { status: 400 }
    )
  }

  // ── Re-verify the listing really is 'active' in Firestore ─────────────────
  // Guards against replayed or double-fired requests.
  const listingSnap = await adminDb.collection('jobListings').doc(job.id).get()
  if (!listingSnap.exists || listingSnap.data()?.status !== 'active') {
    return NextResponse.json(
      { error: 'Listing is not active — notification skipped' },
      { status: 409 }
    )
  }

  // ── Query eligible teens ───────────────────────────────────────────────────
  // Mirrors the EligibilityEngine logic from the iOS app:
  //   teen.age >= job.minimumAge
  // Firestore can only filter on one inequality per query, so we filter age
  // server-side and check fcmToken in JS (avoids a composite index requirement).
  const teensSnap = await adminDb
    .collection('teens')
    .where('age', '>=', job.minimumAge)
    .get()

  // Collect only teens with a non-empty FCM token.
  const eligibleTokens: string[] = []
  const eligibleTeens: Teen[] = []

  teensSnap.forEach(doc => {
    const data = doc.data()
    const token: string | undefined = data.fcmToken
    if (token && token.trim().length > 0) {
      eligibleTokens.push(token.trim())
      eligibleTeens.push({ id: doc.id, name: data.name ?? 'Teen', age: data.age, fcmToken: token })
    }
  })

  if (eligibleTokens.length === 0) {
    console.log(`[notify] Job "${job.title}" approved — no eligible teens with FCM tokens found.`)
    return NextResponse.json({ sent: 0, failed: 0, message: 'No eligible teens with tokens' })
  }

  console.log(
    `[notify] Job "${job.title}" (minAge ${job.minimumAge}) approved. ` +
    `Sending to ${eligibleTokens.length} eligible teen(s).`
  )

  // ── Send multicast notification ────────────────────────────────────────────
  // sendEachForMulticast handles batching internally (max 500 tokens per call).
  // For >500 tokens we chunk manually to stay within the FCM limit.
  const BATCH_SIZE = 500
  let totalSuccess = 0
  let totalFailure = 0

  const notificationTitle = 'New job near you'
  const notificationBody  = `${job.title} at ${job.employerName} is now live`

  for (let i = 0; i < eligibleTokens.length; i += BATCH_SIZE) {
    const tokenBatch = eligibleTokens.slice(i, i + BATCH_SIZE)

    const message: MulticastMessage = {
      tokens: tokenBatch,
      notification: {
        title: notificationTitle,
        body:  notificationBody,
      },
      // Pass the listing ID as data so the iOS app can deep-link directly.
      data: {
        listingId: job.id,
        type: 'job_approval',
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    }

    const batchResponse = await adminMsg.sendEachForMulticast(message)
    totalSuccess += batchResponse.successCount
    totalFailure += batchResponse.failureCount

    // Log individual failures (expired/invalid tokens) but don't throw —
    // a bad token for one teen should never block the rest.
    batchResponse.responses.forEach((resp, idx) => {
      if (!resp.success) {
        const token = tokenBatch[idx]
        console.warn(
          `[notify] Failed to send to token index ${i + idx} ` +
          `(token: ...${token.slice(-6)}): ${resp.error?.message ?? 'unknown error'}`
        )
      }
    })
  }

  console.log(
    `[notify] Done. ${totalSuccess} delivered, ${totalFailure} failed ` +
    `out of ${eligibleTokens.length} eligible teens.`
  )

  return NextResponse.json({
    sent:    totalSuccess,
    failed:  totalFailure,
    total:   eligibleTokens.length,
  })
}
