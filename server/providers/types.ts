export interface ModelCapabilities {
  text: boolean;
  vision: boolean;
  tools: boolean;
  reasoning?: boolean;
  json?: boolean;
}

export type ModelHealthStatus =
  | 'WORKING'
  | 'DEGRADED'
  | 'RATE_LIMITED'
  | 'AUTH_FAILED'
  | 'NOT_FOUND'
  | 'UNSUPPORTED'
  | 'TIMEOUT'
  | 'ERROR'
  | 'UNKNOWN';

export interface AIModel {
  id: string;
  provider: string;
  providerName: string;
  displayName: string;
  contextWindow?: number;
  capabilities: ModelCapabilities;
  status: 'available' | 'unavailable' | 'degraded' | 'unknown';
  health: ModelHealthStatus;
  healthMessage?: string;
  isFree: boolean;
  recommended?: boolean;
  latencyMs?: number;
  lastCheckedAt?: string;
  failureCount?: number;
  priority?: number;
  enabled?: boolean;
  pricing?: {
    prompt: number;
    completion: number;
  };
}

export interface ModelHealth {
  status: ModelHealthStatus;
  latencyMs: number;
  message?: string;
  checkedAt: string;
}

export interface ChatMessageAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  dataUrl?: string; // image preview or text snippet
  content?: string; // parsed text
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  modelUsed?: string;
  providerUsed?: string;
  routingDecision?: {
    strategy: 'smart' | 'free' | 'direct';
    selectedModel: string;
    provider: string;
    reason: string;
    latencyMs?: number;
    fallbackOccurred?: boolean;
    confidenceScore?: number;
    taskClassification?: string;
  };
  attachments?: ChatMessageAttachment[];
  reasoningContent?: string;
  isStreaming?: boolean;
}

export interface AIRequest {
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    attachments?: ChatMessageAttachment[];
  }>;
  modelId: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  tools?: string[];
  systemPrompt?: string;
}

export interface AIResponse {
  id: string;
  content: string;
  reasoningContent?: string;
  model: string;
  provider: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  latencyMs: number;
}

export interface AIStreamChunk {
  type: 'delta' | 'reasoning' | 'meta' | 'done' | 'error';
  content?: string;
  reasoningContent?: string;
  model?: string;
  provider?: string;
  latencyMs?: number;
  routingDecision?: ChatMessage['routingDecision'];
  error?: string;
}

export interface AIProvider {
  id: string;
  name: string;
  description: string;
  isConfigured(): boolean;
  listModels(): Promise<AIModel[]>;
  healthCheck(model: AIModel): Promise<ModelHealth>;
  generate(request: AIRequest): Promise<AIResponse>;
  stream(request: AIRequest): AsyncIterable<AIStreamChunk>;
}
