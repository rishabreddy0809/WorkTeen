import type { Metadata } from 'next'
import AdminGate from '@/components/AdminGate'
import AdminPanel from '@/components/AdminPanel'

export const metadata: Metadata = {
  title: 'Admin | WorkTeen',
}

export default function AdminPage() {
  return (
    <AdminGate>
      <AdminPanel />
    </AdminGate>
  )
}
