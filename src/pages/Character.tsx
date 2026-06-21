/**
 * Character — the player's identity sheet: hero portrait, full profile panel,
 * seven-stat spider chart, and a feed of real achievements.
 */
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Crown, Sparkles, Trophy } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  CharacterHeroPanel,
  EmptyState,
  StatSpiderChart,
} from '../components';
import {
  CharacterPageSkeleton,
  SkeletonScreen,
} from '../components/skeleton';
import { useLocalizedLevel, useSkillTree, useStats, useT, useLanguage } from '../hooks';
import { STAT_BY_KEY } from '../data/stats';
import { getIcon } from '../lib/icons';
import { localizeSkillNode, localizeSkillPath, localizeStatName } from '../i18n/localize';
import type { LevelView } from '../hooks/data';
import type { SkillPathWithNodes, Stat, StatKey } from '../types';

/** A real, derived milestone shown in the achievements feed. */
interface Achievement {
  id: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  color: string;
}

/** Strongest (level→xp) and weakest stat; null when there's no differentiation. */
function pickHighlights(stats: Stat[]): {
  bestKey: StatKey | null;
  weakestKey: StatKey | null;
} {
  if (stats.length === 0) return { bestKey: null, weakestKey: null };
  const best = stats.reduce((a, b) =>
    b.level > a.level || (b.level === a.level && b.xp > a.xp) ? b : a,
  );
  const weakest = stats.reduce((a, b) =>
    b.level < a.level || (b.level === a.level && b.xp < a.xp) ? b : a,
  );
  if (best.key === weakest.key) return { bestKey: null, weakestKey: null };
  return { bestKey: best.key, weakestKey: weakest.key };
}

/** Build the achievements feed from completed skill nodes, rank & stat levels. */
function buildAchievements(
  level: LevelView,
  stats: Stat[],
  tree: SkillPathWithNodes[],
  t: ReturnType<typeof useT>['t'],
  locale: ReturnType<typeof useLanguage>['locale'],
): Achievement[] {
  const out: Achievement[] = [];

  const completed: { node: SkillPathWithNodes['nodes'][number]; path: SkillPathWithNodes['path'] }[] = [];
  for (const { path, nodes } of tree) {
    for (const node of nodes) {
      if (node.status === 'completed') completed.push({ node, path });
    }
  }
  completed.sort((a, b) => b.node.order - a.node.order);
  for (const { node, path } of completed) {
    const pathCopy = localizeSkillPath(path.id, locale);
    const nodeCopy = localizeSkillNode(node.id, locale);
    out.push({
      id: `node-${node.id}`,
      title: t('character.unlocked', { title: nodeCopy.title }),
      subtitle: t('character.skillOf', { path: pathCopy.name }),
      icon: getIcon(path.icon),
      color: path.color,
    });
  }

  if (level.level >= 3) {
    out.push({
      id: 'rank',
      title: t('character.reachedRank', { rank: level.rank }),
      subtitle: t('character.overallLevel', { level: level.level }),
      icon: Crown,
      color: '#a78bfa',
    });
  }

  const leveled = [...stats]
    .filter((s) => s.level >= 2)
    .sort((a, b) => b.level - a.level || b.xp - a.xp);
  for (const s of leveled) {
    const def = STAT_BY_KEY[s.key];
    out.push({
      id: `stat-${s.key}`,
      title: t('character.statReached', {
        name: localizeStatName(s.key, locale),
        level: s.level,
      }),
      subtitle: t('character.statMilestone'),
      icon: getIcon(def.icon),
      color: def.color,
    });
  }

  return out.slice(0, 6);
}

export function Character() {
  const reduce = useReducedMotion();
  const level = useLocalizedLevel();
  const stats = useStats();
  const tree = useSkillTree();
  const { t } = useT();
  const { locale } = useLanguage();

  const { bestKey, weakestKey } = useMemo(
    () => pickHighlights(stats ?? []),
    [stats],
  );

  const achievements = useMemo(
    () => (level && stats ? buildAchievements(level, stats, tree ?? [], t, locale) : []),
    [level, stats, tree, t, locale],
  );

  const completedSkills = useMemo(() => {
    if (!tree) return null;
    return tree.reduce(
      (sum, p) => sum + p.nodes.filter((n) => n.status === 'completed').length,
      0,
    );
  }, [tree]);

  const loading = !level || !stats;

  if (loading) {
    return (
      <SkeletonScreen label={t('common.loading')}>
        <CharacterPageSkeleton />
      </SkeletonScreen>
    );
  }

  const bestStatName = bestKey ? localizeStatName(bestKey, locale) : t('common.balanced');

  return (
    <section className="space-y-4 sm:space-y-6">
      <CharacterHeroPanel
        strongestLabel={bestStatName}
        strongestKey={bestKey}
        completedSkills={completedSkills}
      />

      <StatSpiderChart stats={stats} bestKey={bestKey} weakestKey={weakestKey} />

      <div className="space-y-2 sm:space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted">
          <Trophy size={15} className="text-hero" />
          {t('character.achievements')}
        </h2>

        {achievements.length > 0 ? (
          <div className="card divide-y divide-border/60 p-1.5">
            {achievements.map((a, i) => (
              <motion.div
                key={a.id}
                initial={reduce ? false : { opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: Math.min(i, 6) * 0.05 }}
                className="flex items-center gap-3 px-2.5 py-2.5"
              >
                <span
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-xl"
                  style={{
                    color: a.color,
                    backgroundColor: `color-mix(in oklab, ${a.color} 16%, transparent)`,
                  }}
                >
                  <a.icon size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{a.title}</div>
                  <div className="truncate text-xs text-muted">{a.subtitle}</div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Trophy}
            title={t('character.emptyTitle')}
            message={t('character.emptyMessage')}
            action={
              <Link
                to="/"
                className="focus-ring inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
              >
                <Sparkles size={15} />
                {t('character.beginQuest')}
              </Link>
            }
          />
        )}
      </div>
    </section>
  );
}

export default Character;
