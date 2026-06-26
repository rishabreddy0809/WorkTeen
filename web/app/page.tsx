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
      <section className="py-24 px-6 bg-void border-t border-edge/40">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="font-display text-3xl md:text-4xl text-ink mb-4 leading-snug">
            Need a hand this weekend?
          </h2>
          <p className="font-body text-muted text-lg mb-8">
            Post a gig in two minutes. A verified teen near you will see it.
          </p>
          <Link href="/post-job" className="btn-primary px-8 py-4 text-base">
            Post a Gig →
          </Link>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="bg-void border-t border-edge/40 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="font-display text-lg text-ink">
            WorkTeen<span className="text-gold">.</span>
          </span>
          <p className="font-body text-xs text-muted/50">
            Built by Rishab. Real work, real teens, real contact.
          </p>
        </div>
      </footer>

    </main>
  )
}
