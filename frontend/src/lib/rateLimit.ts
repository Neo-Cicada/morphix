/**
 * In-memory sliding-window rate limiter, keyed by arbitrary string (e.g. userId).
 *
 * NOTE: This is per-process. On serverless (Vercel) warm instances do not share state,
 * so the effective limit across many concurrent instances is limit × instance_count.
 * For a hard global limit at scale, swap the Map for Upstash Redis + @upstash/ratelimit.
 */

interface Entry {
  count: number
  resetAt: number
}

const store = new Map<string, Entry>()

// Clean expired entries once per minute to prevent unbounded memory growth.
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (now >= entry.resetAt) store.delete(key)
  }
}, 60_000).unref?.()

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now >= entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs }
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count++
  return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt }
}

export function rateLimitResponse(resetAt: number): Response {
  const retryAfter = Math.ceil((resetAt - Date.now()) / 1000)
  return new Response('Too Many Requests', {
    status: 429,
    headers: {
      'Retry-After': String(retryAfter),
      'X-RateLimit-Reset': String(Math.ceil(resetAt / 1000)),
    },
  })
}
