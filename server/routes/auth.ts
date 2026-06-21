/**
 * Register / login / logout / me routes.
 */
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import type { Hono } from 'hono';
import type { Pool } from '@neondatabase/serverless';
import {
  createSession,
  deleteSession,
  findUserBySessionToken,
  SESSION_COOKIE,
  sessionExpiryMs,
} from '../auth/session.ts';
import { verifyPassword, validateEmail, validatePassword } from '../auth/password.ts';
import { createUser, findUserByEmail } from '../auth/userRepo.ts';
import type { AuthVariables } from '../middleware/userAuth.ts';
import { rateLimit } from '../middleware/rateLimit.ts';

const isProd = process.env.NODE_ENV === 'production';

function setSessionCookie(c: Parameters<typeof setCookie>[0], token: string) {
  setCookie(c, SESSION_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'Lax',
    path: '/',
    maxAge: Math.floor((sessionExpiryMs() - Date.now()) / 1000),
  });
}

function clearSessionCookie(c: Parameters<typeof deleteCookie>[0]) {
  deleteCookie(c, SESSION_COOKIE, { path: '/' });
}

export function registerAuthRoutes(
  app: Hono<{ Variables: AuthVariables }>,
  pool: Pool,
) {
  app.post('/api/auth/register', rateLimit(8, 60_000), async (c) => {
    let body: { email?: string; password?: string; displayName?: string };
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'Invalid JSON body' }, 400);
    }

    const email = String(body.email ?? '').trim();
    const password = String(body.password ?? '');
    const displayName = body.displayName?.trim();

    if (!validateEmail(email)) {
      return c.json({ error: 'Invalid email address' }, 400);
    }
    const passwordError = validatePassword(password);
    if (passwordError) {
      return c.json({ error: passwordError }, 400);
    }

    const existing = await findUserByEmail(pool, email);
    if (existing) {
      return c.json({ error: 'An account with this email already exists' }, 409);
    }

    try {
      const user = await createUser(pool, email, password, displayName);
      const { token } = await createSession(pool, user.id);
      setSessionCookie(c, token);
      return c.json({
        user: { id: user.id, email: user.email, displayName: user.displayName },
      });
    } catch (err) {
      console.error('Register failed:', err);
      return c.json({ error: 'Registration failed' }, 500);
    }
  });

  app.post('/api/auth/login', rateLimit(12, 60_000), async (c) => {
    let body: { email?: string; password?: string };
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'Invalid JSON body' }, 400);
    }

    const email = String(body.email ?? '').trim();
    const password = String(body.password ?? '');

    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400);
    }

    const user = await findUserByEmail(pool, email);
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return c.json({ error: 'Invalid email or password' }, 401);
    }

    const { token } = await createSession(pool, user.id);
    setSessionCookie(c, token);
    return c.json({
      user: { id: user.id, email: user.email, displayName: user.displayName },
    });
  });

  app.post('/api/auth/logout', async (c) => {
    const token = getCookie(c, SESSION_COOKIE);
    if (token) {
      await deleteSession(pool, token);
    }
    clearSessionCookie(c);
    return c.json({ ok: true });
  });

  app.get('/api/auth/me', async (c) => {
    const token = getCookie(c, SESSION_COOKIE);
    if (!token) {
      return c.json({ user: null });
    }
    const user = await findUserBySessionToken(pool, token);
    if (!user) {
      clearSessionCookie(c);
      return c.json({ user: null });
    }
    return c.json({ user });
  });
}
