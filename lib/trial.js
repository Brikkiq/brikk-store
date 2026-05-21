// Trial state machine. Every signed-in user falls into one of these states.
// The layout uses this to decide whether to show a banner, redirect to paywall,
// or get out of the way.

export const TRIAL_DAYS = 14
const MS_PER_DAY = 86_400_000

// Inputs: profile row (with created_at, subscription_status, subscription_plan, team_id, team_role)
// and optional team row (status, plan_tier).
//
// Output:
//   { state, daysLeft, message }
//
// states:
//   'subscribed'      — paid Pro/Team/Agency, full access. No banner.
//   'team_member'     — member of an active team. No banner. Billing covered.
//   'trialing'        — within their 14-day window. Banner shows "X days left".
//   'expired'         — past 14 days, no subscription. HARD GATE — redirect to upgrade.
//   'past_due'        — subscription exists but payment failed. Soft warning banner.
//   'unknown'         — profile not loaded yet. No banner, no gate.
export function getTrialState({ profile, team } = {}) {
  if (!profile) return { state: 'unknown', daysLeft: null, message: null }

  // 1. Team member — fully covered by team owner's plan.
  if (profile.team_id && profile.team_role === 'member') {
    if (team && (team.status === 'active')) return { state: 'team_member', daysLeft: null, message: null }
    // Team cancelled or unpaid — member loses access too
    if (team && team.status === 'cancelled') return { state: 'expired', daysLeft: 0, message: 'Your team subscription was cancelled. Reach out to your team owner.' }
    if (team && team.status === 'past_due') return { state: 'past_due', daysLeft: null, message: 'Your team\'s payment is past due. The team owner needs to update payment.' }
    return { state: 'team_member', daysLeft: null, message: null }
  }

  // 2. Active paid subscription
  if (profile.subscription_status === 'active') {
    return { state: 'subscribed', daysLeft: null, message: null }
  }

  // 3. Past due — subscription exists but Stripe couldn't charge
  if (profile.subscription_status === 'past_due') {
    return { state: 'past_due', daysLeft: null, message: 'Your last payment failed. Update your card to keep your account active.' }
  }

  // 4. Trial window — based on signup date
  const createdAt = profile.created_at ? new Date(profile.created_at).getTime() : null
  if (!createdAt) return { state: 'unknown', daysLeft: null, message: null }
  const trialEndAt = createdAt + TRIAL_DAYS * MS_PER_DAY
  const now = Date.now()
  const daysLeft = Math.max(0, Math.ceil((trialEndAt - now) / MS_PER_DAY))

  if (now < trialEndAt) {
    return {
      state: 'trialing',
      daysLeft,
      message: daysLeft === 1
        ? 'Your free trial ends tomorrow. Add a card to keep going without interruption.'
        : daysLeft <= 3
        ? `Your free trial ends in ${daysLeft} days. Add a card to keep going.`
        : `${daysLeft} days left in your free trial.`,
    }
  }

  // 5. Trial has run out, no subscription
  return {
    state: 'expired',
    daysLeft: 0,
    message: 'Your 14-day trial has ended. Pick a plan to unlock Brikk again.',
  }
}

// True when the current state means we should redirect the user away from
// most of /app to the upgrade screen. Owners of team plans can still subscribe.
// Settings, /app/upgrade, and the logout flow stay accessible.
export function shouldGate(state) {
  return state === 'expired'
}
