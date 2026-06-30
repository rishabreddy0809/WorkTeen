import type { Metadata } from 'next'
import ListAJobForm from '@/components/ListAJobForm'

export const metadata: Metadata = {
  title: 'List a Job | WorkTeen',
  description:
    'Post a job opening for teens in your area. WorkTeen connects local businesses with verified teen job seekers. Every listing is reviewed before going live.',
}

export default function ListAJobPage() {
  return (
    <main className="min-h-screen bg-void pt-24 pb-20 px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">

          {/* Left col — intro, sticky on desktop */}
          <div className="lg:sticky lg:top-32">
            <p className="text-xs tracking-[0.2em] text-muted uppercase mb-5">For Employers</p>
            <h1 className="font-display text-5xl md:text-6xl text-ink mb-6 leading-[1.05]">
              Hire a local teen<br />the right way.
            </h1>
            <p className="font-body text-muted leading-relaxed text-lg max-w-[38ch]">
              WorkTeen is a mobile app that connects teens in your area with local job
              opportunities. Every listing is reviewed before it goes live, and teens can reach
              you directly using the contact info you provide. Fill out the form and Rishab will
              follow up before anything appears in the app.
            </p>
          </div>

          {/* Right col — form */}
          <div>
            <ListAJobForm />
          </div>

        </div>
      </div>
    </main>
  )
}
