import { debounce, Notice, Plugin } from 'obsidian';
import EMERGE_MOTION    from './animations/gemmy_emerge.gif';
import POP_MOTION       from './animations/gemmy_pop.gif';
import DISAPPEAR_MOTION from './animations/gemmy_disappear.gif';
import ANGRY_MOTION     from './animations/gemmy_angry.gif';
import LOOK_MOTION      from './animations/gemmy_lookAround.gif';
import IDLE_MOTION      from './animations/gemmy_idle.gif';
import DISAPPOINT_IMG   from './animations/gemmy_disappoint.gif';
import { DEFAULT_SETTINGS, GemmySettingTab } from './src/settings';
import type { GemmySettings } from './src/types';
import { GemmyChat } from './src/GemmyChat';
import { createProvider } from './src/llm/factory';
import { buildSystemPrompt } from './src/personality/buildSystemPrompt';
import { CompanionSystem } from './src/CompanionSystem';

const GEMMY_IDLE_QUOTES = [
	"Did you know that a vault is just a folder of plain text notes?",
	"I see you're checking out a ChatGPT plugin, would you consider me instead?",
	"You have plugins that you can update!",
	"Hi I'm Gemmy! Like Clippy but shinier!",
	"Everything is connected. Everything.",
	"Can't decide which note to work on? Try the Random Note core plugin!",
	"How tall would all your notes be if you stacked them up?",
	"Have you considered using Comic Sans?",
	"A blank page is just a masterpiece in waiting.",
];

const WRITING_MODE_QUOTES = [
	"Is that the best you can do? Keep writing!",
	"Write first, edit later.",
	"I love hearing your keyboard. Don't stop.",
	"Stuck? Try journaling what you did today.",
	"Maybe it's time to grab some water.",
	"Anything is better than a blank page. Write something!",
	"What's this? Writer's block already?",
	"You've got this! Every keystroke is a step closer to brilliance.",
	"Bold choice to open Obsidian and then do absolutely nothing.",
];

const BUBBLE_DURATION = 5000;

export default class Gemmy extends Plugin {
	settings!: GemmySettings;
	gemmyEl!: HTMLElement;
	imageEl!: HTMLImageElement;
	inWritingMode = false;
	idleTimeout = 0;
	writingModeTimeout = 0;
	appeared = false;

	private bubbleDismissTimer = 0;
	private gemmyChat!: GemmyChat;
	private companionSystem: CompanionSystem | null = null;

	async onload() {
		await this.loadSettings();

		const gemmyEl = this.gemmyEl = createDiv('gemmy-container');
		this.imageEl = gemmyEl.createEl('img', {});

		this.gemmyChat = new GemmyChat(this.app, gemmyEl);

		this.addCommand({ id: 'show',  name: 'Show Gemmy',  callback: () => this.appear() });
		this.addCommand({ id: 'hide',  name: 'Hide Gemmy',  callback: () => this.disappear() });
		this.addCommand({ id: 'enter-writing-mode', name: 'Enter writing mode', callback: () => this.enterWritingMode() });
		this.addCommand({ id: 'leave-writing-mode', name: 'Leave writing mode', callback: () => this.leaveWritingMode() });

		this.addSettingTab(new GemmySettingTab(this.app, this));

		// ── Click → open floating chat ──────────────────────────────────────
		gemmyEl.addEventListener('click', (e: MouseEvent) => {
			if ((e.target as HTMLElement).closest('.gemmy-speech-bubble')) return;
			if ((e.target as HTMLElement).closest('.gemmy-chat')) return;
			this.handleGemmyClick();
		});

		this.startNextIdleTimeout();

		this.registerEvent(this.app.workspace.on('editor-change', debounce(() => {
			if (!this.inWritingMode) return;
			this.disappear();
			this.setWritingModeTimeout();
		}, 500)));

		this.companionSystem = new CompanionSystem(this.app, this.settings, this.showSpeechBubble.bind(this));
		this.companionSystem.start();

		this.applyAppearanceStyles();
		this.app.workspace.onLayoutReady(this.appear.bind(this));
	}

	// ─── Chat / bubble ────────────────────────────────────────────────────────

	private handleGemmyClick(): void {
		if (!this.settings.apiKey) {
			new Notice(`Add your API key in ${this.settings.companionName || 'Gemmy'} settings.`);
			return;
		}
		const provider     = createProvider(this.settings);
		const systemPrompt = buildSystemPrompt(this.settings);
		this.gemmyChat.open(this.settings, provider, systemPrompt, this.showSpeechBubble.bind(this));
	}

	/** Show text in a speech bubble above Gemmy. Both idle quotes and LLM replies use this. */
	showSpeechBubble(text: string): void {
		this.gemmyEl.querySelector('.gemmy-speech-bubble')?.remove();
		window.clearTimeout(this.bubbleDismissTimer);

		const bubble = document.createElement('div');
		bubble.classList.add('gemmy-speech-bubble');
		if (text.length > 120) bubble.classList.add('gemmy-bubble-long');
		bubble.textContent = text;

		// Stack above the chat (if open) and image
		this.gemmyEl.insertBefore(bubble, this.imageEl);

		this.bubbleDismissTimer = window.setTimeout(() => bubble.remove(), 8000);
		bubble.addEventListener('click', (e: MouseEvent) => {
			e.stopPropagation();
			window.clearTimeout(this.bubbleDismissTimer);
			bubble.remove();
		});
	}

	/** Inject appearance CSS custom properties so the bubble colours update instantly. */
	applyAppearanceStyles(): void {
		const root = document.documentElement;
		root.style.setProperty('--gemmy-bubble-bg',        this.settings.bubbleBg        || '#FFFFCB');
		root.style.setProperty('--gemmy-bubble-color',     this.settings.bubbleTextColor  || '#202020');
		root.style.setProperty('--gemmy-bubble-font-size', `${this.settings.bubbleFontSize || 13}px`);
	}

	// ─── Animations / writing mode ───────────────────────────────────────────

	saySomething(quotes: string[], persistent: boolean) {
		if (!this.appeared) return;
		const quote = quotes[Math.floor(Math.random() * quotes.length)];
		this.showSpeechBubble(quote);

		if (this.inWritingMode) {
			this.imageEl.setAttribute('src', ANGRY_MOTION);
			setTimeout(() => this.imageEl.setAttribute('src', DISAPPOINT_IMG), 1000);
		} else {
			this.imageEl.setAttribute('src', LOOK_MOTION);
		}

		if (!persistent) {
			setTimeout(() => {
				this.gemmyEl.querySelector('.gemmy-speech-bubble')?.remove();
				this.imageEl.setAttribute('src', IDLE_MOTION);
			}, BUBBLE_DURATION);
		}
	}

	appear() {
		const { gemmyEl, imageEl } = this;

		if (this.inWritingMode) {
			imageEl.setAttribute('src', POP_MOTION);
			setTimeout(() => {
				this.appeared = true;
				this.saySomething(WRITING_MODE_QUOTES, true);
			}, 1800);
		} else {
			imageEl.setAttribute('src', EMERGE_MOTION);
			setTimeout(() => {
				imageEl.setAttribute('src', IDLE_MOTION);
				this.appeared = true;
			}, 3800);
		}

		document.body.appendChild(gemmyEl);
		gemmyEl.show();
	}

	disappear() {
		this.idleTimeout && window.clearTimeout(this.idleTimeout);
		this.writingModeTimeout && window.clearTimeout(this.writingModeTimeout);
		this.gemmyChat.close();

		this.imageEl.setAttribute('src', DISAPPEAR_MOTION);
		setTimeout(() => {
			this.gemmyEl.hide();
			this.appeared = false;
		}, 1300);
	}

	enterWritingMode() {
		this.inWritingMode = true;
		this.disappear();
		this.setWritingModeTimeout();
	}

	leaveWritingMode() {
		this.inWritingMode = false;
		this.disappear();
		window.clearTimeout(this.writingModeTimeout);
	}

	setWritingModeTimeout() {
		if (this.writingModeTimeout) window.clearTimeout(this.writingModeTimeout);
		this.writingModeTimeout = window.setTimeout(() => {
			if (!this.inWritingMode) return;
			this.appear();
		}, this.settings.writingModeGracePeriod * 1000);
	}

	startNextIdleTimeout() {
		const jitter = 0.8 + 0.4 * Math.random();
		const delay  = jitter * this.settings.idleTalkFrequency * 60_000;
		if (this.idleTimeout) window.clearTimeout(this.idleTimeout);
		this.idleTimeout = window.setTimeout(() => {
			if (this.inWritingMode) return;
			this.saySomething(GEMMY_IDLE_QUOTES, false);
			this.startNextIdleTimeout();
		}, delay);
	}

	onunload() {
		this.companionSystem?.stop();
		this.disappear();
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
		this.companionSystem?.updateSettings(this.settings);
		this.applyAppearanceStyles();
	}
}
