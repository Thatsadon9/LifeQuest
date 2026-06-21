/**
 * Simple in-memory rate limiter (per IP + route).
 */
import type { Context, Next } from 'hono';

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

function clientIp(c: Context): string {
  return (
    c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
    c.req.header('x-real-ip') ||
    'local'
  );
}

export function rateLimit(max: number, windowMs: number) {
  return async (c: Context, next: Next) => {
    const key = `${c.req.path}:${clientIp(c)}`;
    const now = Date.now();
    const bucket = buckets.get(key);

    if (!bucket || now >= bucket.resetAt) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (bucket.count >= max) {
      const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
      c.header('Retry-After', String(retryAfter));
      return c.json({ error: 'Too many requests' }, 429);
    }

    bucket.count += 1;
    return next();
  };
}
