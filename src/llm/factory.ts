import { LLMProvider } from './LLMProvider';
import { GeminiProvider } from './GeminiProvider';
import { OpenAIProvider } from './OpenAIProvider';
import { AnthropicProvider } from './AnthropicProvider';
import { GroqProvider } from './GroqProvider';
import { OpenRouterProvider } from './OpenRouterProvider';
import type { GemmySettings } from '../types';

/**
 * Returns the appropriate LLM provider based on the current plugin settings.
 */
export function createProvider(settings: GemmySettings): LLMProvider {
  const { llmProvider, apiKey, modelName } = settings;
  switch (llmProvider) {
    case 'openrouter': return new OpenRouterProvider(apiKey, modelName);
    case 'groq':       return new GroqProvider(apiKey, modelName);
    case 'openai':     return new OpenAIProvider(apiKey, modelName);
    case 'anthropic':  return new AnthropicProvider(apiKey, modelName);
    case 'gemini':
    default:           return new GeminiProvider(apiKey, modelName);
  }
}
