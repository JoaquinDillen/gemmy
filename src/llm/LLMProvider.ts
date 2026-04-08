/** Abstraction over any LLM backend. */
export interface LLMProvider {
  /**
   * Send a prompt and return the text response.
   * @param prompt - The user's input text.
   * @param systemPrompt - Optional system/persona instructions.
   * @param maxTokens - Maximum tokens in the response.
   */
  complete(prompt: string, systemPrompt?: string, maxTokens?: number): Promise<string>;
}
