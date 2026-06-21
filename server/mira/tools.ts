/**
 * Gemini function declarations for Mira — game read/write tools.
 */
import { SchemaType, type FunctionDeclaration } from '@google/generative-ai';

const statKey = {
  type: SchemaType.STRING,
  description: 'Stat key: INT, FOCUS, STR, WIS, CHA, CRAFT, or COIN',
};

export const MIRA_FUNCTION_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: 'get_today_summary',
    description:
      'Get detailed summary of today: habits, completions, XP earned today, pending items.',
    parameters: { type: SchemaType.OBJECT, properties: {} },
  },
  {
    name: 'get_character_summary',
    description: 'Get player profile, overall level, rank, and all seven stat levels/XP.',
    parameters: { type: SchemaType.OBJECT, properties: {} },
  },
  {
    name: 'list_quests',
    description: 'List quests/habits in the quest log with optional filters.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        activeOnly: { type: SchemaType.BOOLEAN },
        search: { type: SchemaType.STRING },
        type: {
          type: SchemaType.STRING,
          description: 'daily, weekly, one-time, or recovery',
        },
      },
    },
  },
  {
    name: 'get_quest',
    description: 'Get full details of one quest by id.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        questId: { type: SchemaType.STRING },
      },
      required: ['questId'],
    },
  },
  {
    name: 'create_quest',
    description: 'Create a new habit/quest.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        title: { type: SchemaType.STRING },
        description: { type: SchemaType.STRING },
        type: { type: SchemaType.STRING, description: 'daily, weekly, one-time, recovery' },
        difficulty: { type: SchemaType.STRING, description: 'easy, medium, hard, heroic' },
        baseXP: { type: SchemaType.NUMBER },
        stat: statKey,
        statWeight: { type: SchemaType.NUMBER, description: 'Default 1' },
        minimumVersion: { type: SchemaType.STRING },
        normalVersion: { type: SchemaType.STRING },
        heroVersion: { type: SchemaType.STRING },
        trigger: { type: SchemaType.STRING, description: 'Habit cue, e.g. After breakfast' },
        category: { type: SchemaType.STRING, description: 'main, support, or recovery' },
        trackMode: { type: SchemaType.STRING, description: 'binary or counter' },
        targetCount: { type: SchemaType.NUMBER },
        unit: { type: SchemaType.STRING },
        isActive: { type: SchemaType.BOOLEAN },
      },
      required: ['title'],
    },
  },
  {
    name: 'update_quest',
    description: 'Update fields on an existing quest by id.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        questId: { type: SchemaType.STRING },
        title: { type: SchemaType.STRING },
        description: { type: SchemaType.STRING },
        type: { type: SchemaType.STRING },
        difficulty: { type: SchemaType.STRING },
        baseXP: { type: SchemaType.NUMBER },
        stat: statKey,
        statWeight: { type: SchemaType.NUMBER },
        minimumVersion: { type: SchemaType.STRING },
        normalVersion: { type: SchemaType.STRING },
        heroVersion: { type: SchemaType.STRING },
        trigger: { type: SchemaType.STRING },
        category: { type: SchemaType.STRING },
        trackMode: { type: SchemaType.STRING },
        targetCount: { type: SchemaType.NUMBER },
        unit: { type: SchemaType.STRING },
        isActive: { type: SchemaType.BOOLEAN },
      },
      required: ['questId'],
    },
  },
  {
    name: 'delete_quest',
    description: 'Delete a quest and its completion history. Use only after user confirms.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        questId: { type: SchemaType.STRING },
        confirmed: {
          type: SchemaType.BOOLEAN,
          description: 'Must be true after the user explicitly confirms deletion in chat.',
        },
      },
      required: ['questId', 'confirmed'],
    },
  },
  {
    name: 'set_quest_active',
    description: 'Activate or deactivate a quest (inactive quests hide from Today).',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        questId: { type: SchemaType.STRING },
        active: { type: SchemaType.BOOLEAN },
      },
      required: ['questId', 'active'],
    },
  },
  {
    name: 'complete_habit',
    description: 'Mark a habit as done for today. Use increment_habit for counter habits not yet at target.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        questId: { type: SchemaType.STRING },
        tier: {
          type: SchemaType.STRING,
          description: 'minimum (50% XP), normal (100%), or hero (150%). Default normal.',
        },
      },
      required: ['questId'],
    },
  },
  {
    name: 'increment_habit',
    description: 'Add +1 to a counter habit (e.g. drink water). Awards XP when target reached.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        questId: { type: SchemaType.STRING },
      },
      required: ['questId'],
    },
  },
  {
    name: 'skip_habit',
    description: 'Skip a habit for today (no XP).',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        questId: { type: SchemaType.STRING },
      },
      required: ['questId'],
    },
  },
  {
    name: 'undo_habit_today',
    description: 'Undo today completion/skip for a habit.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        questId: { type: SchemaType.STRING },
      },
      required: ['questId'],
    },
  },
  {
    name: 'set_energy',
    description: 'Set daily energy check-in (1=depleted … 5=energised).',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        value: { type: SchemaType.NUMBER },
      },
      required: ['value'],
    },
  },
  {
    name: 'set_profile_name',
    description: "Change the player's display name.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        name: { type: SchemaType.STRING },
      },
      required: ['name'],
    },
  },
  {
    name: 'get_skill_tree_summary',
    description: 'Get skill tree progress across all paths.',
    parameters: { type: SchemaType.OBJECT, properties: {} },
  },
  {
    name: 'navigate_to',
    description: 'Navigate the app to a page: /, /quests, /character, /skills, /mira, /review, /settings',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        path: { type: SchemaType.STRING },
      },
      required: ['path'],
    },
  },
];
