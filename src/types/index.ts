export type ThemeMode = 'light' | 'dark' | 'system';

export interface ChatAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  dataUrl?: string;
  content?: string;
}

export interface RoutingDecision {
  strategy: 'smart' | 'free' | 'direct';
  selectedModel: string;
  provider: string;
  reason: string;
  latencyMs?: number;
  fallbackOccurred?: boolean;
  confidenceScore?: number;
  taskClassification?: string;
  triedModels?: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  reasoningContent?: string;
  timestamp: string;
  modelUsed?: string;
  providerUsed?: string;
  routingDecision?: RoutingDecision;
  attachments?: ChatAttachment[];
  isStreaming?: boolean;
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
  capabilities: {
    text: boolean;
    vision: boolean;
    tools: boolean;
    reasoning?: boolean;
    json?: boolean;
  };
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
}

export interface UserSettings {
  theme: ThemeMode;
  compactMode: boolean;
  enterToSend: boolean;
  showTimestamps: boolean;
  showReasoningByDefault: boolean;
  voiceName: string;
  speechSpeed: number;
  autoSpeak: boolean;
  hapticFeedback: boolean;
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

export interface ProviderInfo {
  id: string;
  name: string;
  description: string;
  configured: boolean;
  baseUrl?: string;
  hasKey?: boolean;
  maskedKey?: string;
  enabled?: boolean;
}
