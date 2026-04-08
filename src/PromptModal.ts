import { App, Modal, Notice } from 'obsidian';
import type { GemmySettings, OutputMode } from './types';
import type { LLMProvider } from './llm/LLMProvider';

/** Callback invoked when Gemmy should display a speech bubble. */
export type SpeechBubbleCallback = (text: string) => void;

/**
 * Small modal that lets the user type a prompt and choose an output mode.
 * Opens when the user clicks on Gemmy.
 */
export class PromptModal extends Modal {
  private settings: GemmySettings;
  private provider: LLMProvider;
  private systemPrompt: string;
  private onReply: SpeechBubbleCallback;

  constructor(
    app: App,
    settings: GemmySettings,
    provider: LLMProvider,
    systemPrompt: string,
    onReply: SpeechBubbleCallback,
  ) {
    super(app);
    this.settings = settings;
    this.provider = provider;
    this.systemPrompt = systemPrompt;
    this.onReply = onReply;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.addClass('gemmy-prompt-modal');
    contentEl.createEl('h3', { text: `Ask ${this.settings.companionName}` });

    const input = contentEl.createEl('input', { type: 'text', placeholder: 'Type your prompt…' });
    input.addClass('gemmy-prompt-input');
    input.focus();

    const spinner = contentEl.createDiv('gemmy-spinner');
    spinner.hide();

    const btnRow = contentEl.createDiv('gemmy-button-row');
    const replyBtn  = btnRow.createEl('button', { text: '💬 Reply' });
    const insertBtn = btnRow.createEl('button', { text: '✍️ Insert' });
    const appendBtn = btnRow.createEl('button', { text: '➕ Append' });

    const setLoading = (loading: boolean): void => {
      spinner.toggle(loading);
      replyBtn.disabled  = loading;
      insertBtn.disabled = loading;
      appendBtn.disabled = loading;
    };

    const submit = async (mode: OutputMode): Promise<void> => {
      const prompt = input.value.trim();
      if (!prompt) return;
      setLoading(true);
      try {
        const response = await this.provider.complete(prompt, this.systemPrompt, this.settings.maxTokens);
        this.close();
        await this.handleOutput(mode, response);
      } catch (err) {
        setLoading(false);
        const msg = err instanceof Error ? err.message : String(err);
        this.onReply(`⚠️ ${msg}`);
        this.close();
      }
    };

    replyBtn.addEventListener('click',  () => submit('reply'));
    insertBtn.addEventListener('click', () => submit('insert'));
    appendBtn.addEventListener('click', () => submit('append'));

    input.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter')  { e.preventDefault(); submit(this.settings.defaultOutputMode); }
      if (e.key === 'Escape') this.close();
    });
  }

  private async handleOutput(mode: OutputMode, text: string): Promise<void> {
    if (mode === 'reply') {
      this.onReply(text);
      return;
    }
    if (mode === 'insert') {
      const editor = this.app.workspace.activeEditor?.editor;
      if (editor) editor.replaceSelection(text);
      else new Notice('No active editor to insert into.');
      return;
    }
    // append
    const file = this.app.workspace.getActiveFile();
    if (file) {
      const content = await this.app.vault.read(file);
      await this.app.vault.modify(file, content + '\n\n' + text);
    } else {
      new Notice('No active file to append to.');
    }
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
