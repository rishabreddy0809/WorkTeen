/**
 * firebaseAdmin.ts — SERVER-ONLY Firebase Admin SDK initializer
 *
 * This file must never be imported from client components ('use client').
 * It uses the service account credentials stored as environment variables
 * (never committed to the repo).
 *
 * ─── Required Environment Variables ───────────────────────────────────────────
 *
 * FIREBASE_PROJECT_ID
 *   Your Firebase project ID.
 *   Found at: Firebase Console → Project Settings → General → Project ID
 *   Example: workteen-ade8c
 *
 * FIREBASE_CLIENT_EMAIL
 *   The service account email address.
 *   Found at: Firebase Console → Project Settings → Service Accounts
 *             → "Generate new private key" → downloaded JSON → "client_email"
 *   Example: firebase-adminsdk-xxxxx@workteen-ade8c.iam.gserviceaccount.com
 *
 * FIREBASE_PRIVATE_KEY
 *   The RSA private key from the service account JSON.
 *   Found at: same downloaded JSON → "private_key"
 *   IMPORTANT: The key contains literal \n characters. When pasting into
 *   .env.local, wrap the entire value in double quotes so the newlines are
 *   preserved, e.g.:
 *     FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
 *   Vercel automatically handles the newlines when you paste the raw value
 *   into the dashboard — no quoting needed there.
 *
 * ─── How to generate the service account key ──────────────────────────────────
 *  1. Go to Firebase Console → (your project) → Project Settings (gear icon)
 *  2. Click the "Service accounts" tab
 *  3. Click "Generate new private key" → confirm → a JSON file downloads
 *  4. Open the JSON and copy:
 *       "project_id"    → FIREBASE_PROJECT_ID
 *       "client_email"  → FIREBASE_CLIENT_EMAIL
 *       "private_key"   → FIREBASE_PRIVATE_KEY
 *  5. Add those three values to .env.local (see above) and to Vercel's
 *     Environment Variables dashboard (Settings → Environment Variables).
 *  6. Delete the downloaded JSON — keep it out of your repo.
 * ──────────────────────────────────────────────────────────────────────────────
 */

import { initializeApp, getApps, cert, App } from 'firebase-admin/app'
import { getFirestore, Firestore } from 'firebase-admin/firestore'
import { getMessaging, Messaging } from 'firebase-admin/messaging'

// Lazy singletons — initialized on first call, not at module parse time.
// This allows `next build` to succeed even before the env vars are set,
// while still throwing a clear error at runtime if they're missing.
let _adminDb: Firestore  | null = null
let _adminMsg: Messaging | null = null

function getAdminApp(): App {
  if (getApps().length > 0) return getApps()[0]

  const projectId   = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  // Vercel stores the private key with literal \n — replace them with real newlines.
  const privateKey  = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Missing Firebase Admin env vars. ' +
      'Ensure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY ' +
      'are set in .env.local (local) and Vercel Environment Variables (production).'
    )
  }

  return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) })
}

export function getAdminDb(): Firestore {
  if (!_adminDb) _adminDb = getFirestore(getAdminApp())
  return _adminDb
}

export function getAdminMsg(): Messaging {
  if (!_adminMsg) _adminMsg = getMessaging(getAdminApp())
  return _adminMsg
}
