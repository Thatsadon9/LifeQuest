/**
 * User registration and lookup.
 */
import type { Pool } from '@neondatabase/serverless';
import { hashPassword } from './password.ts';

export interface DbUser {
  id: string;
  email: string;
  displayName: string;
  createdAt: number;
}

function rowToUser(row: Record<string, unknown>): DbUser {
  return {
    id: String(row.id),
    email: String(row.email),
    displayName: String(row.display_name ?? ''),
    createdAt: Number(row.created_at),
  };
}

export async function findUserByEmail(
  pool: Pool,
  email: string,
): Promise<(DbUser & { passwordHash: string }) | null> {
  const result = await pool.query(
    `SELECT id, email, display_name, password_hash, created_at
     FROM users WHERE lower(email) = lower($1)`,
    [email.trim()],
  );
  const row = result.rows[0] as Record<string, unknown> | undefined;
  if (!row) return null;
  return {
    ...rowToUser(row),
    passwordHash: String(row.password_hash),
  };
}

export async function createUser(
  pool: Pool,
  email: string,
  password: string,
  displayName?: string,
): Promise<DbUser> {
  const normalized = email.trim().toLowerCase();
  const passwordHash = await hashPassword(password);
  const now = Date.now();
  const name = (displayName?.trim() || normalized.split('@')[0] || 'Hero').slice(0, 80);
  const result = await pool.query(
    `INSERT INTO users (email, password_hash, display_name, created_at)
     VALUES ($1, $2, $3, $4)
     RETURNING id, email, display_name, created_at`,
    [normalized, passwordHash, name, now],
  );
  return rowToUser(result.rows[0] as Record<string, unknown>);
}

export async function findUserById(pool: Pool, id: string): Promise<DbUser | null> {
  const result = await pool.query(
    `SELECT id, email, display_name, created_at FROM users WHERE id = $1`,
    [id],
  );
  const row = result.rows[0] as Record<string, unknown> | undefined;
  return row ? rowToUser(row) : null;
}
