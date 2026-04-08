import { App, Notice } from 'obsidian';
import type { GemmySettings, OutputMode } from './types';
import type { LLMProvider } from './llm/LLMProvider';

type ReplyCallback = (text: string) => void;

/**
 * Floating chat panel anchored inside the Gemmy container.
 * Appears above Gemmy when the user clicks him; dismissed on submit or Escape.
 */
export class GemmyChat {
  private app: App;
  private container: HTMLElement;
  private chatEl: HTMLElement | null = null;
  private outsideHandler: ((e: MouseEvent) => void) | null = null;

  constructor(app: App, container: HTMLElement) {
    this.app = app;
    this.container = container;
  }

  get isOpen(): boolean { return this.chatEl !== null; }

  /**
   * Open the chat panel with fresh settings/provider.
   * If already open, close it first (toggle behaviour).
   */
  open(
    settings: GemmySettings,
    provider: LLMProvider,
    systemPrompt: string,
    onReply: ReplyCallback,
  ): void {
    if (this.isOpen) { this.close(); return; }

    const chat = document.createElement('div');
    chat.classList.add('gemmy-chat');
    this.chatEl = chat;

    // ── Input ──────────────────────────────────────────────────────────────
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = `Ask ${settings.companionName}…`;
    input.classList.add('gemmy-chat-input');
    chat.appendChild(input);

    // ── Spinner ────────────────────────────────────────────────────────────
    const spinner = document.createElement('div');
    spinner.classList.add('gemmy-spinner');
    spinner.style.display = 'none';
    chat.appendChild(spinner);

    // ── Buttons ────────────────────────────────────────────────────────────
    const btnRow = document.createElement('div');
    btnRow.classList.add('gemmy-chat-buttons');

    const mkBtn = (icon: string, title: string): HTMLButtonElement => {
      const b = document.createElement('button');
      b.textContent = icon;
      b.title = title;
      btnRow.appendChild(b);
      return b;
    };
    const replyBtn  = mkBtn('💬', 'Reply in bubble');
    const insertBtn = mkBtn('✍️', 'Insert at cursor');
    const appendBtn = mkBtn('➕', 'Append to note');
    chat.appendChild(btnRow);

    // ── Logic ──────────────────────────────────────────────────────────────
    const setLoading = (on: boolean): void => {
      spinner.style.display = on ? 'flex' : 'none';
      replyBtn.disabled = insertBtn.disabled = appendBtn.disabled = on;
    };

    const submit = async (mode: OutputMode): Promise<void> => {
      const prompt = input.value.trim();
      if (!prompt) return;
      setLoading(true);
      try {
        const response = await provider.complete(prompt, systemPrompt, settings.maxTokens);
        this.close();
        await this.handleOutput(mode, response, onReply);
      } catch (err) {
        setLoading(false);
        const msg = err instanceof Error ? err.message : String(err);
        onReply(`⚠️ ${msg}`);
        this.close();
      }
    };

    replyBtn.addEventListener('click',  (e) => { e.stopPropagation(); submit('reply'); });
    insertBtn.addEventListener('click', (e) => { e.stopPropagation(); submit('insert'); });
    appendBtn.addEventListener('click', (e) => { e.stopPropagation(); submit('append'); });

    input.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter')  { e.preventDefault(); submit(settings.defaultOutputMode); }
      if (e.key === 'Escape') this.close();
    });

    // Stop clicks inside the chat from bubbling to the document close handler.
    chat.addEventListener('click', (e) => e.stopPropagation());

    // Insert as the first child of the container so it stacks above the bubble and image.
    this.container.insertBefore(chat, this.container.firstChild);
    input.focus();

    // Close when clicking anywhere outside the container.
    this.outsideHandler = (e: MouseEvent) => {
      if (!this.container.contains(e.target as Node)) this.close();
    };
    setTimeout(() => document.addEventListener('click', this.outsideHandler!), 50);
  }

  close(): void {
    if (this.outsideHandler) {
      document.removeEventListener('click', this.outsideHandler);
      this.outsideHandler = null;
    }
    this.chatEl?.remove();
    this.chatEl = null;
  }

  private async handleOutput(mode: OutputMode, text: string, onReply: ReplyCallback): Promise<void> {
    if (mode === 'reply') { onReply(text); return; }
    if (mode === 'insert') {
      const editor = this.app.workspace.activeEditor?.editor;
      if (editor) editor.replaceSelection(text);
      else new Notice('No active editor to insert into.');
      return;
    }
    const file = this.app.workspace.getActiveFile();
    if (file) {
      const content = await this.app.vault.read(file);
      await this.app.vault.modify(file, content + '\n\n' + text);
    } else {
      new Notice('No active file to append to.');
    }
  }
}
