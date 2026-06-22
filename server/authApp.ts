/**
 * Minimal Hono app for auth routes only (small Vercel serverless bundle).
 */
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Pool } from '@neondatabase/serverless';
import { getAllowedOrigins } from './env.ts';
import { registerAuthRoutes } from './routes/auth.ts';
import type { AuthVariables } from './middleware/userAuth.ts';

export function createAuthApp(pool: Pool): Hono<{ Variables: AuthVariables }> {
  const app = new Hono<{ Variables: AuthVariables }>();
  const allowedOrigins = getAllowedOrigins();

  app.use(
    '*',
    cors({
      origin: (origin) => {
        if (!origin) return allowedOrigins[0];
        return allowedOrigins.includes(origin) ? origin : '';
      },
      allowMethods: ['GET', 'POST', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    }),
  );

  registerAuthRoutes(app, pool);

  app.get('/api/health', (c) =>
    c.json({ ok: true, service: 'lifequest-api', auth: true }),
  );

  return app;
}
