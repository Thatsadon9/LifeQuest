/**
 * Mira AI assistant — shared client/server chat types.
 */
import type { Language } from '../../types';

export interface MiraFunctionCall {
  name: string;
  args: Record<string, unknown>;
  /** Gemini 3 function-call id — must echo in functionResponse. */
  callId?: string;
}

export interface MiraFunctionResult {
  name: string;
  response: Record<string, unknown>;
  callId?: string;
}

/** Raw model parts from Gemini (includes thoughtSignature for Gemini 3). */
export type MiraModelPart = Record<string, unknown>;

/** One turn in the Gemini conversation (client ↔ server). */
export interface MiraConversationTurn {
  role: 'user' | 'model';
  text?: string;
  functionCalls?: MiraFunctionCall[];
  functionResults?: MiraFunctionResult[];
  /** Exact model parts from Gemini — required for Gemini 3 tool rounds. */
  modelParts?: MiraModelPart[];
}

export interface MiraGameContext {
  today: string;
  locale: Language;
  playerName: string;
  level: number;
  rank: string;
  totalXP: number;
  todayXP: number;
  momentumScore: number;
  recoveryMode: boolean;
  energyToday: number | null;
  habitsToday: {
    id: string;
    title: string;
    completed: boolean;
    skipped: boolean;
    progress?: number;
    targetCount?: number;
    trackMode: string;
  }[];
  questCount: number;
  activeQuestCount: number;
}

export interface MiraChatRequest {
  turns: MiraConversationTurn[];
  context: MiraGameContext;
  locale: Language;
}

export interface MiraChatResponse {
  text?: string;
  functionCalls?: MiraFunctionCall[];
  /** Pass back verbatim on the next turn (Gemini 3 thought signatures). */
  modelParts?: MiraModelPart[];
  error?: string;
  detail?: string;
}

export interface MiraStatusResponse {
  configured: boolean;
  model: string;
}

export interface MiraChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
}

export interface MiraToolOptions {
  navigate?: (path: string) => void;
}
