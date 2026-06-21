/**
 * Settings — make LifeQuest yours: profile name, theme, JSON backup/restore,
 * a fresh-start reset, and a (placeholder) reminder preference.
 *
 * All writes route through the foundation actions; reads use the live hooks.
 */
import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import {
  Bell,
  Check,
  ChevronRight,
  Cloud,
  Database,
  Download,
  Languages,
  Loader2,
  LogOut,
  MessageCircle,
  Moon,
  Palette,
  RotateCcw,
  ScrollText,
  Sun,
  Upload,
  UserRound,
} from 'lucide-react';
import { ConfirmDialog } from '../components';
import { SettingsPageSkeleton, SkeletonScreen } from '../components/skeleton';
import { useAuth, useLanguage, useProfile, useSyncStatus, useTheme, useToast, useT } from '../hooks';
import { checkMiraStatus } from '../lib/mira/client';
import {
  exportData,
  importData,
  resetData,
  setProfileName,
} from '../lib/actions';
import { todayKey } from '../lib/date';
import { getUserItem, setUserItem } from '../lib/auth/userStorage';
import type { Language, Theme } from '../types';

const NOTIFY_KEY = 'lifequest-notifications';

const THEME_OPTIONS: { key: Theme; labelKey: 'dark' | 'light'; Icon: LucideIcon }[] = [
  { key: 'dark', labelKey: 'dark', Icon: Moon },
  { key: 'light', labelKey: 'light', Icon: Sun },
];

const LANGUAGE_OPTIONS: { key: Language; labelKey: 'en' | 'th' }[] = [
  { key: 'en', labelKey: 'en' },
  { key: 'th', labelKey: 'th' },
];

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

/* -------------------------------------------------------------------------- */

function SettingCard({
  icon: Icon,
  accent,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  accent: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <motion.section variants={itemVariants} className="card p-5">
      <header className="flex items-start gap-3">
        <span
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
          style={{
            color: accent,
            backgroundColor: `color-mix(in oklab, ${accent} 16%, transparent)`,
          }}
        >
          <Icon size={18} />
        </span>
        <div className="min-w-0">
          <h2 className="font-semibold leading-tight">{title}</h2>
          <p className="mt-0.5 text-sm text-muted">{description}</p>
        </div>
      </header>
      <div className="mt-4">{children}</div>
    </motion.section>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="focus-ring relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors"
      style={{
        backgroundColor: checked ? 'var(--color-primary)' : 'var(--color-surface-2)',
      }}
    >
      <motion.span
        className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow"
        animate={{ x: checked ? 20 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 34 }}
      />
    </button>
  );
}

/* -------------------------------------------------------------------------- */

export function Settings() {
  const profile = useProfile();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { locale, setLanguage } = useLanguage();
  const { toast } = useToast();
  const { t } = useT();
  const { status: syncStatus, lastSyncedAt, error: syncError, sync } = useSyncStatus();
  const [syncingManual, setSyncingManual] = useState(false);
  const [miraAi, setMiraAi] = useState<{ configured: boolean; model: string } | null>(null);

  useEffect(() => {
    void checkMiraStatus().then(setMiraAi);
  }, []);

  const [name, setName] = useState('');
  const [savingName, setSavingName] = useState(false);
  useEffect(() => {
    if (profile) setName(profile.name);
  }, [profile?.name]); // eslint-disable-line react-hooks/exhaustive-deps

  const [notify, setNotify] = useState(false);
  useEffect(() => {
    if (user?.id) {
      setNotify(getUserItem(NOTIFY_KEY, user.id) === '1');
    }
  }, [user?.id]);

  const [exporting, setExporting] = useState(false);
  const [dialog, setDialog] = useState<'import' | 'reset' | 'logout' | null>(null);
  const [pendingImport, setPendingImport] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const trimmed = name.trim();
  const nameDirty = !!profile && !!trimmed && trimmed !== profile.name;

  async function handleManualSync() {
    if (syncingManual || syncStatus === 'syncing') return;
    setSyncingManual(true);
    try {
      const result = await sync();
      if (result === 'ok') {
        toast({
          title: t('settings.cloudSync.synced'),
          message: t('settings.cloudSync.syncedMessage'),
          variant: 'success',
        });
      } else if (result === 'offline') {
        toast({
          title: t('settings.cloudSync.statusOffline'),
          variant: 'warning',
        });
      } else {
        toast({
          title: t('settings.cloudSync.syncFailed'),
          message: syncError ?? undefined,
          variant: 'danger',
        });
      }
    } finally {
      setSyncingManual(false);
    }
  }

  function formatSyncedAt(ts: number | null): string {
    if (!ts) return t('settings.cloudSync.neverSynced');
    return t('settings.cloudSync.lastSynced', {
      time: new Date(ts).toLocaleString(),
    });
  }

  const syncBusy = syncingManual || syncStatus === 'syncing';
  const miraStatusLabel =
    miraAi === null
      ? '…'
      : miraAi.configured
        ? t('settings.mira.statusReady', { model: miraAi.model })
        : t('settings.mira.statusMissing');
  const syncStatusLabel =
    syncStatus === 'offline'
      ? t('settings.cloudSync.statusOffline')
      : syncStatus === 'error'
        ? t('settings.cloudSync.statusError')
        : syncStatus === 'ok'
          ? t('settings.cloudSync.statusOk')
          : formatSyncedAt(lastSyncedAt);

  async function handleSaveName() {
    if (!nameDirty || savingName) return;
    setSavingName(true);
    try {
      await setProfileName(trimmed);
      toast({ title: t('settings.nameSaved'), message: t('settings.nameSavedMessage', { name: trimmed }), variant: 'success' });
    } catch {
      toast({
        title: t('settings.nameSaveFailed'),
        message: t('settings.nameSaveFailedMessage'),
        variant: 'warning',
      });
    } finally {
      setSavingName(false);
    }
  }

  function handleNotifyChange(next: boolean) {
    setNotify(next);
    if (user?.id) setUserItem(NOTIFY_KEY, next ? '1' : '0', user.id);
    toast({
      title: next ? t('settings.notifications.on') : t('settings.notifications.off'),
      message: t('settings.notifications.saved'),
      variant: 'info',
    });
  }

  async function handleExport() {
    if (exporting) return;
    setExporting(true);
    try {
      const json = await exportData();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `lifequest-backup-${todayKey()}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      toast({
        title: t('settings.backup.downloaded'),
        message: t('settings.backup.downloadedMessage'),
        variant: 'success',
      });
    } catch {
      toast({
        title: t('settings.backup.exportFailed'),
        message: t('settings.backup.exportFailedMessage'),
        variant: 'warning',
      });
    } finally {
      setExporting(false);
    }
  }

  async function handleFilePicked(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      setPendingImport(text);
      setDialog('import');
    } catch {
      toast({
        title: t('settings.backup.readFailed'),
        message: t('settings.backup.readFailedMessage'),
        variant: 'warning',
      });
    }
  }

  async function confirmImport() {
    if (pendingImport == null) return;
    setDialog(null);
    try {
      await importData(pendingImport);
      toast({
        title: t('settings.backup.restored'),
        message: t('settings.backup.restoredMessage'),
        variant: 'success',
      });
    } catch (err) {
      toast({
        title: t('settings.backup.importFailed'),
        message:
          err instanceof Error
            ? err.message
            : t('settings.backup.readFailedMessage'),
        variant: 'warning',
      });
    } finally {
      setPendingImport(null);
    }
  }

  async function confirmReset() {
    setDialog(null);
    try {
      await resetData();
      toast({
        title: t('settings.reset.freshStart'),
        message: t('settings.reset.freshStartMessage'),
        variant: 'success',
      });
    } catch {
      toast({
        title: t('settings.reset.resetFailed'),
        message: t('settings.reset.resetFailedMessage'),
        variant: 'warning',
      });
    }
  }

  async function confirmLogout() {
    setDialog(null);
    try {
      await logout();
    } finally {
      navigate('/login', { replace: true });
    }
  }

  if (profile === undefined) {
    return (
      <SkeletonScreen label={t('common.loading')}>
        <SettingsPageSkeleton />
      </SkeletonScreen>
    );
  }

  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">{t('settings.title')}</h1>
        <p className="text-sm text-muted">{t('settings.subtitle')}</p>
      </header>

      <motion.div
        className="space-y-4"
        variants={listVariants}
        initial="hidden"
        animate="show"
      >
        {/* Account -------------------------------------------------------- */}
        {user && (
          <SettingCard
            icon={LogOut}
            accent="var(--color-wis)"
            title={t('auth.accountTitle')}
            description={t('auth.signedInAs', { email: user.email })}
          >
            <button
              type="button"
              onClick={() => setDialog('logout')}
              className="btn-brutal btn-brutal-ghost px-4 py-2.5 text-sm"
            >
              <LogOut size={16} />
              {t('auth.logout')}
            </button>
          </SettingCard>
        )}

        {/* Profile -------------------------------------------------------- */}
        <SettingCard
          icon={UserRound}
          accent="var(--color-primary)"
          title={t('settings.heroName.title')}
          description={t('settings.heroName.description')}
        >
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleSaveName();
              }}
              maxLength={40}
              placeholder={t('settings.heroName.placeholder')}
              aria-label={t('settings.heroName.ariaLabel')}
              disabled={!profile}
              className="input-brutal disabled:opacity-60"
            />
            <button
              type="button"
              onClick={handleSaveName}
              disabled={!nameDirty || savingName}
              className="btn-brutal btn-brutal-primary shrink-0 px-4 py-2.5 text-sm disabled:opacity-40"
            >
              {savingName ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              {t('common.save')}
            </button>
          </div>
        </SettingCard>

        <SettingCard
          icon={ScrollText}
          accent="var(--color-hero)"
          title={t('settings.quests.title')}
          description={t('settings.quests.description')}
        >
          <Link
            to="/quests"
            className="btn-brutal btn-brutal-primary inline-flex w-full items-center justify-center gap-2 px-4 py-2.5 text-sm sm:w-auto"
          >
            {t('settings.quests.open')}
            <ChevronRight size={16} strokeWidth={2.5} />
          </Link>
        </SettingCard>

        <SettingCard
          icon={Palette}
          accent="var(--color-cha)"
          title={t('settings.appearance.title')}
          description={t('settings.appearance.description')}
        >
          <div className="segment-brutal grid-cols-2">
            {THEME_OPTIONS.map(({ key, labelKey, Icon }) => {
              const selected = theme === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTheme(key)}
                  aria-pressed={selected}
                  data-active={selected ? 'true' : 'false'}
                  className="segment-brutal-item focus-ring inline-flex items-center justify-center gap-2 py-2.5 text-sm"
                >
                  <Icon size={16} strokeWidth={2.5} />
                  {t(`settings.appearance.${labelKey}`)}
                </button>
              );
            })}
          </div>
        </SettingCard>

        <SettingCard
          icon={Languages}
          accent="var(--color-int)"
          title={t('settings.language.title')}
          description={t('settings.language.description')}
        >
          <div className="segment-brutal grid-cols-2">
            {LANGUAGE_OPTIONS.map(({ key, labelKey }) => {
              const selected = locale === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setLanguage(key)}
                  aria-pressed={selected}
                  data-active={selected ? 'true' : 'false'}
                  className="segment-brutal-item focus-ring inline-flex items-center justify-center gap-2 py-2.5 text-sm"
                >
                  {t(`settings.language.${labelKey}`)}
                </button>
              );
            })}
          </div>
        </SettingCard>

        <SettingCard
          icon={Cloud}
          accent="var(--color-primary)"
          title={t('settings.cloudSync.title')}
          description={t('settings.cloudSync.description')}
        >
          <div className="space-y-3">
            <p className="text-sm font-semibold text-secondary">{syncStatusLabel}</p>
            <button
              type="button"
              onClick={() => void handleManualSync()}
              disabled={syncBusy}
              className="btn-brutal btn-brutal-primary inline-flex items-center gap-2 px-4 py-2.5 text-sm disabled:opacity-60"
            >
              {syncBusy ? <Loader2 size={16} className="animate-spin" /> : <Cloud size={16} />}
              {syncBusy ? t('settings.cloudSync.syncing') : t('settings.cloudSync.syncNow')}
            </button>
          </div>
        </SettingCard>

        <SettingCard
          icon={MessageCircle}
          accent="var(--color-cha)"
          title={t('settings.mira.title')}
          description={t('settings.mira.description')}
        >
          <div className="space-y-2">
            <p className="text-sm font-semibold text-secondary">{miraStatusLabel}</p>
            <p className="text-xs font-medium text-muted">{t('settings.mira.hint')}</p>
          </div>
        </SettingCard>

        <SettingCard
          icon={Bell}
          accent="var(--color-warning)"
          title={t('settings.notifications.title')}
          description={t('settings.notifications.description')}
        >
          <div className="surface-2 flex items-center justify-between gap-4 p-3.5">
            <p className="text-sm text-muted">{t('settings.notifications.hint')}</p>
            <Toggle
              checked={notify}
              onChange={handleNotifyChange}
              label={t('settings.notifications.toggle')}
            />
          </div>
        </SettingCard>

        <SettingCard
          icon={Database}
          accent="var(--color-int)"
          title={t('settings.backup.title')}
          description={t('settings.backup.description')}
        >
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            onChange={handleFilePicked}
            className="hidden"
          />
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting}
              className="btn-brutal btn-brutal-ghost flex-1 px-4 py-2.5 text-sm disabled:opacity-60"
            >
              {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              {t('settings.backup.export')}
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="btn-brutal btn-brutal-ghost flex-1 px-4 py-2.5 text-sm"
            >
              <Upload size={16} />
              {t('settings.backup.import')}
            </button>
          </div>
        </SettingCard>

        <SettingCard
          icon={RotateCcw}
          accent="var(--color-danger)"
          title={t('settings.reset.title')}
          description={t('settings.reset.description')}
        >
          <button
            type="button"
            onClick={() => setDialog('reset')}
            className="btn-brutal btn-brutal-danger px-4 py-2.5 text-sm"
          >
            <RotateCcw size={16} />
            {t('settings.reset.button')}
          </button>
        </SettingCard>
      </motion.div>

      <p className="px-1 pb-2 text-center text-xs text-muted">{t('settings.footer')}</p>

      <ConfirmDialog
        open={dialog === 'import'}
        title={t('settings.importConfirm.title')}
        message={t('settings.importConfirm.message')}
        confirmLabel={t('settings.importConfirm.confirm')}
        cancelLabel={t('settings.importConfirm.cancel')}
        danger
        onConfirm={confirmImport}
        onCancel={() => {
          setDialog(null);
          setPendingImport(null);
        }}
      />

      <ConfirmDialog
        open={dialog === 'reset'}
        title={t('settings.resetConfirm.title')}
        message={t('settings.resetConfirm.message')}
        confirmLabel={t('settings.resetConfirm.confirm')}
        cancelLabel={t('settings.resetConfirm.cancel')}
        danger
        onConfirm={confirmReset}
        onCancel={() => setDialog(null)}
      />

      <ConfirmDialog
        open={dialog === 'logout'}
        title={t('auth.logoutConfirm')}
        message={t('auth.logoutMessage')}
        confirmLabel={t('auth.logout')}
        cancelLabel={t('common.cancel')}
        danger
        onConfirm={() => void confirmLogout()}
        onCancel={() => setDialog(null)}
      />
    </section>
  );
}

export default Settings;
