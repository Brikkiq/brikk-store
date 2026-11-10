'use client'
// Friendly lead capture URL: brikk.store/r/ABCD-1234
import { useParams } from 'next/navigation'
import { LeadCaptureForm } from '@/lib/LeadCaptureForm'

export default function ReferralCodePage() {
  const params = useParams()
  const code = String(params?.code || '').toUpperCase()
  return <LeadCaptureForm code={code} />
}
