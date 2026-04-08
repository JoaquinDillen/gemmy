import { App, Plugin, PluginSettingTab, Setting } from 'obsidian';
import type {
  GemmySettings,
  IGemmyPlugin,
  LLMProviderType,
  MessageTypeFlags,
  OutputMode,
  PersonalityPreset,
  ResponseLength,
} from './types';

export type { GemmySettings };

export const MODEL_DEFAULTS: Record<LLMProviderType, string> = {
  openrouter: 'meta-llama/llama-3.1-8b-instruct:free',
  groq:       'llama-3.3-70b-versatile',
  gemini:     'gemini-2.0-flash',
  openai:     'gpt-4o-mini',
  anthropic:  'claude-haiku-4-5-20251001',
};

/** Selectable models per provider, ordered cheapest/fastest first. */
export const MODEL_OPTIONS: Record<LLMProviderType, Record<string, string>> = {
  openrouter: {
    // Free models (no credits needed)
    'google/gemini-2.0-flash-exp:free':        '🆓 Gemini 2.0 Flash (free)',
    'meta-llama/llama-3.3-70b-instruct:free':  '🆓 Llama 3.3 70B (free)',
    'meta-llama/llama-3.1-8b-instruct:free':   '🆓 Llama 3.1 8B (free, fast)',
    'mistralai/mistral-7b-instruct:free':       '🆓 Mistral 7B (free)',
    'deepseek/deepseek-r1:free':                '🆓 DeepSeek R1 (free)',
    // Paid models (require credits)
    'openai/gpt-4o-mini':                       'GPT-4o Mini',
    'openai/gpt-4o':                            'GPT-4o',
    'anthropic/claude-3-5-haiku':               'Claude 3.5 Haiku',
    'anthropic/claude-3-5-sonnet':              'Claude 3.5 Sonnet',
    'google/gemini-2.0-flash':                  'Gemini 2.0 Flash',
    'google/gemini-1.5-pro':                    'Gemini 1.5 Pro',
  },
  groq: {
    'llama-3.3-70b-versatile':  'Llama 3.3 70B (default)',
    'llama-3.1-8b-instant':     'Llama 3.1 8B (fastest)',
    'llama3-70b-8192':          'Llama 3 70B',
    'llama3-8b-8192':           'Llama 3 8B',
    'gemma2-9b-it':             'Gemma 2 9B',
    'mixtral-8x7b-32768':       'Mixtral 8x7B',
  },
  gemini: {
    'gemini-2.0-flash':     'Gemini 2.0 Flash (default)',
    'gemini-2.0-flash-001': 'Gemini 2.0 Flash 001',
    'gemini-1.5-flash':     'Gemini 1.5 Flash',
    'gemini-1.5-flash-8b':  'Gemini 1.5 Flash 8B (fastest)',
    'gemini-1.5-pro':       'Gemini 1.5 Pro',
  },
  openai: {
    'gpt-4o-mini':   'GPT-4o Mini (default)',
    'gpt-4o':        'GPT-4o',
    'gpt-4-turbo':   'GPT-4 Turbo',
    'gpt-3.5-turbo': 'GPT-3.5 Turbo',
  },
  anthropic: {
    'claude-haiku-4-5-20251001':  'Claude Haiku 4.5 (default)',
    'claude-sonnet-4-6':          'Claude Sonnet 4.6',
    'claude-opus-4-6':            'Claude Opus 4.6',
    'claude-3-5-haiku-20241022':  'Claude 3.5 Haiku',
    'claude-3-5-sonnet-20241022': 'Claude 3.5 Sonnet',
  },
};

export const DEFAULT_SETTINGS: GemmySettings = {
  idleTalkFrequency: 5,
  writingModeGracePeriod: 5,
  llmProvider: 'openrouter',
  apiKey: '',
  modelName: 'meta-llama/llama-3.1-8b-instruct:free',
  maxTokens: 256,
  defaultOutputMode: 'reply',
  systemPrompt:
    'You are a concise writing assistant embedded in Obsidian. When asked to reply, be brief (1–3 sentences). When asked to write content, match the tone and style of a personal knowledge base note.',
  companionName: 'Gemmy',
  personalityPreset: 'wise-mentor',
  customPersonality: '',
  enableRandomMessages: false,
  randomMessageFrequency: 30,
  messageTypes: {
    jokes: true,
    writingTips: true,
    randomFacts: true,
    motivational: true,
    vaultObservations: false,
    timeAware: true,
  },
  silenceHoursStart: '22:00',
  silenceHoursEnd: '08:00',
  enableIdleTrigger: false,
  idleTriggerMinutes: 20,
  responseLength: 'balanced',
  locale: '',
  enableEmoji: true,
  enableSwearingFilter: true,
  maxWords: 60,
  bubbleBg: '#FFFFCB',
  bubbleTextColor: '#202020',
  bubbleFontSize: 13,
};

export class GemmySettingTab extends PluginSettingTab {
  plugin: IGemmyPlugin;

  constructor(app: App, plugin: IGemmyPlugin & Plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    this.renderBehaviourSection(containerEl);
    this.renderLLMSection(containerEl);
    this.renderAppearanceSection(containerEl);
    this.renderPersonalitySection(containerEl);
    this.renderCompanionSection(containerEl);
    this.renderVoiceSection(containerEl);
  }

  private renderBehaviourSection(el: HTMLElement): void {
    el.createEl('h3', { text: 'Behaviour' });

    new Setting(el)
      .setName('Idle talk frequency')
      .setDesc('How often Gemmy speaks when idle, in minutes.')
      .addSlider(s => s.setLimits(5, 60, 5).setValue(this.plugin.settings.idleTalkFrequency).setDynamicTooltip()
        .onChange(async v => { this.plugin.settings.idleTalkFrequency = v; await this.plugin.saveSettings(); }));

    new Setting(el)
      .setName('Writing mode grace period')
      .setDesc('Seconds before Gemmy reacts after you stop typing.')
      .addSlider(s => s.setLimits(5, 180, 5).setValue(this.plugin.settings.writingModeGracePeriod).setDynamicTooltip()
        .onChange(async v => { this.plugin.settings.writingModeGracePeriod = v; await this.plugin.saveSettings(); }));
  }

  private renderLLMSection(el: HTMLElement): void {
    el.createEl('h3', { text: 'AI / LLM' });

    new Setting(el)
      .setName('Provider')
      .addDropdown(d => d
        .addOption('openrouter', 'OpenRouter (free models available)')
        .addOption('groq', 'Groq (free)')
        .addOption('gemini', 'Gemini (Google)')
        .addOption('openai', 'OpenAI')
        .addOption('anthropic', 'Anthropic')
        .setValue(this.plugin.settings.llmProvider)
        .onChange(async v => {
          const p = v as LLMProviderType;
          this.plugin.settings.llmProvider = p;
          this.plugin.settings.modelName = MODEL_DEFAULTS[p];
          await this.plugin.saveSettings();
          this.display();
        }));

    new Setting(el)
      .setName('API key')
      .setDesc('Your API key for the selected provider.')
      .addText(t => {
        t.setPlaceholder('Paste your API key here').setValue(this.plugin.settings.apiKey)
          .onChange(async v => { this.plugin.settings.apiKey = v; await this.plugin.saveSettings(); });
        t.inputEl.type = 'password';
      });

    if (this.plugin.settings.llmProvider === 'openrouter') {
      new Setting(el)
        .setName('Model')
        .setDesc('Paste any model ID from openrouter.ai/models — free models end in :free')
        .addText(t => t
          .setPlaceholder('meta-llama/llama-3.1-8b-instruct:free')
          .setValue(this.plugin.settings.modelName)
          .onChange(async v => { this.plugin.settings.modelName = v.trim(); await this.plugin.saveSettings(); }));
    } else {
      new Setting(el)
        .setName('Model')
        .addDropdown(d => {
          const options = MODEL_OPTIONS[this.plugin.settings.llmProvider];
          for (const [id, label] of Object.entries(options)) d.addOption(id, label);
          d.setValue(this.plugin.settings.modelName);
          d.onChange(async v => { this.plugin.settings.modelName = v; await this.plugin.saveSettings(); });
        });
    }

    new Setting(el)
      .setName('Max tokens')
      .addSlider(s => s.setLimits(64, 1024, 64).setValue(this.plugin.settings.maxTokens).setDynamicTooltip()
        .onChange(async v => { this.plugin.settings.maxTokens = v; await this.plugin.saveSettings(); }));

    new Setting(el)
      .setName('Default output mode')
      .setDesc('Action taken when you press Enter in the prompt.')
      .addDropdown(d => d
        .addOption('reply', '💬 Reply (speech bubble)')
        .addOption('insert', '✍️ Insert at cursor')
        .addOption('append', '➕ Append to note')
        .setValue(this.plugin.settings.defaultOutputMode)
        .onChange(async v => { this.plugin.settings.defaultOutputMode = v as OutputMode; await this.plugin.saveSettings(); }));

    new Setting(el)
      .setName('System prompt')
      .setDesc('Instructions sent with every AI request.')
      .addTextArea(t => {
        t.setValue(this.plugin.settings.systemPrompt)
          .onChange(async v => { this.plugin.settings.systemPrompt = v; await this.plugin.saveSettings(); });
        t.inputEl.rows = 4;
        t.inputEl.style.width = '100%';
      });
  }

  private renderPersonalitySection(el: HTMLElement): void {
    el.createEl('h3', { text: 'Personality' });

    new Setting(el)
      .setName('Companion name')
      .addText(t => t.setValue(this.plugin.settings.companionName)
        .onChange(async v => { this.plugin.settings.companionName = v; await this.plugin.saveSettings(); }));

    new Setting(el)
      .setName('Personality preset')
      .addDropdown(d => d
        .addOption('wise-mentor', '🧙 Wise Mentor')
        .addOption('dry-bot', '🤖 Dry Bot')
        .addOption('eager-assistant', '🐶 Eager Assistant')
        .addOption('chaotic-gremlin', '😈 Chaotic Gremlin')
        .addOption('academic', '🎓 Academic')
        .addOption('custom', '✏️ Custom')
        .setValue(this.plugin.settings.personalityPreset)
        .onChange(async v => {
          this.plugin.settings.personalityPreset = v as PersonalityPreset;
          await this.plugin.saveSettings();
          this.display();
        }));

    if (this.plugin.settings.personalityPreset === 'custom') {
      new Setting(el)
        .setName('Custom personality')
        .setDesc('Describe how the companion should behave.')
        .addTextArea(t => {
          t.setValue(this.plugin.settings.customPersonality)
            .onChange(async v => { this.plugin.settings.customPersonality = v; await this.plugin.saveSettings(); });
          t.inputEl.rows = 3;
          t.inputEl.style.width = '100%';
        });
    }
  }

  private renderCompanionSection(el: HTMLElement): void {
    el.createEl('h3', { text: 'Companion Behaviour' });

    new Setting(el)
      .setName('Enable random messages')
      .setDesc('Let Gemmy speak up unprompted using AI.')
      .addToggle(t => t.setValue(this.plugin.settings.enableRandomMessages)
        .onChange(async v => { this.plugin.settings.enableRandomMessages = v; await this.plugin.saveSettings(); this.display(); }));

    if (this.plugin.settings.enableRandomMessages) {
      new Setting(el)
        .setName('Message frequency')
        .setDesc('Average minutes between messages.')
        .addSlider(s => s.setLimits(10, 60, 5).setValue(this.plugin.settings.randomMessageFrequency).setDynamicTooltip()
          .onChange(async v => { this.plugin.settings.randomMessageFrequency = v; await this.plugin.saveSettings(); }));

      const msgTypes: Array<[keyof MessageTypeFlags, string]> = [
        ['jokes', 'Jokes & puns'],
        ['writingTips', 'Writing tips'],
        ['randomFacts', 'Random facts'],
        ['motivational', 'Motivational nudges'],
        ['vaultObservations', 'Vault observations'],
        ['timeAware', 'Time-aware comments'],
      ];
      for (const [key, label] of msgTypes) {
        new Setting(el)
          .setName(label)
          .addToggle(t => t.setValue(this.plugin.settings.messageTypes[key])
            .onChange(async v => { this.plugin.settings.messageTypes[key] = v; await this.plugin.saveSettings(); }));
      }

      new Setting(el)
        .setName('Silence hours')
        .setDesc('Gemmy stays quiet between these times (HH:MM, 24h).')
        .addText(t => t.setPlaceholder('22:00').setValue(this.plugin.settings.silenceHoursStart)
          .onChange(async v => { this.plugin.settings.silenceHoursStart = v; await this.plugin.saveSettings(); }))
        .addText(t => t.setPlaceholder('08:00').setValue(this.plugin.settings.silenceHoursEnd)
          .onChange(async v => { this.plugin.settings.silenceHoursEnd = v; await this.plugin.saveSettings(); }));
    }

    new Setting(el)
      .setName('Idle trigger')
      .setDesc("Gemmy says something if you haven't interacted for a while.")
      .addToggle(t => t.setValue(this.plugin.settings.enableIdleTrigger)
        .onChange(async v => { this.plugin.settings.enableIdleTrigger = v; await this.plugin.saveSettings(); this.display(); }));

    if (this.plugin.settings.enableIdleTrigger) {
      new Setting(el)
        .setName('Idle trigger delay (minutes)')
        .addSlider(s => s.setLimits(5, 60, 5).setValue(this.plugin.settings.idleTriggerMinutes).setDynamicTooltip()
          .onChange(async v => { this.plugin.settings.idleTriggerMinutes = v; await this.plugin.saveSettings(); }));
    }
  }

  private renderAppearanceSection(el: HTMLElement): void {
    el.createEl('h3', { text: 'Appearance' });

    new Setting(el)
      .setName('Bubble background colour')
      .addText(t => {
        t.setValue(this.plugin.settings.bubbleBg)
          .onChange(async v => { this.plugin.settings.bubbleBg = v; await this.plugin.saveSettings(); });
        t.inputEl.type = 'color';
        t.inputEl.style.cssText = 'width:52px;height:32px;padding:2px;cursor:pointer';
      });

    new Setting(el)
      .setName('Bubble text colour')
      .addText(t => {
        t.setValue(this.plugin.settings.bubbleTextColor)
          .onChange(async v => { this.plugin.settings.bubbleTextColor = v; await this.plugin.saveSettings(); });
        t.inputEl.type = 'color';
        t.inputEl.style.cssText = 'width:52px;height:32px;padding:2px;cursor:pointer';
      });

    new Setting(el)
      .setName('Bubble font size')
      .setDesc('Size in pixels.')
      .addSlider(s => s.setLimits(10, 20, 1).setValue(this.plugin.settings.bubbleFontSize).setDynamicTooltip()
        .onChange(async v => { this.plugin.settings.bubbleFontSize = v; await this.plugin.saveSettings(); }));

    new Setting(el)
      .setName('Max response length (words)')
      .setDesc('Gemmy tries to stay within this many words. 0 = no limit.')
      .addSlider(s => s.setLimits(0, 200, 10).setValue(this.plugin.settings.maxWords).setDynamicTooltip()
        .onChange(async v => { this.plugin.settings.maxWords = v; await this.plugin.saveSettings(); }));
  }

  private renderVoiceSection(el: HTMLElement): void {
    el.createEl('h3', { text: 'Voice & Tone' });

    new Setting(el)
      .setName('Response length')
      .addDropdown(d => d
        .addOption('terse', 'Terse')
        .addOption('balanced', 'Balanced')
        .addOption('verbose', 'Verbose')
        .setValue(this.plugin.settings.responseLength)
        .onChange(async v => { this.plugin.settings.responseLength = v as ResponseLength; await this.plugin.saveSettings(); }));

    new Setting(el)
      .setName('Language / locale')
      .setDesc('Leave blank to auto-detect. Examples: en, pt-PT, fr.')
      .addText(t => t.setPlaceholder('auto').setValue(this.plugin.settings.locale)
        .onChange(async v => { this.plugin.settings.locale = v; await this.plugin.saveSettings(); }));

    new Setting(el)
      .setName('Enable emoji')
      .addToggle(t => t.setValue(this.plugin.settings.enableEmoji)
        .onChange(async v => { this.plugin.settings.enableEmoji = v; await this.plugin.saveSettings(); }));

    new Setting(el)
      .setName('Swearing filter')
      .setDesc('Keep responses family-friendly.')
      .addToggle(t => t.setValue(this.plugin.settings.enableSwearingFilter)
        .onChange(async v => { this.plugin.settings.enableSwearingFilter = v; await this.plugin.saveSettings(); }));
  }
}
