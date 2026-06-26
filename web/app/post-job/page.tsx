import type { Metadata } from 'next'
import PostJobForm from '@/components/PostJobForm'

export const metadata: Metadata = {
  title: 'Post a Gig | WorkTeen',
  description: 'Post a local gig for a teen worker. Takes two minutes. Reviewed before going live.',
}

export default function PostJobPage() {
  return (
    <main className="min-h-screen bg-void pt-24 pb-20 px-6">
      <div className="max-w-xl mx-auto">
        {/* Page header */}
        <div className="mb-10">
          <p className="text-xs tracking-[0.2em] text-muted uppercase mb-4">Post a Gig</p>
          <h1 className="font-display text-4xl md:text-5xl text-ink mb-4 leading-tight">
            Need help<br />with something?
          </h1>
          <p className="font-body text-muted leading-relaxed">
            Post a gig for a local teen. Every submission is reviewed before appearing in the WorkTeen app, usually within 24 hours.
          </p>
        </div>

        <PostJobForm />
      </div>
    </main>
  )
}
