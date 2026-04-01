import { apiRequest } from './api';

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
  context?: Record<string, any>;
}

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

export async function sendAIChat(request: ChatRequest): Promise<ChatResponse> {
  return apiRequest<ChatResponse>('/api/ai/chat', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function* streamAIChat(
  request: ChatRequest,
  signal?: AbortSignal,
): AsyncGenerator<{ chunk?: string; done: boolean; model?: string; fallback?: boolean }> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

  // 30s timeout for the initial connection — matches api.ts circuit breaker intent
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), 30_000);

  // Merge user abort signal with our timeout signal
  const handleUserAbort = () => timeoutController.abort();
  signal?.addEventListener('abort', handleUserAbort);

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/ai/chat/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      credentials: 'include',
      signal: timeoutController.signal,
    });
  } catch (err) {
    clearTimeout(timeoutId);
    signal?.removeEventListener('abort', handleUserAbort);
    // Notify circuit breaker — only for real network errors, not user aborts
    if (
      typeof window !== 'undefined' &&
      !(err instanceof DOMException && err.name === 'AbortError')
    ) {
      window.dispatchEvent(new Event('cfb:api-offline'));
    }
    throw err;
  }

  clearTimeout(timeoutId);
  signal?.removeEventListener('abort', handleUserAbort);

  if (!response.ok) {
    throw new Error(`AI stream error: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6));
          yield data;
          if (data.done) return;
        } catch {
          // Skip malformed data
        }
      }
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
