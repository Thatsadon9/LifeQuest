/**
 * Mira chat session history — persisted in localStorage.
 */
import type { MiraConversationTurn } from './types';

const SESSIONS_KEY = 'lifequest-mira-sessions';
const ACTIVE_KEY = 'lifequest-mira-active-session';
const LEGACY_TURNS_KEY = 'lifequest-mira-turns';

export interface MiraChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  turns: MiraConversationTurn[];
}

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function readSessions(): MiraChatSession[] {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as MiraChatSession[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeSessions(sessions: MiraChatSession[]): void {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

function migrateLegacySessionStorage(): MiraChatSession | null {
  try {
    const raw = sessionStorage.getItem(LEGACY_TURNS_KEY);
    if (!raw) return null;
    const turns = JSON.parse(raw) as MiraConversationTurn[];
    sessionStorage.removeItem(LEGACY_TURNS_KEY);
    if (!Array.isArray(turns) || turns.length === 0) return null;
    const now = Date.now();
    return {
      id: uid(),
      title: titleFromTurns(turns),
      createdAt: now,
      updatedAt: now,
      turns,
    };
  } catch {
    sessionStorage.removeItem(LEGACY_TURNS_KEY);
    return null;
  }
}

export function titleFromTurns(turns: MiraConversationTurn[], fallback = ''): string {
  const firstUser = turns.find((t) => t.role === 'user' && t.text?.trim());
  if (!firstUser?.text) return fallback;
  const text = firstUser.text.trim().replace(/\s+/g, ' ');
  return text.length > 42 ? `${text.slice(0, 42)}…` : text;
}

export function listMiraSessions(): MiraChatSession[] {
  let sessions = readSessions();
  if (sessions.length === 0) {
    const legacy = migrateLegacySessionStorage();
    if (legacy) {
      sessions = [legacy];
      writeSessions(sessions);
      localStorage.setItem(ACTIVE_KEY, legacy.id);
    }
  }
  return sessions.sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getActiveMiraSessionId(): string | null {
  return localStorage.getItem(ACTIVE_KEY);
}

export function setActiveMiraSessionId(id: string): void {
  localStorage.setItem(ACTIVE_KEY, id);
}

export function createMiraSession(title = ''): MiraChatSession {
  const now = Date.now();
  const session: MiraChatSession = {
    id: uid(),
    title: title || '',
    createdAt: now,
    updatedAt: now,
    turns: [],
  };
  const sessions = readSessions();
  sessions.unshift(session);
  writeSessions(sessions);
  setActiveMiraSessionId(session.id);
  return session;
}

/** Reuse an empty session instead of spawning duplicates on rapid "new chat". */
export function beginNewMiraSession(defaultTitle = ''): MiraChatSession {
  const sessions = listMiraSessions();
  const activeId = getActiveMiraSessionId();

  if (activeId) {
    const active = sessions.find((s) => s.id === activeId);
    if (active && active.turns.length === 0) return active;
  }

  const existingEmpty = sessions.find((s) => s.turns.length === 0);
  if (existingEmpty) {
    setActiveMiraSessionId(existingEmpty.id);
    return existingEmpty;
  }

  return createMiraSession(defaultTitle);
}

export function ensureActiveMiraSession(defaultTitle = ''): MiraChatSession {
  const sessions = listMiraSessions();
  const activeId = getActiveMiraSessionId();
  const existing = activeId ? sessions.find((s) => s.id === activeId) : undefined;
  if (existing) return existing;
  if (sessions.length > 0) {
    setActiveMiraSessionId(sessions[0].id);
    return sessions[0];
  }
  return createMiraSession(defaultTitle);
}

export function updateMiraSessionTurns(
  id: string,
  turns: MiraConversationTurn[],
  defaultTitle = '',
): MiraChatSession | null {
  const sessions = readSessions();
  const index = sessions.findIndex((s) => s.id === id);
  if (index < 0) return null;

  const now = Date.now();
  const title = titleFromTurns(turns, sessions[index].title || defaultTitle);
  const updated: MiraChatSession = {
    ...sessions[index],
    title,
    turns,
    updatedAt: now,
  };
  sessions[index] = updated;
  writeSessions(sessions);
  return updated;
}

export function deleteMiraSession(id: string): string | null {
  const sessions = readSessions().filter((s) => s.id !== id);
  writeSessions(sessions);
  const activeId = getActiveMiraSessionId();
  if (activeId !== id) return activeId;

  if (sessions.length === 0) {
    localStorage.removeItem(ACTIVE_KEY);
    return null;
  }
  setActiveMiraSessionId(sessions[0].id);
  return sessions[0].id;
}
