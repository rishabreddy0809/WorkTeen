import type { Metadata } from 'next'
import PostJobForm from '@/components/PostJobForm'

export const metadata: Metadata = {
  title: 'Post a Gig | WorkTeen',
  description: 'Post a local gig for a teen worker. Takes two minutes. Reviewed before going live.',
}

export default function PostJobPage() {
  return (
    <main className="min-h-screen bg-void pt-24 pb-20 px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">

          {/* Left col — intro, sticky on desktop */}
          <div className="lg:sticky lg:top-32">
            <p className="text-xs tracking-[0.2em] text-muted uppercase mb-5">Post a Gig</p>
            <h1 className="font-display text-5xl md:text-6xl text-ink mb-6 leading-[1.05]">
              Need help<br />with something?
            </h1>
            <p className="font-body text-muted leading-relaxed text-lg max-w-[38ch]">
              Post a gig for a local teen. Every submission is reviewed before appearing in the
              WorkTeen app, usually within 24 hours.
            </p>
          </div>

          {/* Right col — form */}
          <div>
            <PostJobForm />
          </div>

        </div>
      </div>
    </main>
  )
}
