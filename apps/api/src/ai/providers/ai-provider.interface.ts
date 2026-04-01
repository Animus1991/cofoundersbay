/**
 * IAIProvider — contract that every AI backend must satisfy.
 *
 * Adding a new provider (OpenAI, Anthropic, Groq, etc.) requires:
 *   1. Create a service that implements this interface
 *   2. Register it with AIProviderRegistry in onModuleInit
 *   3. Export from AIModule if needed by other modules
 *
 * The OllamaService is the reference implementation.
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface ProviderHealthStatus {
  available: boolean;
  /** e.g. 'ollama', 'openai', 'anthropic' */
  provider: string;
  version?: string;
  models: string[];
  error?: string;
}

export interface IAIProvider {
  /** Stable identifier used for registry lookup */
  readonly providerId: string;

  /** Network check — returns availability + metadata */
  checkHealth(): Promise<ProviderHealthStatus>;

  /** Synchronous flag — avoids network call in hot paths */
  isReady(): boolean;

  /** List model identifiers currently available via this provider */
  getAvailableModels(): string[];

  /** The model this provider uses when none is specified */
  getDefaultModel(): string;

  /** Single-shot completion — returns the full response string */
  chat(messages: ChatMessage[], options?: ChatOptions): Promise<string>;

  /** Streaming completion — yields content chunks as they arrive */
  chatStream(messages: ChatMessage[], options?: ChatOptions): AsyncGenerator<string, void, unknown>;
}
