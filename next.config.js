/** @type {import('next').NextConfig} */

// Security headers on every response.
// - frame-ancestors / X-Frame-Options: nobody can embed the app in an iframe (clickjacking).
// - nosniff: browsers must trust our Content-Type.
// - Referrer-Policy: don't leak full URLs (which can contain ids) to other sites.
// - Permissions-Policy: the app needs none of these device features.
// - HSTS: always HTTPS.
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Content-Security-Policy', value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'" },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(self)' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
]

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
}

module.exports = nextConfig
