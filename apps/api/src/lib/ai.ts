// Single wrapper for all Anthropic calls (CLAUDE.md: never call the SDK from route handlers).
// Prompts stay here; routes only pass validated domain inputs.
import axios, { AxiosError } from 'axios';
import { z } from 'zod';
import type { CefrLevel, Lang, MaterialType } from 'shared';
import { env } from './env';
import { AppError } from './errors';

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const MAX_RETRIES = 3;

interface AnthropicOptions {
  maxTokens: number;
  system?: string;
}

async function callAnthropic(prompt: string, options: AnthropicOptions): Promise<string> {
  for (let attempt = 1; ; attempt++) {
    try {
      const response = await axios.post(
        ANTHROPIC_URL,
        {
          model: env.ANTHROPIC_MODEL,
          max_tokens: options.maxTokens,
          ...(options.system ? { system: options.system } : {}),
          messages: [{ role: 'user', content: prompt }],
        },
        {
          headers: {
            'x-api-key': env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
          timeout: 120_000,
        },
      );

      const text: unknown = response.data?.content?.[0]?.text;
      if (typeof text !== 'string' || text.length === 0) {
        throw new AppError('INTERNAL', 'AI response had unexpected shape');
      }
      return text;
    } catch (error) {
      const status = error instanceof AxiosError ? error.response?.status : undefined;
      const retryable = status === 429 || status === 529 || (status !== undefined && status >= 500);
      if (attempt < MAX_RETRIES && (retryable || status === undefined)) {
        const delayMs = Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }
      if (error instanceof AppError) throw error;
      // Do not leak provider error details (may echo request content) to callers.
      throw new AppError('INTERNAL', 'AI service unavailable');
    }
  }
}

/** Extract the first JSON object from a model reply that may wrap it in prose/fences. */
function extractJson(text: string): unknown {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end <= start) throw new AppError('INTERNAL', 'AI returned non-JSON output');
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    throw new AppError('INTERNAL', 'AI returned malformed JSON');
  }
}

// ---- Quick translate (docs/04 §3) ----

const translateResultSchema = z.object({
  resultText: z.string().min(1),
  detectedLang: z.enum(['UZ', 'EN', 'RU']).optional(),
});

export interface QuickTranslateInput {
  text: string;
  fromLang: Lang | null;
  toLang: Lang;
  academic: boolean;
}

export interface QuickTranslateOutput {
  resultText: string;
  detectedLang?: Lang;
}

export async function quickTranslate(input: QuickTranslateInput): Promise<QuickTranslateOutput> {
  const system =
    'You are a professional translator for a university language center in Uzbekistan. ' +
    'Languages: UZ (Uzbek, Latin script), EN (English), RU (Russian). ' +
    'Respond with ONLY a JSON object: {"resultText": string, "detectedLang": "UZ"|"EN"|"RU"}. ' +
    'detectedLang is the language of the source text.';

  const prompt =
    `Translate the text ${input.fromLang ? `from ${input.fromLang} ` : '(detect the source language) '}` +
    `into ${input.toLang}.` +
    (input.academic ? ' Use precise academic terminology.' : '') +
    `\n\nText:\n${input.text}`;

  const raw = await callAnthropic(prompt, { maxTokens: 2048, system });
  const parsed = translateResultSchema.safeParse(extractJson(raw));
  if (!parsed.success) throw new AppError('INTERNAL', 'AI translation output failed validation');
  return parsed.data;
}

// ---- Learning materials (docs/04 §4) ----

const MATERIAL_TYPE_LABEL: Record<MaterialType, string> = {
  LESSON_PLAN: 'lesson plan',
  EXERCISES: 'set of exercises with an answer key',
  PRESENTATION: 'presentation outline',
  READING: 'reading passage with comprehension questions',
  TEST: 'test with an answer key',
  VOCABULARY: 'vocabulary list with definitions and example sentences',
};

export interface MaterialInput {
  subject: string;
  topic: string;
  level: CefrLevel;
  type: MaterialType;
  outputLang: Lang;
  notes?: string;
}

export async function generateMaterial(input: MaterialInput): Promise<string> {
  const system =
    'You are an experienced methodologist at a university language center. ' +
    'Produce ready-to-use teaching material in clean Markdown. Output only the material itself.';

  const prompt =
    `Create a ${MATERIAL_TYPE_LABEL[input.type]} for the subject "${input.subject}" ` +
    `on the topic "${input.topic}", CEFR level ${input.level}. ` +
    `Write the material in ${input.outputLang === 'UZ' ? 'Uzbek (Latin script)' : input.outputLang === 'RU' ? 'Russian' : 'English'}.` +
    (input.notes ? `\n\nAdditional instructions: ${input.notes}` : '');

  return callAnthropic(prompt, { maxTokens: 4096, system });
}
