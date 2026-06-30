import Link from 'next/link'
import HeroSection from '@/components/HeroSection'
import FeaturesSection from '@/components/FeaturesSection'
import HowItWorksSection from '@/components/HowItWorksSection'

// ─── Animation strategy summary ───────────────────────────────────────────────
//
// HeroSection       — scroll-linked: content fades + scales out as the 160vh
//                     sticky wrapper scrolls past. Uses useScroll + useTransform.
//
// FeaturesSection   — whileInView (fires once): each card fades + rises when
//                     it enters the viewport. Simple, not scroll-linked.
//
// HowItWorksSection — scroll-linked: 280vh sticky wrapper; each of the 3 steps
//                     maps to a distinct range of scrollYProgress and animates in
//                     one by one as the user scrolls. Uses useScroll + useTransform.
//
// CTA / Footer      — whileInView (fires once): gentle fade-in, no transforms.
//
// All animations respect prefers-reduced-motion via useReducedMotion() inside
// each client component.

export default function HomePage() {
  return (
    <main className="bg-void min-h-screen">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      {/* 160vh sticky wrapper + scroll-driven fade. See HeroSection.tsx. */}
      <HeroSection />

      {/* ── Features ──────────────────────────────────────────────────────── */}
      {/* whileInView entrance, staggered cards. */}
      <FeaturesSection />

      {/* ── How it works ──────────────────────────────────────────────────── */}
      {/* 280vh sticky wrapper + sequential scroll-driven step animations.   */}
      {/* id="how-it-works" lives on the outer wrapper in HowItWorksSection. */}
      <HowItWorksSection />

      {/* ── Final CTA ─────────────────────────────────────────────────────── */}
      <section className="py-24 px-6" style={{ backgroundColor: '#F5A623' }}>
        <div className="max-w-xl mx-auto text-center">
          <h2 className="font-display text-3xl md:text-4xl mb-4 leading-snug" style={{ color: '#0F0F13' }}>
            Need a hand this weekend?
          </h2>
          <p className="font-body text-lg mb-8" style={{ color: 'rgba(15, 15, 19, 0.72)' }}>
            Post a gig in two minutes. A verified teen near you will see it.
          </p>
          <Link href="/post-job" className="btn-dark px-8 py-4 text-base">
            Post a Gig →
          </Link>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="bg-void border-t border-edge py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <span className="font-display text-lg text-ink">
            WorkTeen<span className="text-gold">.</span>
          </span>

          {/* Links */}
          <nav className="flex items-center gap-6" aria-label="Footer navigation">
            <span className="font-body text-xs text-muted/60 uppercase tracking-widest select-none">
              For Employers
            </span>
            <Link
              href="/post-job"
              className="font-body text-sm text-muted hover:text-ink transition-colors duration-150"
            >
              Post a Gig
            </Link>
          </nav>

          {/* Copyright */}
          <p className="font-body text-xs text-muted/50">
            © {new Date().getFullYear()} WorkTeen. Built by Rishab.
          </p>
        </div>
      </footer>

    </main>
  )
}
