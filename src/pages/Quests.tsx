/**
 * Quest Log — browse, filter, and manage every quest.
 *
 * Lists all quests with type/stat/active filters and search, and supports
 * create / edit / delete / activate via `QuestFormModal` + `ConfirmDialog`.
 */
import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { ArrowLeft, Plus, Search, ScrollText, X } from 'lucide-react';
import { useLanguage, useQuests, useToast, useT } from '../hooks';
import type { QuestFilter } from '../hooks';
import { deleteQuest } from '../lib/actions';
import { STATS } from '../data/stats';
import { localizeStatName } from '../i18n/localize';
import { ConfirmDialog, EmptyState } from '../components';
import { StatIcon } from '../components/StatIcon';
import { QuestListItem } from '../components/QuestListItem';
import { QuestFormModal } from '../components/QuestFormModal';
import { useQuestMetaLabels } from '../components/questMeta';
import { QuestsPageSkeleton, SkeletonScreen } from '../components/skeleton';
import type { Quest, QuestType, StatKey } from '../types';

const TYPE_OPTIONS: QuestType[] = ['daily', 'weekly', 'one-time', 'recovery'];

const pillCls =
  'focus-ring shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors';

export function Quests() {
  const { toast } = useToast();
  const { t } = useT();
  const { typeLabel } = useQuestMetaLabels();
  const { locale } = useLanguage();

  const [typeFilter, setTypeFilter] = useState<QuestType | 'all'>('all');
  const [statFilter, setStatFilter] = useState<StatKey | 'all'>('all');
  const [activeOnly, setActiveOnly] = useState(false);
  const [search, setSearch] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Quest | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Quest | null>(null);

  const filter = useMemo<QuestFilter>(
    () => ({
      type: typeFilter === 'all' ? undefined : typeFilter,
      stat: statFilter === 'all' ? undefined : statFilter,
      activeOnly: activeOnly || undefined,
      search: search.trim() || undefined,
    }),
    [typeFilter, statFilter, activeOnly, search],
  );

  const quests = useQuests(filter);
  const filtersActive =
    typeFilter !== 'all' || statFilter !== 'all' || activeOnly || search.trim() !== '';

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(quest: Quest) {
    setEditing(quest);
    setFormOpen(true);
  }
  function closeForm() {
    setFormOpen(false);
    setEditing(null);
  }
  function clearFilters() {
    setTypeFilter('all');
    setStatFilter('all');
    setActiveOnly(false);
    setSearch('');
  }

  async function confirmDelete() {
    const quest = pendingDelete;
    if (!quest) return;
    try {
      await deleteQuest(quest.id);
      toast({ variant: 'default', title: t('quests.deleted'), message: quest.title });
    } catch (err) {
      toast({
        variant: 'danger',
        title: t('quests.deleteFailed'),
        message: err instanceof Error ? err.message : t('questCard.tryAgain'),
      });
    } finally {
      setPendingDelete(null);
    }
  }

  if (quests === undefined) {
    return (
      <SkeletonScreen label={t('common.loading')}>
        <QuestsPageSkeleton />
      </SkeletonScreen>
    );
  }

  return (
    <div className="space-y-5">
      <Link
        to="/settings"
        className="btn-brutal btn-brutal-ghost inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold"
      >
        <ArrowLeft size={14} strokeWidth={2.5} />
        {t('quests.backToSettings')}
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">{t('quests.title')}</h1>
          <p className="text-sm text-muted">{t('quests.subtitle')}</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="btn-brutal btn-brutal-primary shrink-0 px-3.5 py-2 text-sm"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">{t('quests.newQuest')}</span>
          <span className="sm:hidden">{t('quests.new')}</span>
        </button>
      </div>

      {/* Filters */}
      <div className="card space-y-3 p-3">
        <div className="relative">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('quests.searchPlaceholder')}
            className="input-brutal w-full py-2 pl-9 pr-9"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label={t('quests.clearSearch')}
              className="focus-ring absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-md text-muted hover:text-text"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="space-y-1.5">
          <p className="px-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted">{t('quests.type')}</p>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setTypeFilter('all')}
              aria-pressed={typeFilter === 'all'}
              className={`${pillCls} ${typeFilter === 'all' ? 'border-transparent text-white' : 'border-border text-muted hover:text-text'}`}
              style={typeFilter === 'all' ? { backgroundColor: 'var(--color-primary)' } : undefined}
            >
              {t('common.all')}
            </button>
            {TYPE_OPTIONS.map((qt) => {
              const on = typeFilter === qt;
              return (
                <button
                  key={qt}
                  type="button"
                  onClick={() => setTypeFilter(qt)}
                  aria-pressed={on}
                  className={`${pillCls} ${on ? 'border-transparent text-white' : 'border-border text-muted hover:text-text'}`}
                  style={on ? { backgroundColor: 'var(--color-primary)' } : undefined}
                >
                  {typeLabel(qt)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-1.5">
          <p className="px-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted">{t('quests.stat')}</p>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setStatFilter('all')}
              aria-pressed={statFilter === 'all'}
              className={`${pillCls} ${statFilter === 'all' ? 'border-transparent text-white' : 'border-border text-muted hover:text-text'}`}
              style={statFilter === 'all' ? { backgroundColor: 'var(--color-primary)' } : undefined}
            >
              {t('common.all')}
            </button>
            {STATS.map((s) => {
              const on = statFilter === s.key;
              const statName = localizeStatName(s.key, locale);
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setStatFilter(on ? 'all' : s.key)}
                  aria-pressed={on}
                  aria-label={t('quests.filterByStat', { name: statName })}
                  title={statName}
                  className={`focus-ring grid h-8 w-8 place-items-center rounded-lg border transition-colors ${on ? '' : 'text-muted'}`}
                  style={
                    on
                      ? {
                          borderColor: `color-mix(in oklab, ${s.color} 45%, transparent)`,
                          backgroundColor: `color-mix(in oklab, ${s.color} 16%, transparent)`,
                        }
                      : { borderColor: 'var(--color-border)' }
                  }
                >
                  <StatIcon stat={s.key} size={15} withColor={on} />
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setActiveOnly((v) => !v)}
            aria-pressed={activeOnly}
            className={`${pillCls} ${activeOnly ? 'border-transparent text-white' : 'border-border text-muted hover:text-text'}`}
            style={activeOnly ? { backgroundColor: 'var(--color-success)' } : undefined}
          >
            {t('quests.activeOnly')}
          </button>
          {filtersActive && (
            <button
              type="button"
              onClick={clearFilters}
              className="focus-ring rounded-lg px-2 py-1 text-xs font-medium text-muted transition-colors hover:text-text"
            >
              {t('quests.clearFilters')}
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      {quests.length === 0 ? (
        filtersActive ? (
          <EmptyState
            icon={Search}
            title={t('quests.noMatchTitle')}
            message={t('quests.noMatchMessage')}
            action={
              <button
                type="button"
                onClick={clearFilters}
                className="focus-ring rounded-xl border border-border px-4 py-2 text-sm font-semibold text-text transition-colors hover:bg-surface-2"
              >
                {t('quests.clearFilters')}
              </button>
            }
          />
        ) : (
          <EmptyState
            icon={ScrollText}
            title={t('quests.emptyTitle')}
            message={t('quests.emptyMessage')}
            action={
              <button
                type="button"
                onClick={openCreate}
                className="btn-brutal btn-brutal-primary px-4 py-2 text-sm"
              >
                <Plus size={16} />
                {t('quests.createQuest')}
              </button>
            }
          />
        )
      ) : (
        <div className="space-y-2.5">
          <p className="px-1 text-xs text-muted">
            {t('quests.questCount', {
              count: quests.length,
              unit: quests.length === 1 ? t('common.quest') : t('common.quests'),
            })}
          </p>
          {quests.map((q, i) => (
            <QuestListItem
              key={q.id}
              quest={q}
              index={i}
              onEdit={openEdit}
              onDelete={setPendingDelete}
            />
          ))}
        </div>
      )}

      <QuestFormModal open={formOpen} quest={editing} onClose={closeForm} />

      <ConfirmDialog
        open={pendingDelete !== null}
        title={t('quests.deleteConfirm.title')}
        message={
          pendingDelete
            ? t('quests.deleteConfirm.message', { title: pendingDelete.title })
            : undefined
        }
        confirmLabel={t('quests.deleteConfirm.confirm')}
        cancelLabel={t('quests.deleteConfirm.cancel')}
        danger
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}

export default Quests;
