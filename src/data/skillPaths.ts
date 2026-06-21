/**
 * The six skill paths and their seed nodes. Node `status` is computed at runtime
 * (see `gamification.computeSkillNodeStatus` / `actions.recomputeSkillNodes`),
 * so seeds are stored without it.
 */
import type { SkillNode, SkillPathDef } from '../types';
import { SEED_QUEST_ID } from './seedQuests';

/** A skill node before its runtime `status` is computed. */
export type SkillNodeSeed = Omit<SkillNode, 'status'>;

export const SKILL_PATHS: SkillPathDef[] = [
  {
    id: 'academic-beast',
    name: 'Academic Beast',
    description: 'Turn studying into a superpower.',
    icon: 'GraduationCap',
    color: '#38bdf8',
  },
  {
    id: 'builder',
    name: 'Builder',
    description: 'Make things and ship them.',
    icon: 'Hammer',
    color: '#fbbf24',
  },
  {
    id: 'english-speaker',
    name: 'English Speaker',
    description: 'Speak with clarity and confidence.',
    icon: 'Languages',
    color: '#e879f9',
  },
  {
    id: 'body-energy',
    name: 'Body & Energy',
    description: 'Build a strong, energised body.',
    icon: 'Dumbbell',
    color: '#fb7185',
  },
  {
    id: 'mind-reflection',
    name: 'Mind & Reflection',
    description: 'Grow calmer, clearer, and wiser.',
    icon: 'Compass',
    color: '#2dd4bf',
  },
  {
    id: 'money-discipline',
    name: 'Money Discipline',
    description: 'Master your money habits.',
    icon: 'Coins',
    color: '#34d399',
  },
];

export const SKILL_NODE_SEEDS: SkillNodeSeed[] = [
  // ── Academic Beast ──────────────────────────────────────────────────────
  {
    id: 'ab-1',
    pathId: 'academic-beast',
    title: 'Open the Books',
    description: 'Complete a Deep Study Session once.',
    requirement: { kind: 'questCompletions', questId: SEED_QUEST_ID.study, value: 1 },
    order: 1,
  },
  {
    id: 'ab-2',
    pathId: 'academic-beast',
    title: 'Study Streak',
    description: 'Complete Deep Study Session 7 times.',
    requirement: { kind: 'questCompletions', questId: SEED_QUEST_ID.study, value: 7 },
    order: 2,
  },
  {
    id: 'ab-3',
    pathId: 'academic-beast',
    title: 'Sharp Mind',
    description: 'Reach Intellect level 4.',
    requirement: { kind: 'statLevel', stat: 'INT', value: 4 },
    order: 3,
  },
  {
    id: 'ab-4',
    pathId: 'academic-beast',
    title: 'Deep Worker',
    description: 'Complete Deep Study Session 20 times.',
    requirement: { kind: 'questCompletions', questId: SEED_QUEST_ID.study, value: 20 },
    order: 4,
  },
  {
    id: 'ab-5',
    pathId: 'academic-beast',
    title: 'Scholar',
    description: 'Reach Focus level 6.',
    requirement: { kind: 'statLevel', stat: 'FOCUS', value: 6 },
    order: 5,
  },

  // ── Builder ─────────────────────────────────────────────────────────────
  {
    id: 'bd-1',
    pathId: 'builder',
    title: 'First Build',
    description: 'Complete Build & Ship once.',
    requirement: { kind: 'questCompletions', questId: SEED_QUEST_ID.build, value: 1 },
    order: 1,
  },
  {
    id: 'bd-2',
    pathId: 'builder',
    title: 'Ship It',
    description: 'Complete Build & Ship 5 times.',
    requirement: { kind: 'questCompletions', questId: SEED_QUEST_ID.build, value: 5 },
    order: 2,
  },
  {
    id: 'bd-3',
    pathId: 'builder',
    title: 'Maker',
    description: 'Reach Craft level 4.',
    requirement: { kind: 'statLevel', stat: 'CRAFT', value: 4 },
    order: 3,
  },
  {
    id: 'bd-4',
    pathId: 'builder',
    title: 'Prolific',
    description: 'Reach 50 total quest completions.',
    requirement: { kind: 'totalCompletions', value: 50 },
    order: 4,
  },

  // ── English Speaker (example path from the plan) ─────────────────────────
  {
    id: 'en-1',
    pathId: 'english-speaker',
    title: 'First Words',
    description: 'Complete Practice English Speaking once.',
    requirement: { kind: 'questCompletions', questId: SEED_QUEST_ID.english, value: 1 },
    order: 1,
  },
  {
    id: 'en-2',
    pathId: 'english-speaker',
    title: 'Daily Voice',
    description: 'Practice English Speaking 5 times.',
    requirement: { kind: 'questCompletions', questId: SEED_QUEST_ID.english, value: 5 },
    order: 2,
  },
  {
    id: 'en-3',
    pathId: 'english-speaker',
    title: 'Conversation Ready',
    description: 'Practice English Speaking 15 times.',
    requirement: { kind: 'questCompletions', questId: SEED_QUEST_ID.english, value: 15 },
    order: 3,
  },
  {
    id: 'en-4',
    pathId: 'english-speaker',
    title: 'Silver Tongue',
    description: 'Reach Charisma level 5.',
    requirement: { kind: 'statLevel', stat: 'CHA', value: 5 },
    order: 4,
  },
  {
    id: 'en-5',
    pathId: 'english-speaker',
    title: 'IELTS Challenger',
    description: 'Practice English Speaking 30 times.',
    requirement: { kind: 'questCompletions', questId: SEED_QUEST_ID.english, value: 30 },
    order: 5,
  },

  // ── Body & Energy ───────────────────────────────────────────────────────
  {
    id: 'bo-1',
    pathId: 'body-energy',
    title: 'Get Moving',
    description: 'Complete Move Your Body once.',
    requirement: { kind: 'questCompletions', questId: SEED_QUEST_ID.workout, value: 1 },
    order: 1,
  },
  {
    id: 'bo-2',
    pathId: 'body-energy',
    title: 'Consistent',
    description: 'Complete Move Your Body 7 times.',
    requirement: { kind: 'questCompletions', questId: SEED_QUEST_ID.workout, value: 7 },
    order: 2,
  },
  {
    id: 'bo-3',
    pathId: 'body-energy',
    title: 'Stronger',
    description: 'Reach Strength level 4.',
    requirement: { kind: 'statLevel', stat: 'STR', value: 4 },
    order: 3,
  },
  {
    id: 'bo-4',
    pathId: 'body-energy',
    title: 'Athlete',
    description: 'Complete Move Your Body 21 times.',
    requirement: { kind: 'questCompletions', questId: SEED_QUEST_ID.workout, value: 21 },
    order: 4,
  },

  // ── Mind & Reflection ───────────────────────────────────────────────────
  {
    id: 'mr-1',
    pathId: 'mind-reflection',
    title: 'Pause & Reflect',
    description: 'Complete Evening Reflection once.',
    requirement: { kind: 'questCompletions', questId: SEED_QUEST_ID.reflect, value: 1 },
    order: 1,
  },
  {
    id: 'mr-2',
    pathId: 'mind-reflection',
    title: 'Mindful Week',
    description: 'Complete Evening Reflection 7 times.',
    requirement: { kind: 'questCompletions', questId: SEED_QUEST_ID.reflect, value: 7 },
    order: 2,
  },
  {
    id: 'mr-3',
    pathId: 'mind-reflection',
    title: 'Centered',
    description: 'Reach Wisdom level 4.',
    requirement: { kind: 'statLevel', stat: 'WIS', value: 4 },
    order: 3,
  },
  {
    id: 'mr-4',
    pathId: 'mind-reflection',
    title: 'Sage',
    description: 'Complete Evening Reflection 20 times.',
    requirement: { kind: 'questCompletions', questId: SEED_QUEST_ID.reflect, value: 20 },
    order: 4,
  },

  // ── Money Discipline ────────────────────────────────────────────────────
  {
    id: 'mo-1',
    pathId: 'money-discipline',
    title: 'Track Once',
    description: 'Complete Track Your Coin once.',
    requirement: { kind: 'questCompletions', questId: SEED_QUEST_ID.budget, value: 1 },
    order: 1,
  },
  {
    id: 'mo-2',
    pathId: 'money-discipline',
    title: 'Budget Habit',
    description: 'Complete Track Your Coin 4 times.',
    requirement: { kind: 'questCompletions', questId: SEED_QUEST_ID.budget, value: 4 },
    order: 2,
  },
  {
    id: 'mo-3',
    pathId: 'money-discipline',
    title: 'Saver',
    description: 'Reach Coin level 3.',
    requirement: { kind: 'statLevel', stat: 'COIN', value: 3 },
    order: 3,
  },
  {
    id: 'mo-4',
    pathId: 'money-discipline',
    title: 'Disciplined',
    description: 'Complete Track Your Coin 12 times.',
    requirement: { kind: 'questCompletions', questId: SEED_QUEST_ID.budget, value: 12 },
    order: 4,
  },
];
