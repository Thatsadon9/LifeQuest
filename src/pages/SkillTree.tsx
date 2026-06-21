/**
 * Skill Tree — six progression paths, each a vertical track of `SkillNode`s
 * (locked / in-progress / completed). Statuses come from the engine (live via
 * `useSkillTree`); this page additionally derives a human-readable requirement
 * and live progress for every node from real completions & stat levels.
 */
import { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Network } from 'lucide-react';
import { SkillNode } from '../components/SkillNode';
import type { SkillNodeProgress } from '../components/SkillNode';
import { SkeletonScreen, SkillTreePageSkeleton } from '../components/skeleton';
import { useCompletions, useLanguage, useSkillTree, useStats, useT } from '../hooks';
import { getIcon } from '../lib/icons';
import {
  localizeSkillNode,
  localizeSkillPath,
  localizeStatName,
  seedQuestTitle,
} from '../i18n/localize';
import type { SkillPathWithNodes, SkillRequirement, StatKey } from '../types';

/** Evaluation context derived from live data. */
interface SkillCtx {
  questCompletions: Record<string, number>;
  statLevels: Partial<Record<StatKey, number>>;
  totalCompletions: number;
}

/** Compact, human-readable requirement string. */
function requirementLabel(
  req: SkillRequirement,
  locale: ReturnType<typeof useLanguage>['locale'],
  t: ReturnType<typeof useT>['t'],
): string {
  switch (req.kind) {
    case 'statLevel': {
      const name = req.stat ? localizeStatName(req.stat, locale) : t('skillTree.aStat');
      return t('skillTree.reqStatLevel', { name, value: req.value });
    }
    case 'questCompletions': {
      const title = req.questId
        ? seedQuestTitle(req.questId, locale)
        : t('skillTree.thisQuest');
      return t('skillTree.reqQuestCompletions', { title, value: req.value });
    }
    case 'totalCompletions':
      return t('skillTree.reqTotalCompletions', { value: req.value });
    default:
      return t('skillTree.reqDefault');
  }
}

function requirementProgress(
  req: SkillRequirement,
  ctx: SkillCtx,
  t: ReturnType<typeof useT>['t'],
): SkillNodeProgress {
  switch (req.kind) {
    case 'statLevel': {
      const cur = (req.stat && ctx.statLevels[req.stat]) || 1;
      return {
        current: Math.min(cur, req.value),
        max: req.value,
        text: t('skillTree.progressLv', { current: cur, max: req.value }),
      };
    }
    case 'questCompletions': {
      const cur = (req.questId && ctx.questCompletions[req.questId]) || 0;
      return { current: Math.min(cur, req.value), max: req.value, text: `${cur} / ${req.value}` };
    }
    case 'totalCompletions': {
      const cur = ctx.totalCompletions;
      return { current: Math.min(cur, req.value), max: req.value, text: `${cur} / ${req.value}` };
    }
    default:
      return { current: 0, max: 1, text: '' };
  }
}

function PathCard({
  data,
  ctx,
  locale,
  t,
  index,
}: {
  data: SkillPathWithNodes;
  ctx: SkillCtx;
  locale: ReturnType<typeof useLanguage>['locale'];
  t: ReturnType<typeof useT>['t'];
  index: number;
}) {
  const reduce = useReducedMotion();
  const { path, nodes } = data;
  const pathCopy = localizeSkillPath(path.id, locale);
  const PathIcon = getIcon(path.icon);
  const color = path.color;
  const done = nodes.filter((n) => n.status === 'completed').length;
  const pct = nodes.length ? Math.round((done / nodes.length) * 100) : 0;

  const mix = (amount: number) =>
    `color-mix(in oklab, ${color} ${amount}%, transparent)`;

  return (
    <motion.section
      initial={reduce ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index, 6) * 0.07, ease: 'easeOut' }}
      className="card overflow-hidden p-4"
    >
      <header className="flex items-center gap-3">
        <span
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl"
          style={{ backgroundColor: mix(16), border: `1px solid ${mix(36)}`, color }}
        >
          <PathIcon size={22} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="truncate font-semibold">{pathCopy.name}</h3>
            <span className="shrink-0 text-xs font-semibold tabular-nums text-muted">
              {done}/{nodes.length}
            </span>
          </div>
          <p className="truncate text-xs text-muted">{pathCopy.description}</p>
        </div>
      </header>

      <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-surface-2">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={reduce ? false : { width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 24, delay: 0.15 }}
        />
      </div>

      {nodes.length > 0 ? (
        <ul className="mt-4">
          {nodes.map((node, i) => {
            const nodeCopy = localizeSkillNode(node.id, locale);
            const displayNode = { ...node, ...nodeCopy };
            return (
            <SkillNode
              key={node.id}
              node={displayNode}
              pathColor={color}
              pathIcon={PathIcon}
              requirementLabel={requirementLabel(node.requirement, locale, t)}
              progress={requirementProgress(node.requirement, ctx, t)}
              isFirst={i === 0}
              isLast={i === nodes.length - 1}
              index={i}
            />
          );})}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-muted">{t('skillTree.comingSoon')}</p>
      )}
    </motion.section>
  );
}

export function SkillTree() {
  const reduce = useReducedMotion();
  const tree = useSkillTree();
  const stats = useStats();
  const completions = useCompletions();
  const { t } = useT();
  const { locale } = useLanguage();

  const loading = !tree || !stats || !completions;

  const ctx = useMemo<SkillCtx>(() => {
    const questCompletions: Record<string, number> = {};
    let totalCompletions = 0;
    for (const c of completions ?? []) {
      if (c.completionType === 'skip') continue;
      questCompletions[c.questId] = (questCompletions[c.questId] ?? 0) + 1;
      totalCompletions += 1;
    }
    const statLevels: Partial<Record<StatKey, number>> = {};
    for (const s of stats ?? []) statLevels[s.key] = s.level;
    return { questCompletions, statLevels, totalCompletions };
  }, [completions, stats]);

  const totals = useMemo(() => {
    let total = 0;
    let completed = 0;
    let unlocked = 0;
    for (const { nodes } of tree ?? []) {
      for (const n of nodes) {
        total += 1;
        if (n.status === 'completed') completed += 1;
        else if (n.status === 'unlocked') unlocked += 1;
      }
    }
    return { total, completed, unlocked };
  }, [tree]);

  const pct = totals.total ? Math.round((totals.completed / totals.total) * 100) : 0;

  if (loading) {
    return (
      <SkeletonScreen label={t('common.loading')}>
        <SkillTreePageSkeleton />
      </SkeletonScreen>
    );
  }

  return (
    <section className="space-y-5">
      <div className="card relative overflow-hidden p-5">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-2 border-b-[2.5px] border-[var(--brutal-ink)] bg-cha"
        />
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight">{t('skillTree.title')}</h1>
            <p className="mt-1 text-sm font-medium text-muted">{t('skillTree.subtitle')}</p>
          </div>
          <span className="grid h-12 w-12 shrink-0 place-items-center brutal-header shadow-[3px_3px_0_0_var(--brutal-shadow-color)]">
            <Network size={22} strokeWidth={2.5} />
          </span>
        </div>

        <div className="relative mt-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-muted">
                {t('skillTree.mastered', {
                  completed: totals.completed,
                  total: totals.total,
                })}
              </span>
              <span className="tabular-nums text-muted">{pct}%</span>
            </div>
            <div className="progress-brutal">
              <motion.div
                className="progress-brutal-fill"
                initial={reduce ? false : { width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ type: 'spring', stiffness: 120, damping: 22 }}
              />
            </div>
            {totals.unlocked > 0 && (
              <p className="text-xs text-muted">
                {totals.unlocked > 1
                  ? t('skillTree.inProgressPlural', { count: totals.unlocked })
                  : t('skillTree.inProgress', { count: totals.unlocked })}
              </p>
            )}
          </div>
        </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {tree.map((data, i) => (
            <PathCard key={data.path.id} data={data} ctx={ctx} locale={locale} t={t} index={i} />
          ))}
      </div>
    </section>
  );
}

export default SkillTree;
