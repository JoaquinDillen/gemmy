import { LLMProvider } from './LLMProvider';

interface AnthropicMessage { role: string; content: string; }
interface AnthropicBlock { type: string; text: string; }
interface AnthropicResponse {
  content?: AnthropicBlock[];
  error?: { message: string };
}

/** Calls the Anthropic Messages API using fetch. */
export class AnthropicProvider implements LLMProvider {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.apiKey = apiKey;
    this.model = model;
  }

  /** @inheritdoc */
  async complete(prompt: string, systemPrompt?: string, maxTokens = 256): Promise<string> {
    const body: Record<string, unknown> = {
      model: this.model,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt } as AnthropicMessage],
    };
    if (systemPrompt) body['system'] = systemPrompt;

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        // Required for direct browser / Electron access (no CORS proxy).
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify(body),
    });

    const data = await res.json() as AnthropicResponse;
    if (data.error) throw new Error(data.error.message);
    const text = data.content?.[0]?.text;
    if (!text) throw new Error('Empty response from Anthropic');
    return text.trim();
  }
}
