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
  dataUrl?: string;
  content?: string;
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
}

export interface AIResponse {
  id: string;
  content: string;
  reasoningContent?: string;
  model: string;
  provider: string;
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

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  pinned: boolean;
  archived: boolean;
  modelUsed?: string;
  messages: ChatMessage[];
}

export interface AdminCMSConfig {
  welcomeHeadline: string;
  welcomeSubheadline: string;
  promptSuggestions: Array<{
    id: string;
    title: string;
    prompt: string;
    category: 'writing' | 'coding' | 'reasoning' | 'productivity';
  }>;
  announcements: Array<{
    id: string;
    text: string;
    active: boolean;
    type: 'info' | 'update' | 'alert';
  }>;
  featureFlags: {
    voiceMode: boolean;
    fileAttachments: boolean;
    latexRendering: boolean;
    codeExecutionPreview: boolean;
    smartRouting: boolean;
  };
}

export interface RouterConfig {
  defaultRouter: 'smart' | 'free' | 'direct';
  smartRoutingEnabled: boolean;
  enableFallback: boolean;
  maxFallbacks: number;
  priorityWeights: {
    latency: number;
    health: number;
    capabilities: number;
    providerPreference: number;
  };
  preferredProviders: string[];
}
