import { LLMProvider } from './LLMProvider';

interface OAIMessage { role: string; content: string; }
interface OAIResponse {
  choices?: Array<{ message: OAIMessage }>;
  error?: { message: string };
}

/** Calls the Groq API (OpenAI-compatible) using fetch. Free tier, works from EU. */
export class GroqProvider implements LLMProvider {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.apiKey = apiKey;
    this.model = model;
  }

  /** @inheritdoc */
  async complete(prompt: string, systemPrompt?: string, maxTokens = 256): Promise<string> {
    const messages: OAIMessage[] = [];
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
    messages.push({ role: 'user', content: prompt });

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({ model: this.model, messages, max_tokens: maxTokens }),
    });

    const data = await res.json() as OAIResponse;
    if (data.error) throw new Error(data.error.message);
    const text = data.choices?.[0]?.message?.content;
    if (!text) throw new Error('Empty response from Groq');
    return text.trim();
  }
}
