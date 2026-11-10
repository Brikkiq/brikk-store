// The browser's only way to read or write app data: calls /api/v1 with the
// signed-in user's token. Pages must not query Supabase tables directly.
'use client'
import { supabase } from '../supabase'

export class ApiError extends Error {
  constructor(status, code, message) {
    super(message)
    this.status = status
    this.code = code
  }
}

async function request(method, path, body) {
  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch(`/api/v1${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: 'no-store',
  })
  let json = null
  try { json = await res.json() } catch {}
  if (!res.ok) {
    if (res.status === 401 && typeof window !== 'undefined') window.location.href = '/login'
    if (res.status === 402 && typeof window !== 'undefined' && !window.location.pathname.startsWith('/app/upgrade')) {
      window.location.href = '/app/upgrade'
    }
    throw new ApiError(res.status, json?.error?.code || 'error', json?.error?.message || 'Something went wrong')
  }
  return json?.data
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body = {}) => request('POST', path, body),
  patch: (path, body) => request('PATCH', path, body),
  put: (path, body) => request('PUT', path, body),
  del: (path) => request('DELETE', path),
}
