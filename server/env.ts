import { existsSync, readFileSync } from 'node:fs';

/** Load `.env` into process.env when running locally (no-op on Vercel). */
export function loadEnv(path: string): void {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

export function getAllowedOrigins(): string[] {
  const fromEnv =
    process.env.CORS_ORIGINS?.split(',').map((o) => o.trim()).filter(Boolean) ?? [];
  const defaults = [
    'http://localhost:5173',
    'http://localhost:4173',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:4173',
  ];
  const vercel: string[] = [];
  if (process.env.VERCEL_URL) vercel.push(`https://${process.env.VERCEL_URL}`);
  if (process.env.VERCEL_BRANCH_URL) {
    vercel.push(`https://${process.env.VERCEL_BRANCH_URL}`);
  }
  return [...new Set([...defaults, ...fromEnv, ...vercel])];
}
