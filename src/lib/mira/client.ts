/**
 * Mira chat client — agent loop with Gemini + local tool execution.
 */
import { buildMiraContext } from './context';
import { executeMiraTools } from './tools';
import { apiHeaders, apiInit, apiUrl } from '../api';
import type {
  MiraChatResponse,
  MiraConversationTurn,
  MiraToolOptions,
} from './types';
import type { Language } from '../../types';

const MAX_TOOL_ROUNDS = 8;

async function miraChatTurn(
  turns: MiraConversationTurn[],
  locale: Language,
): Promise<MiraChatResponse> {
  const context = await buildMiraContext(locale);
  const res = await fetch(apiUrl('/mira/chat'), {
    ...apiInit(),
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify({ turns, context, locale }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    return { error: 'http_error', detail: text };
  }
  return (await res.json()) as MiraChatResponse;
}

export async function checkMiraStatus(): Promise<{ configured: boolean; model: string }> {
  try {
    const res = await fetch(apiUrl('/mira/status'), {
      ...apiInit(),
      signal: AbortSignal.timeout(2500),
    });
    if (!res.ok) return { configured: false, model: 'gemini-3.1-flash-lite' };
    return (await res.json()) as { configured: boolean; model: string };
  } catch {
    return { configured: false, model: 'gemini-3.1-flash-lite' };
  }
}

/**
 * Send a user message; runs tool calls locally until Mira returns text.
 */
export async function sendMiraMessage(
  userText: string,
  priorTurns: MiraConversationTurn[],
  locale: Language,
  options: MiraToolOptions = {},
): Promise<{ text: string; turns: MiraConversationTurn[] }> {
  const turns: MiraConversationTurn[] = [
    ...priorTurns,
    { role: 'user', text: userText },
  ];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const response = await miraChatTurn(turns, locale);

    if (response.error) {
      const msg =
        response.error === 'not_configured'
          ? response.detail ?? 'Gemini API key not configured'
          : response.detail ?? response.error;
      throw new Error(msg);
    }

    if (response.functionCalls?.length) {
      const functionResults = await executeMiraTools(
        response.functionCalls,
        locale,
        options,
      );
      turns.push({
        role: 'model',
        functionCalls: response.functionCalls,
        modelParts: response.modelParts,
      });
      turns.push({ role: 'user', functionResults });
      continue;
    }

    const text = response.text?.trim() ?? '';
    turns.push({ role: 'model', text, modelParts: response.modelParts });
    return { text, turns };
  }

  throw new Error('Mira took too many tool steps. Try a simpler request.');
}
