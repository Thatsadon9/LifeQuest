/**
 * Session tokens — stored hashed in Postgres, sent as httpOnly cookie.
 */
import { createHash, randomBytes } from 'node:crypto';
import type { Pool } from '@neondatabase/serverless';

const SESSION_COOKIE = 'lq_session';
const SESSION_DAYS = Number(process.env.SESSION_DAYS ?? 30);

export { SESSION_COOKIE };

export function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function createSessionToken(): string {
  return randomBytes(32).toString('base64url');
}

export function sessionExpiryMs(): number {
  return Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
}

export interface SessionUser {
  id: string;
  email: string;
  displayName: string;
}

export async function createSession(
  pool: Pool,
  userId: string,
): Promise<{ token: string; expiresAt: number }> {
  const token = createSessionToken();
  const tokenHash = hashSessionToken(token);
  const now = Date.now();
  const expiresAt = sessionExpiryMs();
  await pool.query(
    `INSERT INTO sessions (token_hash, user_id, expires_at, created_at)
     VALUES ($1, $2, $3, $4)`,
    [tokenHash, userId, expiresAt, now],
  );
  return { token, expiresAt };
}

export async function deleteSession(pool: Pool, token: string): Promise<void> {
  await pool.query(`DELETE FROM sessions WHERE token_hash = $1`, [
    hashSessionToken(token),
  ]);
}

export async function deleteExpiredSessions(pool: Pool): Promise<void> {
  await pool.query(`DELETE FROM sessions WHERE expires_at < $1`, [Date.now()]);
}

export async function findUserBySessionToken(
  pool: Pool,
  token: string,
): Promise<SessionUser | null> {
  const result = await pool.query(
    `SELECT u.id, u.email, u.display_name
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = $1 AND s.expires_at > $2`,
    [hashSessionToken(token), Date.now()],
  );
  const row = result.rows[0] as Record<string, unknown> | undefined;
  if (!row) return null;
  return {
    id: String(row.id),
    email: String(row.email),
    displayName: String(row.display_name ?? ''),
  };
}
