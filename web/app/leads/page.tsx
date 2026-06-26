import type { Metadata } from 'next'
import AdminGate from '@/components/AdminGate'
import LeadsSearch from '@/components/LeadsSearch'

export const metadata: Metadata = {
  title: 'Leads | WorkTeen',
}

export default function LeadsPage() {
  return (
    <AdminGate>
      <LeadsSearch />
    </AdminGate>
  )
}
