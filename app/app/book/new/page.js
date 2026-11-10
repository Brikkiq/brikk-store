'use client'
import { api } from '@/lib/client/api'
import { PageHeader } from '@/lib/ui'
import { HouseholdForm } from '../HouseholdForm'

export default function NewHouseholdPage() {
  return (
    <div style={{ maxWidth: 860 }}>
      <PageHeader title="Add client" subtitle="Add the household now — you’ll add their policy on the next screen." />
      <HouseholdForm
        submitLabel="Save and add policy"
        onSubmit={async (body) => {
          const h = await api.post('/households', body)
          window.location.href = `/app/book/${h.id}?add=policy`
        }}
        onCancel={() => { window.location.href = '/app/book' }}
      />
    </div>
  )
}
