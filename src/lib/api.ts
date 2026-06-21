/**
 * Shared headers for LifeQuest API requests (sync + Mira).
 */
export function apiHeaders(json = true): HeadersInit {
  const headers: Record<string, string> = {};
  if (json) headers['Content-Type'] = 'application/json';
  const secret = import.meta.env.VITE_LIFEQUEST_API_SECRET as string | undefined;
  if (secret?.trim()) headers.Authorization = `Bearer ${secret.trim()}`;
  return headers;
}
