/**
 * Gemini chat handler for Mira.
 */
import {
  GoogleGenerativeAI,
  type Content,
  type Part,
} from '@google/generative-ai';
import { MIRA_FUNCTION_DECLARATIONS } from './tools.ts';
import { buildMiraSystemInstruction } from './system.ts';
import type {
  MiraChatRequest,
  MiraChatResponse,
  MiraConversationTurn,
  MiraFunctionCall,
  MiraModelPart,
} from '../../src/lib/mira/types.ts';

type LoosePart = Record<string, unknown>;

function cloneParts(parts: LoosePart[]): MiraModelPart[] {
  return JSON.parse(JSON.stringify(parts)) as MiraModelPart[];
}

function extractFunctionCalls(parts: LoosePart[]): MiraFunctionCall[] {
  const calls: MiraFunctionCall[] = [];
  for (const part of parts) {
    const fc = part.functionCall as
      | { name?: string; args?: Record<string, unknown>; id?: string }
      | undefined;
    if (!fc?.name) continue;
    calls.push({
      name: fc.name,
      args: (fc.args ?? {}) as Record<string, unknown>,
      callId: fc.id,
    });
  }
  return calls;
}

function responseModelParts(response: {
  candidates?: { content?: { parts?: LoosePart[] } }[];
}): MiraModelPart[] {
  const parts = response.candidates?.[0]?.content?.parts;
  return parts?.length ? cloneParts(parts) : [];
}

function turnsToContents(turns: MiraConversationTurn[]): Content[] {
  const contents: Content[] = [];

  for (const turn of turns) {
    if (turn.role === 'user') {
      if (turn.text) {
        contents.push({ role: 'user', parts: [{ text: turn.text }] });
      }
      if (turn.functionResults?.length) {
        const parts: Part[] = turn.functionResults.map((fr) => {
          const functionResponse: Record<string, unknown> = {
            name: fr.name,
            response: fr.response,
          };
          if (fr.callId) functionResponse.id = fr.callId;
          return { functionResponse } as Part;
        });
        contents.push({ role: 'user', parts });
      }
      continue;
    }

    if (turn.role === 'model') {
      if (turn.modelParts?.length) {
        contents.push({
          role: 'model',
          parts: turn.modelParts as Part[],
        });
        continue;
      }

      const parts: Part[] = [];
      if (turn.text) parts.push({ text: turn.text });
      if (turn.functionCalls?.length) {
        for (const fc of turn.functionCalls) {
          const functionCall: Record<string, unknown> = {
            name: fc.name,
            args: fc.args,
          };
          if (fc.callId) functionCall.id = fc.callId;
          parts.push({ functionCall } as Part);
        }
      }
      if (parts.length) contents.push({ role: 'model', parts });
    }
  }

  return contents;
}

export async function handleMiraChat(body: MiraChatRequest): Promise<MiraChatResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      error: 'not_configured',
      detail: 'GEMINI_API_KEY is missing. Add it to .env and restart dev:server.',
    };
  }

  const modelName = process.env.GEMINI_MODEL ?? 'gemini-3.1-flash-lite';
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
    tools: [{ functionDeclarations: MIRA_FUNCTION_DECLARATIONS }],
    systemInstruction: buildMiraSystemInstruction(body.context, body.locale),
  });

  try {
    const contents = turnsToContents(body.turns);
    const result = await model.generateContent({ contents });
    const response = result.response;
    const modelParts = responseModelParts(response);

    const functionCalls = extractFunctionCalls(modelParts);
    if (functionCalls.length > 0) {
      return { functionCalls, modelParts };
    }

    const text = response.text();
    return { text: text || '', modelParts: modelParts.length ? modelParts : undefined };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Mira Gemini error:', err);
    return { error: 'gemini_error', detail: message };
  }
}

export function miraStatus() {
  return {
    configured: Boolean(process.env.GEMINI_API_KEY),
    model: process.env.GEMINI_MODEL ?? 'gemini-3.1-flash-lite',
  };
}
