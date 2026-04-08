/** LLM backend provider options. */
export type LLMProviderType = 'openrouter' | 'groq' | 'gemini' | 'openai' | 'anthropic';

/** How Gemmy delivers its response. */
export type OutputMode = 'reply' | 'insert' | 'append';

/** Personality preset for the companion. */
export type PersonalityPreset =
  | 'wise-mentor'
  | 'dry-bot'
  | 'eager-assistant'
  | 'chaotic-gremlin'
  | 'academic'
  | 'custom';

/** Response verbosity preference. */
export type ResponseLength = 'terse' | 'balanced' | 'verbose';

/** Toggles for autonomous message categories. */
export interface MessageTypeFlags {
  jokes: boolean;
  writingTips: boolean;
  randomFacts: boolean;
  motivational: boolean;
  vaultObservations: boolean;
  timeAware: boolean;
}

/** Full plugin settings schema. */
export interface GemmySettings {
  // Original behaviour
  idleTalkFrequency: number;
  writingModeGracePeriod: number;

  // LLM
  llmProvider: LLMProviderType;
  apiKey: string;
  modelName: string;
  maxTokens: number;
  defaultOutputMode: OutputMode;
  systemPrompt: string;

  // Identity
  companionName: string;
  personalityPreset: PersonalityPreset;
  customPersonality: string;

  // Companion behaviour
  enableRandomMessages: boolean;
  randomMessageFrequency: number; // minutes
  messageTypes: MessageTypeFlags;
  silenceHoursStart: string; // HH:MM
  silenceHoursEnd: string;   // HH:MM
  enableIdleTrigger: boolean;
  idleTriggerMinutes: number;

  // Voice & tone
  responseLength: ResponseLength;
  locale: string;
  enableEmoji: boolean;
  enableSwearingFilter: boolean;
  maxWords: number; // 0 = no limit

  // Appearance
  bubbleBg: string;
  bubbleTextColor: string;
  bubbleFontSize: number; // px
}

/** Minimal interface for the plugin, used by GemmySettingTab to avoid circular imports. */
export interface IGemmyPlugin {
  settings: GemmySettings;
  saveSettings(): Promise<void>;
}
