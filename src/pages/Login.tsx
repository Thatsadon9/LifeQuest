/**
 * Login / register — session cookie auth.
 */
import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { LogIn, UserPlus } from 'lucide-react';
import { useAuth, useT } from '../hooks';

type Mode = 'login' | 'register';

export default function Login() {
  const { t } = useT();
  const { user, loading, login, register, error } = useAuth();
  const location = useLocation();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const from = (location.state as { from?: string } | null)?.from ?? '/';

  if (!loading && user) {
    return <Navigate to={from} replace />;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      if (mode === 'login') {
        await login(email.trim(), password);
      } else {
        await register(email.trim(), password, displayName.trim() || undefined);
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-surface px-4 py-8 pt-safe pb-safe">
      <div className="card w-full max-w-md overflow-hidden p-0">
        <div className="border-b-[2.5px] border-[var(--brutal-ink)] bg-primary px-6 py-5 text-[var(--color-on-primary)]">
          <div className="flex items-center gap-3">
            <img
              src="/favicon-32x32.png"
              alt=""
              className="h-10 w-10 rounded-[var(--radius-brutal)] border-2 border-[var(--brutal-ink)]"
              width={40}
              height={40}
            />
            <div>
              <h1 className="text-xl font-bold tracking-tight">LifeQuest</h1>
              <p className="text-sm opacity-90">{t('auth.subtitle')}</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-5 flex gap-2">
            <button
              type="button"
              className={`btn-brutal flex-1 py-2 text-sm ${mode === 'login' ? 'btn-brutal-primary' : 'btn-brutal-ghost'}`}
              onClick={() => setMode('login')}
            >
              <LogIn size={16} />
              {t('auth.loginTab')}
            </button>
            <button
              type="button"
              className={`btn-brutal flex-1 py-2 text-sm ${mode === 'register' ? 'btn-brutal-primary' : 'btn-brutal-ghost'}`}
              onClick={() => setMode('register')}
            >
              <UserPlus size={16} />
              {t('auth.registerTab')}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <label className="block space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wide text-secondary">
                  {t('auth.displayName')}
                </span>
                <input
                  type="text"
                  className="input-brutal w-full"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={t('auth.displayNamePlaceholder')}
                  autoComplete="name"
                />
              </label>
            )}

            <label className="block space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wide text-secondary">
                {t('auth.email')}
              </span>
              <input
                type="email"
                required
                className="input-brutal w-full"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wide text-secondary">
                {t('auth.password')}
              </span>
              <input
                type="password"
                required
                minLength={8}
                className="input-brutal w-full"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
              {mode === 'register' && (
                <p className="text-xs text-secondary">{t('auth.passwordHint')}</p>
              )}
            </label>

            {(formError || error) && (
              <p className="text-sm font-medium text-danger" role="alert">
                {formError ?? error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting || loading}
              className="btn-brutal btn-brutal-primary w-full py-3 text-sm"
            >
              {submitting
                ? t('auth.submitting')
                : mode === 'login'
                  ? t('auth.loginSubmit')
                  : t('auth.registerSubmit')}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-secondary">{t('auth.sessionHint')}</p>
        </div>
      </div>
    </div>
  );
}
