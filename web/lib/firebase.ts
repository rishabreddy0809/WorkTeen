// WorkTeen Firebase Config
// ─────────────────────────────────────────────────────────────────────────────
// This connects to the SAME Firebase project as your iOS app.
// Do NOT create a new project — just grab the web config from the existing one.
//
// How to find these values:
//   Firebase Console (console.firebase.google.com)
//   → Select your existing WorkTeen project
//   → Project Settings (gear icon) → General tab
//   → Scroll to "Your apps" → click the web app (or add one if none exists)
//   → "SDK setup and configuration" → select "Config"
//   → Copy the firebaseConfig object values into .env.local
//
// The Firestore collections this app reads/writes:
//   "gigs"        — casual gigs posted by parents/individuals via /post-job
//   "jobListings" — curated job listings managed via /admin

import { initializeApp, getApps } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

export const db = getFirestore(app)
