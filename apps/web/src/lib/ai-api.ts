import { ApiError, apiFetch, apiRequest, withApiAbort } from './api';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  suggestedQuestions: string[];
}

export interface ModelInfo {
  name: string;
  size: number;
  modifiedAt: string;
}

export interface AIHealthStatus {
  available: boolean;
  version?: string;
  models: string[];
  error?: string;
}

export interface AIConversation {
  id: string;
  userId: string;
  agentId: string;
  title: string;
  messages: AIConversationMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface AIConversationMessage {
  id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  model?: string;
  createdAt: string;
}

export interface ChatResponse {
  message: string;
  agent: string;
  model: string;
  fallback?: boolean;
}

export interface ChatRequest {
  message: string;
  conversationId?: string;
  agentId?: string;
  model?: string;
  history?: ChatMessage[];
  context?: Record<string, unknown>;
}

export type AIPreferences = {
  preferredModel?: string | null;
  preferredProvider?: string | null;
  temperature?: number | null;
  maxTokens?: number | null;
  responseStyle?: string | null;
  responseLanguage?: string | null;
  useEmoji?: boolean;
  enableStreaming?: boolean;
  enableSuggestions?: boolean;
  enableContextMemory?: boolean;
  enableAutoSave?: boolean;
  saveConversations?: boolean;
  shareForTraining?: boolean;
  anonymizeData?: boolean;
  defaultAgent?: string | null;
};

// ─────────────────────────────────────────────────────────────
// API Functions
// ─────────────────────────────────────────────────────────────

export async function getAIHealth(): Promise<AIHealthStatus> {
  return apiRequest<AIHealthStatus>('/api/ai/health');
}

export async function getAIModels(): Promise<{ models: ModelInfo[]; default: string }> {
  return apiRequest<{ models: ModelInfo[]; default: string }>('/api/ai/models');
}

export async function getAIAgents(): Promise<{ agents: AgentConfig[] }> {
  return apiRequest<{ agents: AgentConfig[] }>('/api/ai/agents');
}

export async function sendAIChat(request: ChatRequest, signal?: AbortSignal): Promise<ChatResponse> {
  return apiRequest<ChatResponse>('/api/ai/chat', {
    method: 'POST',
    body: JSON.stringify(request),
    signal,
  });
}

export interface AIStreamEvent {
  chunk?: string;
  done: boolean;
  model?: string;
  fallback?: boolean;
}

export class AIStreamError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'AIStreamError';
  }
}

export function isAIStreamUnsupported(error: unknown): boolean {
  return error instanceof ApiError && [405, 501].includes(error.status);
}

export async function* streamAIChat(
  request: ChatRequest,
  signal?: AbortSignal,
): AsyncGenerator<AIStreamEvent> {
  if (typeof document !== 'undefined') {
    try {
      const preview =
        document.cookie.includes('cfb_preview_demo=1') ||
        document.cookie.includes('cfb_session=preview-demo') ||
        window.localStorage.getItem('cfb_demo_data') === '1' ||
        window.location.hostname.endsWith('.trycloudflare.com');
      if (preview) {
        throw new Error('Preview uses the copilot engine instead of LLM streaming');
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes('copilot engine')) throw err;
    }
  }

  // 30s timeout for the initial connection — matches api.ts circuit breaker intent
  const timeoutController = new AbortController();
  const timedOut = () => timeoutController.abort(new DOMException('AI stream timed out', 'TimeoutError'));
  let timeoutId = setTimeout(timedOut, 30_000);

  // Merge user abort signal with our timeout signal
  const handleUserAbort = () => timeoutController.abort(new DOMException('AI request cancelled', 'AbortError'));
  signal?.addEventListener('abort', handleUserAbort, { once: true });
  if (signal?.aborted) handleUserAbort();

  let response: Response | undefined;
  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
  try {
    timeoutController.signal.throwIfAborted();
    response = await apiFetch('/api/ai/chat/stream', {
      method: 'POST',
      headers: { Accept: 'text/event-stream' },
      body: JSON.stringify(request),
      signal: timeoutController.signal,
    }, { fetcher: (url, init) => fetch(url, init) });
    clearTimeout(timeoutId);
    timeoutController.signal.throwIfAborted();

    if (response.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'text/event-stream') {
      throw new AIStreamError('Expected an AI event stream', 'AI_STREAM_INVALID');
    }
    reader = response.body?.getReader();
    if (!reader) throw new AIStreamError('No AI stream response body', 'AI_STREAM_INVALID');

    const decoder = new TextDecoder('utf-8', { fatal: true });
    let buffer = '';
    let dataLines: string[] = [];
    let eventType = '';
    let frameSize = 0;

    const parseEvent = (): AIStreamEvent | undefined => {
      const eventName = eventType;
      eventType = '';
      frameSize = 0;
      if (!dataLines.length) {
        if (eventName === 'error') throw new AIStreamError('AI stream failed', 'AI_STREAM_ERROR');
        return undefined;
      }
      const text = dataLines.join('\n');
      dataLines = [];
      let data: AIStreamEvent & { error?: string | { message?: string }; message?: string };
      try {
        data = JSON.parse(text);
      } catch {
        // Skip malformed data
        throw new AIStreamError('Malformed AI stream event', 'AI_STREAM_INVALID');
      }
      if (data && (eventName === 'error' || data.error)) {
        const message = typeof data.error === 'string' ? data.error : data.error?.message;
        throw new AIStreamError(message || data.message || 'AI stream failed', 'AI_STREAM_ERROR');
      }
      if (!data || typeof data !== 'object' || typeof data.done !== 'boolean' ||
        (data.chunk !== undefined && typeof data.chunk !== 'string') ||
        (data.model !== undefined && typeof data.model !== 'string') ||
        (data.fallback !== undefined && typeof data.fallback !== 'boolean')) {
        throw new AIStreamError('Invalid AI stream event', 'AI_STREAM_INVALID');
      }
      return data;
    };

    const consumeLine = (line: string): AIStreamEvent | undefined => {
      if (line === '') return parseEvent();
      if (line.startsWith(':')) return undefined;
      const colon = line.indexOf(':');
      const field = colon < 0 ? line : line.slice(0, colon);
      const value = colon < 0 ? '' : line.slice(colon + 1).replace(/^ /, '');
      if (field === 'data') {
        dataLines.push(value);
        frameSize += value.length;
        if (frameSize > 1_048_576) throw new AIStreamError('AI stream event too large', 'AI_STREAM_INVALID');
      } else if (field === 'event') {
        eventType = value;
      }
      return undefined;
    };

    while (true) {
      timeoutController.signal.throwIfAborted();
      timeoutId = setTimeout(timedOut, 30_000);
      const { done, value } = await withApiAbort(reader.read(), timeoutController.signal);
      clearTimeout(timeoutId);
      timeoutController.signal.throwIfAborted();
      buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });

      let separator: RegExpExecArray | null;
      while ((separator = /\r\n|\r|\n/.exec(buffer))) {
        if (!done && separator[0] === '\r' && separator.index === buffer.length - 1) break;
        const line = buffer.slice(0, separator.index);
        buffer = buffer.slice(separator.index + separator[0].length);
        const data = consumeLine(line);
        if (data) {
          timeoutController.signal.throwIfAborted();
          yield data;
          if (data.done) return;
        }
      }
      if (buffer.length > 1_048_576) throw new AIStreamError('AI stream event too large', 'AI_STREAM_INVALID');
      if (done) {
        if (buffer) consumeLine(buffer);
        const data = parseEvent();
        if (data) {
          yield data;
          if (data.done) return;
        }
        throw new AIStreamError('AI stream ended before completion', 'AI_STREAM_INCOMPLETE');
      }
    }
  } catch (err) {
    // Notify circuit breaker — only for real network errors, not user aborts
    if (
      typeof window !== 'undefined' &&
      !timeoutController.signal.aborted &&
      err instanceof TypeError
    ) {
      window.dispatchEvent(new Event('cfb:api-offline'));
    }
    if (timeoutController.signal.aborted) throw timeoutController.signal.reason;
    throw err;
  } finally {
    clearTimeout(timeoutId);
    signal?.removeEventListener('abort', handleUserAbort);
    try {
      if (reader) await reader.cancel().catch(() => {});
      else await response?.body?.cancel().catch(() => {});
    } finally {
      reader?.releaseLock();
    }
  }
}

// ─────────────────────────────────────────────────────────────
// Conversation Management
// ─────────────────────────────────────────────────────────────

export async function createAIConversation(data: {
  agentId?: string;
  title?: string;
  initialMessage?: string;
}): Promise<{ conversation: AIConversation }> {
  return apiRequest<{ conversation: AIConversation }>('/api/ai/conversations', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function listAIConversations(): Promise<{ conversations: AIConversation[] }> {
  return apiRequest<{ conversations: AIConversation[] }>('/api/ai/conversations');
}

export async function getAIConversation(id: string): Promise<{ conversation: AIConversation }> {
  return apiRequest<{ conversation: AIConversation }>(`/api/ai/conversations/${id}`);
}

export async function deleteAIConversation(id: string): Promise<{ deleted: boolean }> {
  return apiRequest<{ deleted: boolean }>(`/api/ai/conversations/${id}`, {
    method: 'DELETE',
  });
}

export async function getAIPreferences(): Promise<{ preferences: AIPreferences | null }> {
  return apiRequest<{ preferences: AIPreferences | null }>('/api/ai/preferences');
}

export async function updateAIPreferences(
  data: Partial<AIPreferences>,
): Promise<{ preferences: AIPreferences }> {
  return apiRequest<{ preferences: AIPreferences }>('/api/ai/preferences', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// ─────────────────────────────────────────────────────────────
// Async Job Queue (heavy generation)
// ─────────────────────────────────────────────────────────────

export type AIJobType = 'generate-document' | 'analyze-profile';

export interface AIJobRequest {
  type: AIJobType;
  agentId?: string;
  prompt?: string;
  conversationId?: string;
  model?: string;
  featureUsed?: string;
  targetUserId?: string;
}

export type AIJobState = 'waiting' | 'active' | 'completed' | 'failed' | 'delayed' | 'unknown';

export interface AIJobStatus {
  id: string;
  state: AIJobState;
  progress: number;
  result?: {
    message: string;
    model: string;
    fallback?: boolean;
    completedAt: string;
  };
  failedReason?: string;
}

export async function enqueueAIJob(request: AIJobRequest): Promise<{ queued: boolean; jobId?: string; message?: string }> {
  return apiRequest<{ queued: boolean; jobId?: string; message?: string }>('/api/ai/jobs', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function getAIJobStatus(jobId: string): Promise<AIJobStatus> {
  return apiRequest<AIJobStatus>(`/api/ai/jobs/${jobId}`);
}

// ─────────────────────────────────────────────────────────────
// Utility Functions
// ─────────────────────────────────────────────────────────────

export function formatModelName(name: string): string {
  // llama3.2:8b -> Llama 3.2 8B
  return name
    .replace(/([a-z])(\d)/gi, '$1 $2')
    .replace(/:/, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getAgentIcon(agentId: string): string {
  const icons: Record<string, string> = {
    general: '🤖',
    matching: '🤝',
    research: '🔬',
    'pitch-coach': '🎯',
    'mentor-finder': '👨‍🏫',
    'market-analyst': '📊',
    fundraising: '💰',
    'legal-advisor': '⚖️',
    'technical-advisor': '🔧',
    'growth-strategist': '📈',
  };
  return icons[agentId] || '🤖';
}
