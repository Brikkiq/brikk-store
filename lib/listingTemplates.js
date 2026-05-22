// Default listing-prep checklist templates. Agents can fork + customize.
// Used by app/app/deals when a new deal is created — the API or client
// auto-seeds checklist_items rows with these labels.

export const LISTING_PREP_TEMPLATE = [
  { label: 'Sign listing agreement + paperwork', due_days_before_active: 7, category: 'listing_prep' },
  { label: 'Schedule professional photography', due_days_before_active: 5, category: 'listing_prep' },
  { label: 'Stage or recommend stager', due_days_before_active: 5, category: 'listing_prep' },
  { label: 'Pre-inspection (optional but recommended)', due_days_before_active: 4, category: 'listing_prep' },
  { label: 'Order yard sign + lockbox', due_days_before_active: 3, category: 'listing_prep' },
  { label: 'Write listing description', due_days_before_active: 2, category: 'listing_prep' },
  { label: 'Disclosures + HOA docs collected', due_days_before_active: 2, category: 'listing_prep' },
  { label: 'Enter listing into MLS', due_days_before_active: 1, category: 'listing_prep' },
  { label: 'Coming-soon social posts', due_days_before_active: 1, category: 'listing_prep' },
  { label: 'Live on MLS + sites syndicated', due_days_before_active: 0, category: 'listing_prep' },
]

export const UNDER_CONTRACT_TEMPLATE = [
  { label: 'Send contract to title/escrow', due_days_after_contract: 1, category: 'inspection' },
  { label: 'Buyer inspection scheduled', due_days_after_contract: 3, category: 'inspection' },
  { label: 'Inspection complete + report received', due_days_after_contract: 7, category: 'inspection' },
  { label: 'Repair requests negotiated', due_days_after_contract: 10, category: 'inspection' },
  { label: 'Appraisal ordered by lender', due_days_after_contract: 5, category: 'closing' },
  { label: 'Appraisal complete', due_days_after_contract: 14, category: 'closing' },
  { label: 'Loan commitment received', due_days_after_contract: 21, category: 'closing' },
  { label: 'Final walk-through scheduled', due_days_before_close: 2, category: 'closing' },
  { label: 'Closing disclosure reviewed', due_days_before_close: 3, category: 'closing' },
  { label: 'Wire instructions confirmed (verbally — fraud protection)', due_days_before_close: 1, category: 'closing' },
  { label: 'Close + funds wired', due_days_before_close: 0, category: 'closing' },
  { label: 'Keys delivered to buyer', due_days_before_close: 0, category: 'closing' },
]

// Compute concrete due dates from a deal's close_date + a template item
export function computeDueDate(item, closeDate) {
  if (!closeDate) return null
  const close = new Date(closeDate)
  if (item.due_days_before_close !== undefined) {
    return new Date(close.getTime() - item.due_days_before_close * 86400000).toISOString().slice(0, 10)
  }
  if (item.due_days_after_contract !== undefined) {
    // Approximate: contract date ≈ close_date - 30
    const contract = new Date(close.getTime() - 30 * 86400000)
    return new Date(contract.getTime() + item.due_days_after_contract * 86400000).toISOString().slice(0, 10)
  }
  if (item.due_days_before_active !== undefined) {
    // Listing prep: dates are relative to a future "active" date the agent picks
    const active = new Date(close.getTime() - 45 * 86400000)
    return new Date(active.getTime() - item.due_days_before_active * 86400000).toISOString().slice(0, 10)
  }
  return null
}
