/**
 * Shared-secret auth for LifeQuest API routes.
 */
import type { Context, Next } from 'hono';

const secret = process.env.LIFEQUEST_API_SECRET?.trim() ?? '';
const isProd = process.env.NODE_ENV === 'production';

export function requireApiSecret() {
  return async (c: Context, next: Next) => {
    if (!secret) {
      if (isProd) {
        return c.json({ error: 'Server misconfigured: LIFEQUEST_API_SECRET required' }, 503);
      }
      console.warn(
        '[lifequest-api] LIFEQUEST_API_SECRET is unset — sync and Mira routes are open in development.',
      );
      return next();
    }

    const header = c.req.header('Authorization');
    const token = header?.startsWith('Bearer ') ? header.slice(7).trim() : '';
    if (!token || token !== secret) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    return next();
  };
}
