/**
 * QuestListItem — a row on the Quest Log.
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Pencil, Power, Trash2 } from 'lucide-react';
import { setQuestActive } from '../lib/actions';
import { questXP } from '../lib/gamification';
import { localizeQuest, localizeStatName } from '../i18n/localize';
import { useLanguage, useT, useToast } from '../hooks';
import { STAT_BY_KEY } from '../data/stats';
import { StatIcon } from './StatIcon';
import { DifficultyBadge, MetaBadge, useQuestMetaLabels } from './questMeta';
import type { Quest } from '../types';

export interface QuestListItemProps {
  quest: Quest;
  onEdit: (quest: Quest) => void;
  onDelete: (quest: Quest) => void;
  index?: number;
}

const iconBtn =
  'focus-ring grid h-9 w-9 place-items-center rounded-xl border border-border text-muted transition-colors hover:text-text disabled:opacity-60';

export function QuestListItem({ quest: rawQuest, onEdit, onDelete, index = 0 }: QuestListItemProps) {
  const { locale } = useLanguage();
  const quest = localizeQuest(rawQuest, locale);
  const { t } = useT();
  const { typeLabel, categoryLabel } = useQuestMetaLabels();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  async function toggleActive() {
    if (busy) return;
    setBusy(true);
    try {
      await setQuestActive(quest.id, !quest.isActive);
      toast({
        variant: quest.isActive ? 'default' : 'success',
        title: quest.isActive ? t('quests.paused') : t('quests.activated'),
        message: quest.isActive ? t('quests.pausedMessage') : t('quests.activatedMessage'),
      });
    } catch (err) {
      toast({
        variant: 'warning',
        title: t('quests.updateFailed'),
        message: err instanceof Error ? err.message : t('questCard.tryAgain'),
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.25), type: 'spring', stiffness: 220, damping: 26 }}
      className={`card p-4 transition-opacity ${quest.isActive ? '' : 'opacity-60'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-semibold">{quest.title}</h3>
            {!quest.isActive && (
              <span className="shrink-0 rounded-full border border-border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
                {t('common.paused')}
              </span>
            )}
          </div>
          {quest.description && (
            <p className="mt-0.5 line-clamp-2 text-sm text-muted">{quest.description}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={toggleActive}
            disabled={busy}
            aria-pressed={quest.isActive}
            aria-label={quest.isActive ? t('quests.deactivateQuest') : t('quests.activateQuest')}
            title={quest.isActive ? t('common.deactivate') : t('common.activate')}
            className={iconBtn}
            style={
              quest.isActive
                ? {
                    color: 'var(--color-success)',
                    borderColor: 'color-mix(in oklab, var(--color-success) 40%, transparent)',
                    backgroundColor: 'color-mix(in oklab, var(--color-success) 12%, transparent)',
                  }
                : undefined
            }
          >
            <Power size={16} />
          </button>
          <button
            type="button"
            onClick={() => onEdit(rawQuest)}
            aria-label={t('quests.editQuest')}
            title={t('common.edit')}
            className={iconBtn}
          >
            <Pencil size={16} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(rawQuest)}
            aria-label={t('common.delete')}
            title={t('common.delete')}
            className={`${iconBtn} hover:text-danger`}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1.5">
        <DifficultyBadge difficulty={quest.difficulty} />
        <MetaBadge label={typeLabel(quest.type)} />
        {quest.category && <MetaBadge label={categoryLabel(quest.category)} />}
        <span className="text-xs font-medium text-muted">
          +{questXP(quest, 'normal')} {t('common.xp')}
        </span>
        <div className="ml-auto flex items-center gap-1">
          {quest.statTargets.map((st) => (
            <span
              key={st.stat}
              className="grid h-6 w-6 place-items-center rounded-md"
              style={{
                backgroundColor: `color-mix(in oklab, ${STAT_BY_KEY[st.stat].color} 14%, transparent)`,
              }}
              title={localizeStatName(st.stat, locale)}
            >
              <StatIcon stat={st.stat} size={13} />
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default QuestListItem;
