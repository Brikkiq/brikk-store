'use client'
// Legacy lead capture URL: brikk.store/refer?agent=<id>. Same form as /r/CODE.
import { useEffect, useState } from 'react'
import { LeadCaptureForm } from '@/lib/LeadCaptureForm'

export default function ReferPage() {
  const [agentId, setAgentId] = useState(undefined)
  useEffect(() => { setAgentId(new URLSearchParams(window.location.search).get('agent') || null) }, [])
  if (agentId === undefined) return null
  return <LeadCaptureForm agentId={agentId} />
}
