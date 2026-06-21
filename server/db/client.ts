/**
 * Neon Postgres client for LifeQuest server-side code.
 *
 * Do NOT import this from React pages — credentials must stay on the server.
 */
import { neon, neonConfig } from '@neondatabase/serverless';

neonConfig.fetchConnectionCache = true;

function requireDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'DATABASE_URL is not set. Copy .env.example to .env and add your Neon connection string.',
    );
  }
  return url;
}

/** Tagged-template SQL executor backed by Neon serverless driver. */
export function sql() {
  return neon(requireDatabaseUrl());
}

/** Run a plain SQL string (one statement). */
export async function query<T = Record<string, unknown>>(
  statement: string,
): Promise<T[]> {
  const run = neon(requireDatabaseUrl());
  return run(statement) as Promise<T[]>;
}
