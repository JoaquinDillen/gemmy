import { LLMProvider } from './LLMProvider';

const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

interface GeminiPart { text: string; }
interface GeminiContent { parts: GeminiPart[]; }
interface GeminiCandidate { content: GeminiContent; }
interface GeminiResponse {
  candidates?: GeminiCandidate[];
  error?: { message: string };
}

/** Calls the Gemini REST API using fetch (no SDK dependency). */
export class GeminiProvider implements LLMProvider {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.apiKey = apiKey;
    this.model = model;
  }

  /** @inheritdoc */
  async complete(prompt: string, systemPrompt?: string, maxTokens = 256): Promise<string> {
    const url = `${BASE_URL}/${this.model}:generateContent?key=${this.apiKey}`;
    const body: Record<string, unknown> = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: maxTokens },
    };
    if (systemPrompt) {
      body['systemInstruction'] = { parts: [{ text: systemPrompt }] };
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json() as GeminiResponse;
    if (data.error) throw new Error(data.error.message);
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Empty response from Gemini');
    return text.trim();
  }
}
