import { App } from 'obsidian';
import type { GemmySettings } from './types';
import { createProvider } from './llm/factory';
import { buildSystemPrompt, buildRandomMessagePrompt } from './personality/buildSystemPrompt';

type SpeechBubbleCallback = (text: string) => void;

/** Returns true if the current local time falls within the silence window. */
function isInSilenceHours(start: string, end: string): boolean {
  const toMins = (t: string): number => {
    const [h, m] = t.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };
  const now = new Date();
  const current = now.getHours() * 60 + now.getMinutes();
  const s = toMins(start);
  const e = toMins(end);
  // Overnight range (e.g. 22:00 → 08:00)
  return s > e ? current >= s || current < e : current >= s && current < e;
}

/**
 * Manages Gemmy's autonomous behaviour:
 *  - Periodic random LLM-generated messages
 *  - Idle detection with contextual nudges
 */
export class CompanionSystem {
  private app: App;
  private settings: GemmySettings;
  private onBubble: SpeechBubbleCallback;
  private randomTimer = 0;
  private idleTimer = 0;
  private lastActivity = Date.now();
  private readonly activityHandler: () => void;

  constructor(app: App, settings: GemmySettings, onBubble: SpeechBubbleCallback) {
    this.app = app;
    this.settings = settings;
    this.onBubble = onBubble;
    this.activityHandler = () => { this.lastActivity = Date.now(); };
  }

  /** Start all autonomous timers and listeners. */
  start(): void {
    if (this.settings.enableRandomMessages) this.scheduleRandom();
    if (this.settings.enableIdleTrigger)    this.startIdleDetection();
  }

  /** Tear down all timers and listeners. */
  stop(): void {
    window.clearTimeout(this.randomTimer);
    window.clearTimeout(this.idleTimer);
    document.removeEventListener('mousemove', this.activityHandler);
    document.removeEventListener('keydown',   this.activityHandler);
  }

  /** Re-read settings (e.g. after user changes them) without restarting fully. */
  updateSettings(settings: GemmySettings): void {
    this.settings = settings;
  }

  private scheduleRandom(): void {
    const jitter = 0.8 + 0.4 * Math.random();
    const delay  = jitter * this.settings.randomMessageFrequency * 60_000;
    this.randomTimer = window.setTimeout(async () => {
      await this.sendRandomMessage();
      this.scheduleRandom();
    }, delay);
  }

  private async sendRandomMessage(): Promise<void> {
    if (!this.settings.apiKey) return;
    if (isInSilenceHours(this.settings.silenceHoursStart, this.settings.silenceHoursEnd)) return;

    try {
      const provider      = createProvider(this.settings);
      const systemPrompt  = buildSystemPrompt(this.settings);
      const stalestDays   = await this.getStalestNoteDays();
      const prompt        = buildRandomMessagePrompt(this.settings, {
        hour: new Date().getHours(),
        stalestNoteDays: stalestDays,
      });
      const response = await provider.complete(prompt, systemPrompt, 128);
      this.onBubble(response);
    } catch {
      // Autonomous messages fail silently — no need to alarm the user.
    }
  }

  private startIdleDetection(): void {
    document.addEventListener('mousemove', this.activityHandler);
    document.addEventListener('keydown',   this.activityHandler);
    this.scheduleIdleCheck();
  }

  private scheduleIdleCheck(): void {
    const delayMs = this.settings.idleTriggerMinutes * 60_000;
    this.idleTimer = window.setTimeout(async () => {
      const idleMs = Date.now() - this.lastActivity;
      if (idleMs >= delayMs) await this.sendIdleMessage();
      this.scheduleIdleCheck();
    }, delayMs);
  }

  private async sendIdleMessage(): Promise<void> {
    if (!this.settings.apiKey) return;
    if (isInSilenceHours(this.settings.silenceHoursStart, this.settings.silenceHoursEnd)) return;

    try {
      const provider     = createProvider(this.settings);
      const systemPrompt = buildSystemPrompt(this.settings);
      const prompt = `The user has been idle for ${this.settings.idleTriggerMinutes} minutes. ` +
        'Say something brief to check in or gently encourage them to get back to writing.';
      const response = await provider.complete(prompt, systemPrompt, 128);
      this.onBubble(response);
    } catch {
      // Fail silently.
    }
  }

  private async getStalestNoteDays(): Promise<number | undefined> {
    if (!this.settings.messageTypes.vaultObservations) return undefined;
    try {
      const files = this.app.vault.getMarkdownFiles();
      if (!files.length) return undefined;
      const oldest = files.reduce((a, b) => (a.stat.mtime < b.stat.mtime ? a : b));
      const days   = Math.floor((Date.now() - oldest.stat.mtime) / 86_400_000);
      return days > 0 ? days : undefined;
    } catch {
      return undefined;
    }
  }
}
