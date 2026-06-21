/**
 * Mira AI chat page — full-screen conversation with session history.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { MiraChat } from '../components/MiraChat';
import { MiraPageSkeleton, SkeletonScreen } from '../components/skeleton';
import { useProfile, useT } from '../hooks';
import {
  beginNewMiraSession,
  deleteMiraSession,
  ensureActiveMiraSession,
  getActiveMiraSessionId,
  listMiraSessions,
  setActiveMiraSessionId,
  updateMiraSessionTurns,
} from '../lib/mira/history';
import type { MiraConversationTurn } from '../lib/mira/types';

const NEW_CHAT_COOLDOWN_MS = 700;

export default function Mira() {
  const { t } = useT();
  const profile = useProfile();
  const defaultTitle = t('mira.defaultTitle');
  const [sessions, setSessions] = useState(() => listMiraSessions());
  const [activeId, setActiveId] = useState(() => {
    const id = getActiveMiraSessionId();
    if (id && sessions.some((s) => s.id === id)) return id;
    return ensureActiveMiraSession(defaultTitle).id;
  });
  const [historyOpen, setHistoryOpen] = useState(false);
  const lastNewChatAt = useRef(0);

  useEffect(() => {
    if (sessions.some((s) => s.id === activeId)) return;
    const session = ensureActiveMiraSession(defaultTitle);
    setActiveId(session.id);
    setSessions(listMiraSessions());
  }, [sessions, activeId, defaultTitle]);

  const activeSession = useMemo(
    () => sessions.find((s) => s.id === activeId) ?? sessions[0],
    [sessions, activeId],
  );

  const refresh = useCallback(() => {
    setSessions(listMiraSessions());
  }, []);

  const selectSession = useCallback((id: string) => {
    setActiveMiraSessionId(id);
    setActiveId(id);
    setHistoryOpen(false);
  }, []);

  const startNewChat = useCallback(() => {
    const now = Date.now();
    if (now - lastNewChatAt.current < NEW_CHAT_COOLDOWN_MS) return;
    lastNewChatAt.current = now;

    const session = beginNewMiraSession(defaultTitle);
    refresh();
    setActiveId(session.id);
    setHistoryOpen(false);
  }, [defaultTitle, refresh]);

  const removeSession = useCallback(
    (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const nextId = deleteMiraSession(id);
      refresh();
      if (nextId) {
        setActiveId(nextId);
      } else {
        const session = beginNewMiraSession(defaultTitle);
        setActiveId(session.id);
        refresh();
      }
    },
    [defaultTitle, refresh],
  );

  const handleTurnsChange = useCallback(
    (turns: MiraConversationTurn[]) => {
      updateMiraSessionTurns(activeId, turns, defaultTitle);
      refresh();
    },
    [activeId, defaultTitle, refresh],
  );

  function sessionLabel(title: string): string {
    return title.trim() || defaultTitle;
  }

  if (profile === undefined) {
    return (
      <SkeletonScreen label={t('common.loading')}>
        <MiraPageSkeleton />
      </SkeletonScreen>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight">{t('mira.pageTitle')}</h1>
        <p className="mt-0.5 text-sm font-medium text-secondary">{t('mira.pageSubtitle')}</p>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-stretch">
        <aside
          className={`card flex flex-col overflow-hidden md:w-56 md:shrink-0 ${
            historyOpen ? 'block' : 'hidden md:flex'
          }`}
        >
          <div className="flex items-center justify-between gap-2 border-b-2 border-[var(--brutal-ink)] bg-surface-2 px-3 py-2">
            <p className="text-xs font-bold uppercase tracking-wide text-primary-soft">
              {t('mira.history')}
            </p>
            <button
              type="button"
              onClick={startNewChat}
              className="btn-brutal inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold"
            >
              <Plus size={12} strokeWidth={2.5} />
              {t('mira.newChat')}
            </button>
          </div>

          <div className="max-h-48 flex-1 overflow-y-auto p-2 md:max-h-none">
            {sessions.length === 0 ? (
              <p className="px-2 py-3 text-center text-xs font-medium text-muted">
                {t('mira.noHistory')}
              </p>
            ) : (
              <ul className="space-y-1">
                {sessions.map((session) => {
                  const isActive = session.id === activeId;
                  return (
                    <li key={session.id}>
                      <div
                        className={`group flex w-full items-center gap-1 rounded-lg border-2 transition-colors ${
                          isActive
                            ? 'border-[var(--brutal-ink)] bg-primary text-[var(--color-on-primary)] shadow-[2px_2px_0_0_var(--brutal-shadow-color)]'
                            : 'border-transparent bg-surface-2 text-secondary hover:border-[var(--brutal-ink)]'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => selectSession(session.id)}
                          className="min-w-0 flex-1 truncate px-2.5 py-2 text-left text-xs font-semibold"
                        >
                          {sessionLabel(session.title)}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => removeSession(session.id, e)}
                          className={`shrink-0 rounded p-1.5 opacity-60 transition-opacity hover:opacity-100 ${
                            isActive ? 'hover:bg-black/10' : 'hover:bg-surface'
                          }`}
                          aria-label={t('mira.deleteChat')}
                        >
                          <Trash2 size={12} strokeWidth={2.5} />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>

        <MiraChat
          key={activeId}
          turns={activeSession.turns}
          onTurnsChange={handleTurnsChange}
          className="min-w-0 flex-1"
          onToggleHistory={() => setHistoryOpen((v) => !v)}
          historyOpen={historyOpen}
        />
      </div>
    </div>
  );
}
