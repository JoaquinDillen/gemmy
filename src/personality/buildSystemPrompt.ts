import type { GemmySettings, PersonalityPreset, ResponseLength } from '../types';

const PRESET_DESCRIPTIONS: Record<PersonalityPreset, string> = {
  'wise-mentor':
    'You are a thoughtful, slightly formal mentor. You use analogies to explain complex ideas and offer sage, measured advice.',
  'dry-bot':
    'You are a deadpan AI with dry humour and minimal words. You are occasionally sarcastic, always efficient.',
  'eager-assistant':
    'You are an enthusiastic and encouraging assistant. You celebrate the user\'s work and use exclamations freely.',
  'chaotic-gremlin':
    'You are unpredictable and absurdist. Your responses are chaotic but oddly insightful — a gremlin with wisdom.',
  'academic':
    'You are a scholarly academic who references papers and concepts, occasionally uses Latin phrases, and prizes precision.',
  'custom': '',
};

const LENGTH_INSTRUCTIONS: Record<ResponseLength, string> = {
  terse:    'Be extremely brief: one sentence maximum.',
  balanced: 'Be concise: 1–3 sentences.',
  verbose:  'You may elaborate with up to a short paragraph.',
};

/**
 * Constructs the full system prompt from the user's personality and AI settings.
 * Sent with every LLM request.
 */
export function buildSystemPrompt(settings: GemmySettings): string {
  const name = settings.companionName || 'Gemmy';

  const personality =
    settings.personalityPreset === 'custom'
      ? settings.customPersonality || PRESET_DESCRIPTIONS['eager-assistant']
      : PRESET_DESCRIPTIONS[settings.personalityPreset];

  const wordLimit = settings.maxWords > 0
    ? `Your response must be ${settings.maxWords} words or fewer.`
    : LENGTH_INSTRUCTIONS[settings.responseLength];

  const parts: string[] = [
    `You are ${name}, an AI writing companion embedded in Obsidian.`,
    personality,
    wordLimit,
    settings.enableEmoji
      ? 'You may use emoji sparingly to add personality.'
      : 'Do not use emoji.',
    settings.enableSwearingFilter
      ? 'Keep language clean and appropriate for all audiences.'
      : '',
    settings.locale ? `Respond in ${settings.locale}.` : '',
    settings.systemPrompt,
  ];

  return parts.filter(Boolean).join(' ');
}

export interface RandomMessageContext {
  hour?: number;
  stalestNoteDays?: number;
}

/**
 * Builds a one-off prompt that asks the LLM to generate an autonomous companion message.
 */
export function buildRandomMessagePrompt(
  settings: GemmySettings,
  context: RandomMessageContext,
): string {
  const { messageTypes } = settings;
  const pool: string[] = [];

  if (messageTypes.jokes)        pool.push('a clever joke or pun about writing or knowledge management');
  if (messageTypes.writingTips)  pool.push('a practical writing tip');
  if (messageTypes.randomFacts)  pool.push('a surprising, short fact');
  if (messageTypes.motivational) pool.push('a brief motivational nudge to keep writing');
  if (messageTypes.timeAware && context.hour !== undefined) {
    pool.push(`a short comment appropriate for ${context.hour}:00 — be aware of the time of day`);
  }
  if (messageTypes.vaultObservations && context.stalestNoteDays !== undefined) {
    pool.push(`an observation about a note that hasn't been touched in ${context.stalestNoteDays} days`);
  }

  if (pool.length === 0) return 'Say something brief and friendly.';

  const chosen = pool[Math.floor(Math.random() * pool.length)];
  return `Share ${chosen}. Keep it very short (1–2 sentences).`;
}
