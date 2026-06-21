/**
 * QuestFormModal — create or edit a quest in one clean, grouped form.
 *
 * Pass a `quest` to edit (uses `updateQuest`); omit it to create (uses
 * `createQuest`). Validates the essentials (title, at least one target stat,
 * base XP, the Normal version) and keeps everything else low-friction with
 * sensible defaults.
 */
import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { createQuest, updateQuest } from '../lib/actions';
import type { NewQuest } from '../lib/actions';
import { questXP } from '../lib/gamification';
import { localizeStatName } from '../i18n/localize';
import { useLanguage, useToast, useT } from '../hooks';
import { STATS } from '../data/stats';
import { StatIcon } from './StatIcon';
import type {
  Difficulty,
  HabitTrackMode,
  Quest,
  QuestCategory,
  QuestSchedule,
  QuestType,
  StatKey,
} from '../types';

const TYPES: QuestType[] = ['daily', 'weekly', 'one-time', 'recovery'];
const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard', 'heroic'];
const CATEGORIES: QuestCategory[] = ['main', 'support', 'recovery'];

interface FormState {
  title: string;
  description: string;
  type: QuestType;
  difficulty: Difficulty;
  baseXP: string;
  selectedStats: StatKey[];
  weightByStat: Partial<Record<StatKey, number>>;
  minimumVersion: string;
  normalVersion: string;
  heroVersion: string;
  days: number[];
  trigger: string;
  category: QuestCategory;
  isActive: boolean;
  trackMode: HabitTrackMode;
  targetCount: string;
  unit: string;
}

function initialState(quest?: Quest | null): FormState {
  if (quest) {
    const weightByStat: Partial<Record<StatKey, number>> = {};
    for (const t of quest.statTargets) weightByStat[t.stat] = t.weight;
    return {
      title: quest.title,
      description: quest.description,
      type: quest.type,
      difficulty: quest.difficulty,
      baseXP: String(quest.baseXP),
      selectedStats: quest.statTargets.map((t) => t.stat),
      weightByStat,
      minimumVersion: quest.minimumVersion,
      normalVersion: quest.normalVersion,
      heroVersion: quest.heroVersion,
      days: quest.schedule?.days ?? [],
      trigger: quest.trigger,
      category: quest.category ?? 'support',
      isActive: quest.isActive,
      trackMode: quest.trackMode ?? 'binary',
      targetCount: String(quest.targetCount ?? 8),
      unit: quest.unit ?? '',
    };
  }
  return {
    title: '',
    description: '',
    type: 'daily',
    difficulty: 'medium',
    baseXP: '20',
    selectedStats: [],
    weightByStat: {},
    minimumVersion: '',
    normalVersion: '',
    heroVersion: '',
    days: [],
    trigger: '',
    category: 'support',
    isActive: true,
    trackMode: 'binary',
    targetCount: '8',
    unit: '',
  };
}

interface Errors {
  title?: string;
  stats?: string;
  baseXP?: string;
  normalVersion?: string;
  targetCount?: string;
}

export interface QuestFormModalProps {
  open: boolean;
  /** Provide to edit; omit/null to create. */
  quest?: Quest | null;
  onClose: () => void;
  /** Called after a successful create/edit. */
  onSaved?: () => void;
}

const inputCls =
  'w-full rounded-xl border border-border bg-surface-2/60 px-3 py-2 text-sm text-text outline-none transition-colors focus-ring placeholder:text-muted/60';
const labelCls = 'mb-1 block text-xs font-semibold text-muted';

export function QuestFormModal({ open, quest, onClose, onSaved }: QuestFormModalProps) {
  const { toast } = useToast();
  const { t, dict } = useT();
  const { locale } = useLanguage();
  const weekdays = dict.questForm.weekdays;
  const [form, setForm] = useState<FormState>(() => initialState(quest));
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const isEdit = Boolean(quest);

  // Reset the form whenever the modal opens (for a fresh create or a new edit).
  useEffect(() => {
    if (open) {
      setForm(initialState(quest));
      setErrors({});
      setBusy(false);
    }
  }, [open, quest]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const xpNum = Number(form.baseXP) || 0;
  const preview = useMemo(
    () => ({
      normal: questXP({ baseXP: xpNum, difficulty: form.difficulty }, 'normal'),
      hero: questXP({ baseXP: xpNum, difficulty: form.difficulty }, 'hero'),
    }),
    [xpNum, form.difficulty],
  );

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleStat(stat: StatKey) {
    setForm((f) => {
      const has = f.selectedStats.includes(stat);
      return {
        ...f,
        selectedStats: has
          ? f.selectedStats.filter((s) => s !== stat)
          : [...f.selectedStats, stat],
      };
    });
  }

  function toggleDay(day: number) {
    setForm((f) => {
      const has = f.days.includes(day);
      return {
        ...f,
        days: has ? f.days.filter((d) => d !== day) : [...f.days, day].sort((a, b) => a - b),
      };
    });
  }

  function validate(): Errors {
    const next: Errors = {};
    if (!form.title.trim()) next.title = t('questForm.errors.title');
    if (form.selectedStats.length === 0) next.stats = t('questForm.errors.stats');
    if (!(Number(form.baseXP) >= 1)) next.baseXP = t('questForm.errors.baseXP');
    const isHabit = form.type === 'daily' || form.type === 'recovery';
    if (isHabit && form.trackMode === 'counter') {
      if (!(Number(form.targetCount) >= 1)) {
        next.targetCount = t('questForm.errors.targetCount');
      }
    } else if (!form.normalVersion.trim()) {
      next.normalVersion = t('questForm.errors.normalVersion');
    }
    return next;
  }

  async function handleSubmit() {
    if (busy) return;
    const found = validate();
    if (Object.keys(found).length > 0) {
      setErrors(found);
      return;
    }

    const baseXP = Math.max(1, Math.round(Number(form.baseXP) || 0));
    const statTargets = form.selectedStats.map((s) => ({
      stat: s,
      weight: form.weightByStat[s] ?? 1,
    }));
    const schedule: QuestSchedule =
      form.days.length > 0 && form.days.length < 7 ? { days: form.days } : {};

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      type: form.type,
      difficulty: form.difficulty,
      baseXP,
      statTargets,
      minimumVersion: form.minimumVersion.trim() || t('questForm.defaults.minimum'),
      normalVersion:
        form.normalVersion.trim() ||
        form.title.trim() ||
        t('questForm.defaults.minimum'),
      heroVersion: form.heroVersion.trim() || t('questForm.defaults.hero'),
      schedule,
      trigger: form.trigger.trim(),
      category: form.category,
      isActive: form.isActive,
      trackMode: form.trackMode,
      targetCount:
        form.trackMode === 'counter'
          ? Math.max(1, Math.round(Number(form.targetCount) || 1))
          : undefined,
      unit: form.trackMode === 'counter' ? form.unit.trim() || undefined : undefined,
    };

    setBusy(true);
    try {
      if (quest) {
        await updateQuest(quest.id, payload);
        toast({ variant: 'success', title: t('questForm.updated'), message: form.title.trim() });
      } else {
        await createQuest(payload as NewQuest);
        toast({ variant: 'success', title: t('questForm.created'), message: form.title.trim() });
      }
      onSaved?.();
      onClose();
    } catch (err) {
      toast({
        variant: 'danger',
        title: t('questForm.saveFailed'),
        message: err instanceof Error ? err.message : t('questCard.tryAgain'),
      });
    } finally {
      setBusy(false);
    }
  }

  const everyDay = form.days.length === 0 || form.days.length === 7;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-[var(--brutal-ink)]/55"
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={isEdit ? t('questForm.editAria') : t('questForm.newAria')}
            className="card relative z-10 flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-b-none sm:rounded-2xl"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold">{isEdit ? t('questForm.editTitle') : t('questForm.newTitle')}</h2>
                <p className="text-xs text-muted">
                  {isEdit ? t('questForm.editSubtitle') : t('questForm.newSubtitle')}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label={t('common.close')}
                className="focus-ring grid h-9 w-9 shrink-0 place-items-center rounded-xl text-muted transition-colors hover:bg-surface-2 hover:text-text"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
              <div>
                <label className={labelCls} htmlFor="q-title">
                  {t('questForm.title')}
                </label>
                <input
                  id="q-title"
                  className={inputCls}
                  value={form.title}
                  onChange={(e) => set('title', e.target.value)}
                  placeholder={t('questForm.titlePlaceholder')}
                  maxLength={80}
                  autoFocus
                />
                {errors.title && <p className="mt-1 text-xs text-danger">{errors.title}</p>}
              </div>

              <div>
                <label className={labelCls} htmlFor="q-desc">
                  {t('questForm.description')}{' '}
                  <span className="font-normal opacity-70">{t('common.optional')}</span>
                </label>
                <textarea
                  id="q-desc"
                  className={`${inputCls} min-h-[64px] resize-y`}
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  placeholder={t('questForm.descriptionPlaceholder')}
                  maxLength={240}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls} htmlFor="q-type">
                    {t('questForm.type')}
                  </label>
                  <select
                    id="q-type"
                    className={inputCls}
                    value={form.type}
                    onChange={(e) => set('type', e.target.value as QuestType)}
                  >
                    {TYPES.map((qt) => (
                      <option key={qt} value={qt}>
                        {t(`questType.${qt}`)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls} htmlFor="q-diff">
                    {t('questForm.difficulty')}
                  </label>
                  <select
                    id="q-diff"
                    className={inputCls}
                    value={form.difficulty}
                    onChange={(e) => set('difficulty', e.target.value as Difficulty)}
                  >
                    {DIFFICULTIES.map((d) => (
                      <option key={d} value={d}>
                        {t(`difficulty.${d}`)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls} htmlFor="q-xp">
                    {t('questForm.baseXp')}
                  </label>
                  <input
                    id="q-xp"
                    type="number"
                    min={1}
                    max={999}
                    className={inputCls}
                    value={form.baseXP}
                    onChange={(e) => set('baseXP', e.target.value)}
                  />
                  {errors.baseXP ? (
                    <p className="mt-1 text-xs text-danger">{errors.baseXP}</p>
                  ) : (
                    <p className="mt-1 text-[11px] text-muted">
                      {t('questForm.xpPreview', { normal: preview.normal, hero: preview.hero })}
                    </p>
                  )}
                </div>
                <div>
                  <label className={labelCls} htmlFor="q-cat">
                    {t('questForm.todaySection')}
                  </label>
                  <select
                    id="q-cat"
                    className={inputCls}
                    value={form.category}
                    onChange={(e) => set('category', e.target.value as QuestCategory)}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c === 'main'
                          ? t('questCategory.mainQuest')
                          : c === 'recovery'
                            ? t('questCategory.recoveryQuest')
                            : t('questCategory.support')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {(form.type === 'daily' || form.type === 'recovery') && (
                <div className="space-y-3 rounded-xl border border-border bg-surface-2/40 p-3">
                  <label className={labelCls}>{t('questForm.trackMode')}</label>
                  <div className="flex flex-wrap gap-2">
                    {(['binary', 'counter'] as HabitTrackMode[]).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => set('trackMode', mode)}
                        aria-pressed={form.trackMode === mode}
                        className={`focus-ring rounded-full border px-3 py-1.5 text-xs font-semibold ${
                          form.trackMode === mode
                            ? 'border-primary bg-primary text-[var(--color-on-primary)]'
                            : 'border-border text-muted'
                        }`}
                      >
                        {mode === 'binary'
                          ? t('questForm.trackBinary')
                          : t('questForm.trackCounter')}
                      </button>
                    ))}
                  </div>
                  {form.trackMode === 'counter' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelCls} htmlFor="q-target">
                          {t('questForm.targetCount')}
                        </label>
                        <input
                          id="q-target"
                          type="number"
                          min={1}
                          max={999}
                          className={inputCls}
                          value={form.targetCount}
                          onChange={(e) => set('targetCount', e.target.value)}
                        />
                        {errors.targetCount && (
                          <p className="mt-1 text-xs text-danger">{errors.targetCount}</p>
                        )}
                      </div>
                      <div>
                        <label className={labelCls} htmlFor="q-unit">
                          {t('questForm.unit')}
                        </label>
                        <input
                          id="q-unit"
                          className={inputCls}
                          value={form.unit}
                          onChange={(e) => set('unit', e.target.value)}
                          placeholder={t('questForm.unitPlaceholder')}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className={labelCls}>{t('questForm.targetStats')}</label>
                <div className="flex flex-wrap gap-1.5">
                  {STATS.map((s) => {
                    const selected = form.selectedStats.includes(s.key);
                    return (
                      <button
                        key={s.key}
                        type="button"
                        onClick={() => toggleStat(s.key)}
                        aria-pressed={selected}
                        className={`focus-ring inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                          selected ? '' : 'border-border text-muted hover:text-text'
                        }`}
                        style={
                          selected
                            ? {
                                color: s.color,
                                backgroundColor: `color-mix(in oklab, ${s.color} 16%, transparent)`,
                                borderColor: `color-mix(in oklab, ${s.color} 42%, transparent)`,
                              }
                            : undefined
                        }
                      >
                        <StatIcon stat={s.key} size={14} withColor={selected} />
                        {localizeStatName(s.key, locale)}
                      </button>
                    );
                  })}
                </div>
                {errors.stats && <p className="mt-1 text-xs text-danger">{errors.stats}</p>}
              </div>

              {(form.type !== 'daily' && form.type !== 'recovery') && (
              <div className="space-y-2 rounded-xl border border-border bg-surface-2/40 p-3">
                <p className="text-xs font-semibold text-muted">{t('questForm.threeVersions')}</p>
                <div>
                  <input
                    className={inputCls}
                    value={form.minimumVersion}
                    onChange={(e) => set('minimumVersion', e.target.value)}
                    placeholder={t('questForm.partialPlaceholder')}
                    maxLength={120}
                  />
                </div>
                <div>
                  <input
                    className={inputCls}
                    value={form.normalVersion}
                    onChange={(e) => set('normalVersion', e.target.value)}
                    placeholder={t('questForm.completePlaceholder')}
                    maxLength={120}
                  />
                  {errors.normalVersion && (
                    <p className="mt-1 text-xs text-danger">{errors.normalVersion}</p>
                  )}
                </div>
                <div>
                  <input
                    className={inputCls}
                    value={form.heroVersion}
                    onChange={(e) => set('heroVersion', e.target.value)}
                    placeholder={t('questForm.heroPlaceholder')}
                    maxLength={120}
                  />
                </div>
              </div>
              )}

              <div>
                <label className={labelCls}>{t('questForm.schedule')}</label>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => set('days', [])}
                    aria-pressed={everyDay}
                    className={`focus-ring rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                      everyDay ? 'border-transparent' : 'border-border text-muted hover:text-text'
                    }`}
                    style={
                      everyDay
                        ? {
                            color: 'var(--color-primary-soft)',
                            backgroundColor: 'color-mix(in oklab, var(--color-primary) 16%, transparent)',
                          }
                        : undefined
                    }
                  >
                    {t('questForm.everyDay')}
                  </button>
                  {weekdays.map((d: string, i: number) => {
                    const on = !everyDay && form.days.includes(i);
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => toggleDay(i)}
                        aria-pressed={on}
                        aria-label={d}
                        className={`focus-ring h-9 w-9 rounded-lg border text-xs font-semibold transition-colors ${
                          on ? 'border-transparent' : 'border-border text-muted hover:text-text'
                        }`}
                        style={
                          on
                            ? {
                                color: 'var(--color-primary-soft)',
                                backgroundColor:
                                  'color-mix(in oklab, var(--color-primary) 16%, transparent)',
                              }
                            : undefined
                        }
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className={labelCls} htmlFor="q-trigger">
                  {t('questForm.trigger')}{' '}
                  <span className="font-normal opacity-70">{t('common.optional')}</span>
                </label>
                <input
                  id="q-trigger"
                  className={inputCls}
                  value={form.trigger}
                  onChange={(e) => set('trigger', e.target.value)}
                  placeholder={t('questForm.triggerPlaceholder')}
                  maxLength={80}
                />
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={form.isActive}
                onClick={() => set('isActive', !form.isActive)}
                className="focus-ring flex w-full items-center justify-between rounded-xl border border-border bg-surface-2/40 px-3 py-2.5"
              >
                <span className="text-left">
                  <span className="block text-sm font-medium">{t('questForm.activeLabel')}</span>
                  <span className="block text-xs text-muted">{t('questForm.activeHint')}</span>
                </span>
                <span
                  className="relative h-6 w-11 shrink-0 rounded-full transition-colors"
                  style={{
                    backgroundColor: form.isActive
                      ? 'var(--color-primary)'
                      : 'var(--color-surface-2)',
                  }}
                >
                  <motion.span
                    className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow"
                    animate={{ x: form.isActive ? 20 : 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                  />
                </span>
              </button>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-4 pb-safe">
              <button
                type="button"
                onClick={onClose}
                disabled={busy}
                className="focus-ring rounded-xl bg-surface-2 px-4 py-2 text-sm font-medium text-text transition-opacity hover:opacity-80 disabled:opacity-60"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={busy}
                className="focus-ring rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {busy
                  ? t('common.saving')
                  : isEdit
                    ? t('questForm.saveChanges')
                    : t('questForm.createQuest')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default QuestFormModal;
