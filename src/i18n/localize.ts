/**
 * Localize seed/static content by locale. User-created content is returned as-is.
 */
import { SEED_QUESTS, SEED_QUEST_ID } from '../data/seedQuests';
import type { Language, Quest, SkillNode, SkillPathDef, StatKey } from '../types';
import { getDict } from './index';

const SEED_QUEST_IDS = new Set<string>(Object.values(SEED_QUEST_ID));

const seedQuestById = new Map(SEED_QUESTS.map((q) => [q.id, q]));

export function localizeQuest(quest: Quest, locale: Language): Quest {
  if (locale === 'en' || !SEED_QUEST_IDS.has(quest.id)) return quest;
  const dict = getDict(locale);
  const seed = dict.seed.quests[quest.id as keyof typeof dict.seed.quests];
  if (!seed) return quest;
  return { ...quest, ...seed };
}

export function localizeStatName(key: StatKey, locale: Language): string {
  const dict = getDict(locale);
  return dict.seed.stats[key]?.name ?? key;
}

export function localizeStatDescription(key: StatKey, locale: Language): string {
  const dict = getDict(locale);
  return dict.seed.stats[key]?.description ?? '';
}

export function localizeRankTitle(englishTitle: string, locale: Language): string {
  if (locale === 'en') return englishTitle;
  const dict = getDict(locale);
  const title = dict.seed.ranks[englishTitle as keyof typeof dict.seed.ranks];
  return title ?? englishTitle;
}

export function localizeSkillPath(pathId: string, locale: Language): Pick<SkillPathDef, 'name' | 'description'> {
  const dict = getDict(locale);
  const path = dict.seed.skillPaths[pathId as keyof typeof dict.seed.skillPaths];
  if (!path) {
    return { name: pathId, description: '' };
  }
  return path;
}

export function localizeSkillNode(
  nodeId: string,
  locale: Language,
): Pick<SkillNode, 'title' | 'description'> {
  const dict = getDict(locale);
  const node = dict.seed.skillNodes[nodeId as keyof typeof dict.seed.skillNodes];
  if (!node) return { title: nodeId, description: '' };
  return node;
}

/** Local weekday name for a YYYY-MM-DD key. */
export function localizeWeekday(key: string, locale: Language, short = false): string {
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  const tag = locale === 'th' ? 'th-TH' : undefined;
  return date.toLocaleDateString(tag, { weekday: short ? 'short' : 'long' });
}

/** Short date label, e.g. "Jun 21" / "21 มิ.ย." */
export function formatShortDateLocalized(key: string, locale: Language): string {
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  const tag = locale === 'th' ? 'th-TH' : undefined;
  return date.toLocaleDateString(tag, { month: 'short', day: 'numeric' });
}

/** Resolve a seed quest title by id (for skill requirements). */
export function seedQuestTitle(questId: string, locale: Language): string {
  if (locale === 'en') return seedQuestById.get(questId)?.title ?? questId;
  const dict = getDict(locale);
  const seed = dict.seed.quests[questId as keyof typeof dict.seed.quests];
  return seed?.title ?? seedQuestById.get(questId)?.title ?? questId;
}
