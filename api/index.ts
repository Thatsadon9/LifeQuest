/**
 * Vercel serverless entry — serves /api/* on the same origin as the PWA.
 */
import { handle } from 'hono/vercel';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import { createApp } from '../server/app.ts';

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required on Vercel (Project → Settings → Environment Variables).');
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const app = createApp(pool);

export default handle(app);

export const config = {
  runtime: 'nodejs',
  maxDuration: 30,
};
