/**
 * API base URL and fetch helpers (session cookies).
 */
const API_BASE = import.meta.env.VITE_SYNC_API_URL ?? '/api';

export function apiUrl(path: string): string {
  const normalized = path.startsWith('/api') ? path.slice(4) : path;
  return `${API_BASE}${normalized.startsWith('/') ? normalized : `/${normalized}`}`;
}

export function apiInit(init: RequestInit = {}): RequestInit {
  return { ...init, credentials: 'include' };
}

export function apiHeaders(json = true): HeadersInit {
  const headers: Record<string, string> = {};
  if (json) headers['Content-Type'] = 'application/json';
  return headers;
}
