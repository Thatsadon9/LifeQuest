/**
 * Neon Pool — WebSocket driver for local Node, HTTP fetch on Vercel serverless.
 */
import { Pool, neonConfig } from '@neondatabase/serverless';

let pool: Pool | null = null;

export function isVercelRuntime(): boolean {
  return process.env.VERCEL === '1';
}

export function configureNeonForRuntime(): void {
  if (isVercelRuntime()) {
    neonConfig.poolQueryViaFetch = true;
  }
}

export function getDatabaseUrl(): string | undefined {
  return process.env.DATABASE_URL;
}

export function getPool(): Pool {
  const url = getDatabaseUrl();
  if (!url) {
    throw new Error(
      'DATABASE_URL is required. Set it in Vercel → Project Settings → Environment Variables.',
    );
  }
  if (!pool) {
    configureNeonForRuntime();
    pool = new Pool({ connectionString: url });
  }
  return pool;
}
