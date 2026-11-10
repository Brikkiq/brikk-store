// JSON response helpers for /api/v1 routes. Server-only.
import { NextResponse } from 'next/server'

export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
  }
}

export const badRequest = (message, details) => new ApiError(400, 'bad_request', message, details)
export const notFound = (what = 'Not found') => new ApiError(404, 'not_found', what)

export function ok(data, status = 200) {
  return NextResponse.json({ data }, { status, headers: { 'Cache-Control': 'no-store' } })
}

export function fail(status, code, message, details) {
  const body = { error: { code, message } }
  if (details) body.error.details = details
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
}

// Wraps a route handler: converts thrown ApiErrors into JSON errors and hides
// unexpected errors behind a generic 500 (details go to the server log only).
export function handle(fn) {
  return async (request, ctx) => {
    try {
      return await fn(request, ctx)
    } catch (err) {
      if (err instanceof ApiError) return fail(err.status, err.code, err.message, err.details)
      console.error('[api] unexpected error:', err?.message || err)
      return fail(500, 'server_error', 'Something went wrong. Please try again.')
    }
  }
}

export async function readJson(request) {
  const text = await request.text()
  if (text.length > 100_000) throw badRequest('Request body too large')
  if (!text) return {}
  try {
    const v = JSON.parse(text)
    if (!v || typeof v !== 'object' || Array.isArray(v)) throw new Error()
    return v
  } catch {
    throw badRequest('Body must be a JSON object')
  }
}

// Throw a 500-style error from a Supabase result if it failed.
export function check(result, what = 'Database error') {
  if (result?.error) {
    console.error(`[api] ${what}:`, result.error.message)
    throw new ApiError(500, 'db_error', what)
  }
  return result.data
}
