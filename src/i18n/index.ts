/**
 * i18n exports and translation helpers.
 */
import type { Language } from '../types';
import { en, type Dict } from './en';
import { th } from './th';

export { en, th };
export type { Dict };

const DICTS: Record<Language, Dict> = { en, th };

export function getDict(locale: Language): Dict {
  return DICTS[locale] ?? en;
}

type DictValue = string | number | boolean | null | undefined | DictValue[] | { [key: string]: DictValue };

/** Resolve a dot-path in a dictionary and interpolate `{param}` placeholders. */
export function t(
  dict: Dict,
  path: string,
  params?: Record<string, string | number>,
): string {
  const parts = path.split('.');
  let cur: DictValue = dict as unknown as DictValue;
  for (const part of parts) {
    if (cur == null || typeof cur !== 'object' || Array.isArray(cur)) return path;
    cur = (cur as Record<string, DictValue>)[part];
  }
  if (typeof cur !== 'string') return path;
  if (!params) return cur;
  return cur.replace(/\{(\w+)\}/g, (_, key: string) =>
    params[key] !== undefined ? String(params[key]) : `{${key}}`,
  );
}
