// Input validation for /api/v1. Every route whitelists its fields — unknown
// fields are rejected, which is also how we guarantee no health information
// (or anything else unexpected) can be stored through the API.
import { badRequest } from './http'
import { isDateString } from '../core/dates'

export function rejectUnknown(body, allowed) {
  const extra = Object.keys(body || {}).filter(k => !allowed.includes(k))
  if (extra.length) throw badRequest(`Unknown field(s): ${extra.join(', ')}`, { fields: extra })
}

export function str(body, key, { max = 200, required = false } = {}) {
  const v = body[key]
  if (v === undefined) {
    if (required) throw badRequest(`${key} is required`)
    return undefined
  }
  if (v === null || v === '') {
    if (required) throw badRequest(`${key} is required`)
    return null
  }
  if (typeof v !== 'string') throw badRequest(`${key} must be text`)
  const t = v.trim()
  if (required && !t) throw badRequest(`${key} is required`)
  if (t.length > max) throw badRequest(`${key} must be at most ${max} characters`)
  return t || null
}

export function date(body, key, { required = false } = {}) {
  const v = body[key]
  if (v === undefined) {
    if (required) throw badRequest(`${key} is required`)
    return undefined
  }
  if (v === null || v === '') {
    if (required) throw badRequest(`${key} is required`)
    return null
  }
  if (!isDateString(v)) throw badRequest(`${key} must be a date like 2026-03-31`)
  return v
}

export function num(body, key, { min = 0, max = 1e12 } = {}) {
  const v = body[key]
  if (v === undefined) return undefined
  if (v === null || v === '') return null
  const n = typeof v === 'string' ? Number(v.replace(/[$,\s]/g, '')) : v
  if (typeof n !== 'number' || !Number.isFinite(n)) throw badRequest(`${key} must be a number`)
  if (n < min || n > max) throw badRequest(`${key} must be between ${min} and ${max}`)
  return Math.round(n * 100) / 100
}

export function int(body, key, { min = -1e9, max = 1e9 } = {}) {
  const v = body[key]
  if (v === undefined) return undefined
  if (!Number.isInteger(v)) throw badRequest(`${key} must be a whole number`)
  if (v < min || v > max) throw badRequest(`${key} must be between ${min} and ${max}`)
  return v
}

export function bool(body, key) {
  const v = body[key]
  if (v === undefined) return undefined
  if (typeof v !== 'boolean') throw badRequest(`${key} must be true or false`)
  return v
}

export function oneOf(body, key, values, { required = false } = {}) {
  const v = body[key]
  if (v === undefined || v === null) {
    if (required) throw badRequest(`${key} is required`)
    return undefined
  }
  if (!values.includes(v)) throw badRequest(`${key} must be one of: ${values.join(', ')}`)
  return v
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export function uuid(value, name = 'id') {
  if (typeof value !== 'string' || !UUID_RE.test(value)) throw badRequest(`${name} is not a valid id`)
  return value
}

export function email(body, key) {
  const v = str(body, key, { max: 254 })
  if (v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) throw badRequest(`${key} is not a valid email`)
  return v
}

// Drop undefined values so PATCH only updates fields that were sent.
export function compact(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined))
}
