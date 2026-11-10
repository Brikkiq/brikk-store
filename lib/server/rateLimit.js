// Fixed-window rate limiting backed by Postgres (sql/sec-01-lock-down-profiles.sql),
// so it works across serverless instances. Server-only.
import { ApiError } from './http'

export async function rateLimit(admin, bucket, { limit, windowSeconds }) {
  const { data, error } = await admin.rpc('hit_rate_limit', { p_bucket: bucket, p_window_seconds: windowSeconds })
  if (error) {
    // Fail closed: if the limiter is unavailable, refuse rather than allow abuse.
    console.error('[rateLimit] unavailable:', error.message)
    throw new ApiError(503, 'rate_limit_unavailable', 'Please try again in a moment.')
  }
  if (Number(data) > limit) {
    throw new ApiError(429, 'rate_limited', 'Too many requests. Please wait a bit and try again.')
  }
}

export function clientIp(request) {
  const fwd = request.headers.get('x-forwarded-for') || ''
  return fwd.split(',')[0].trim() || request.headers.get('x-real-ip') || 'unknown'
}
