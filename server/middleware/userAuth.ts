/**
 * Require a valid session cookie and attach the user to the Hono context.
 */
import { getCookie } from 'hono/cookie';
import type { Context, Next } from 'hono';
import type { Pool } from '@neondatabase/serverless';
import { findUserBySessionToken, SESSION_COOKIE } from '../auth/session.ts';

export type AuthVariables = {
  userId: string;
  userEmail: string;
  userDisplayName: string;
};

export function requireUser(pool: Pool) {
  return async (c: Context<{ Variables: AuthVariables }>, next: Next) => {
    const token = getCookie(c, SESSION_COOKIE);
    if (!token) {
      return c.json({ error: 'Unauthorized', code: 'no_session' }, 401);
    }
    const user = await findUserBySessionToken(pool, token);
    if (!user) {
      return c.json({ error: 'Unauthorized', code: 'invalid_session' }, 401);
    }
    c.set('userId', user.id);
    c.set('userEmail', user.email);
    c.set('userDisplayName', user.displayName);
    await next();
  };
}
