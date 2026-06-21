/**
 * Mira AI chat — reusable conversation UI (page or embedded).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { History, MessageCircle, Send } from 'lucide-react';
import { useLanguage, useT } from '../hooks';
import { checkMiraStatus, sendMiraMessage } from '../lib/mira/client';
import type { MiraChatMessage, MiraConversationTurn } from '../lib/mira/types';
import { MiraMarkdown } from './MiraMarkdown';
import { MiraThinkingBubble } from './MiraThinkingBubble';
import { NpcIdleSprite } from './NpcIdleSprite';

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function turnsToMessages(turns: MiraConversationTurn[]): MiraChatMessage[] {
  const out: MiraChatMessage[] = [];
  for (const turn of turns) {
    if (turn.role === 'user' && turn.text) {
      out.push({ id: uid(), role: 'user', text: turn.text, timestamp: Date.now() });
    }
    if (turn.role === 'model' && turn.text) {
      out.push({ id: uid(), role: 'assistant', text: turn.text, timestamp: Date.now() });
    }
  }
  return out;
}

export interface MiraChatProps {
  turns: MiraConversationTurn[];
  onTurnsChange: (turns: MiraConversationTurn[]) => void;
  className?: string;
  onToggleHistory?: () => void;
  historyOpen?: boolean;
}

function ChatBubble({ message }: { message: MiraChatMessage }) {
  const reduce = useReducedMotion();
  const isUser = message.role === 'user';

  return (
    <motion.div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
      initial={reduce ? false : { opacity: 0, y: isUser ? 6 : 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
    >
      <div
        className={`max-w-[88%] rounded-xl border-2 border-[var(--brutal-ink)] px-3 py-2 text-sm font-medium shadow-[2px_2px_0_0_var(--brutal-shadow-color)] ${
          isUser
            ? 'bg-primary text-[var(--color-on-primary)]'
            : 'bg-surface-2 text-text'
        }`}
      >
        {isUser ? message.text : <MiraMarkdown>{message.text}</MiraMarkdown>}
      </div>
    </motion.div>
  );
}

export function MiraChat({
  turns,
  onTurnsChange,
  className = '',
  onToggleHistory,
  historyOpen,
}: MiraChatProps) {
  const { t } = useT();
  const { locale } = useLanguage();
  const navigate = useNavigate();
  const [pendingUserText, setPendingUserText] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const turnsRef = useRef(turns);

  useEffect(() => {
    turnsRef.current = turns;
  }, [turns]);

  useEffect(() => {
    void checkMiraStatus().then((s) => setConfigured(s.configured));
    inputRef.current?.focus();
  }, []);

  const messages = useMemo(() => {
    const base = turnsToMessages(turns);
    if (pendingUserText) {
      base.push({
        id: 'pending-user',
        role: 'user',
        text: pendingUserText,
        timestamp: Date.now(),
      });
    }
    return base;
  }, [turns, pendingUserText]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, pendingUserText]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput('');
    setError(null);
    setPendingUserText(text);
    setLoading(true);

    try {
      const { text: reply, turns: nextTurns } = await sendMiraMessage(
        text,
        turnsRef.current,
        locale,
        { navigate: (path) => navigate(path) },
      );
      onTurnsChange(nextTurns);
      if (!reply) setError(t('mira.emptyReply'));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setPendingUserText(null);
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [input, loading, locale, navigate, onTurnsChange, t]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  }

  const showPlaceholder = messages.length === 0 && !loading;

  return (
    <div
      className={`card flex min-h-[min(72dvh,36rem)] flex-col overflow-hidden md:min-h-[calc(100dvh-11rem)] ${className}`.trim()}
    >
      <header className="flex items-center gap-2.5 border-b-2 border-[var(--brutal-ink)] bg-surface-2 px-3 py-2.5">
        <NpcIdleSprite paused={loading} size="sm" label={t('today.npc.alt')} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">{t('today.npc.name')}</p>
          <p className="text-xs font-medium text-secondary">{t('mira.chatSubtitle')}</p>
        </div>
        {onToggleHistory && (
          <button
            type="button"
            onClick={onToggleHistory}
            className="icon-btn-brutal md:hidden"
            aria-label={t('mira.history')}
            aria-expanded={historyOpen}
          >
            <History size={18} strokeWidth={2.5} />
          </button>
        )}
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto p-3 sm:p-4">
        {configured === false && (
          <p className="rounded-xl border-2 border-dashed border-warning bg-surface-2 px-3 py-2 text-xs font-medium text-secondary">
            {t('mira.notConfigured')}
          </p>
        )}

        {showPlaceholder && (
          <p className="text-center text-sm font-medium text-muted">{t('mira.placeholder')}</p>
        )}

        {messages.map((m) => (
          <ChatBubble key={m.id} message={m} />
        ))}

        {loading && <MiraThinkingBubble />}

        {error && (
          <motion.p
            className="rounded-xl border-2 border-error bg-surface-2 px-3 py-2 text-xs font-medium text-error"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {error}
          </motion.p>
        )}
        <div ref={bottomRef} />
      </div>

      <footer className="border-t-2 border-[var(--brutal-ink)] bg-surface p-3">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            rows={2}
            disabled={loading}
            placeholder={t('mira.inputPlaceholder')}
            className="focus-ring min-h-[2.75rem] flex-1 resize-none rounded-xl border-2 border-[var(--brutal-ink)] bg-surface-2 px-3 py-2 text-sm disabled:opacity-70"
          />
          <button
            type="button"
            onClick={() => void send()}
            disabled={loading || !input.trim()}
            className="btn-brutal btn-brutal-primary shrink-0 self-end px-3 py-2.5 disabled:opacity-50"
            aria-label={t('mira.send')}
          >
            <Send size={18} />
          </button>
        </div>
      </footer>
    </div>
  );
}

export interface MiraChatButtonProps {
  className?: string;
}

export function MiraChatButton({ className = '' }: MiraChatButtonProps) {
  const { t } = useT();
  return (
    <Link
      to="/mira"
      className={`btn-brutal btn-brutal-primary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold ${className}`.trim()}
    >
      <MessageCircle size={14} strokeWidth={2.5} />
      {t('mira.chat')}
    </Link>
  );
}

export default MiraChat;
