import { AIModel, Conversation, ChatMessage, ProviderInfo, AdminCMSConfig, RoutingDecision } from '../types';

export interface ChatStreamCallbacks {
  onMeta?: (meta: { model: string; provider: string; routingDecision?: RoutingDecision }) => void;
  onDelta?: (delta: string) => void;
  onReasoning?: (reasoningChunk: string) => void;
  onError?: (error: string) => void;
  onDone?: () => void;
}

export const api = {
  // Models
  async getModels(refresh = false): Promise<AIModel[]> {
    const res = await fetch(`/api/models${refresh ? '?refresh=true' : ''}`);
    const json = await res.json();
    return json.data || [];
  },

  async getAvailableModels(): Promise<AIModel[]> {
    const res = await fetch('/api/models/available');
    const json = await res.json();
    return json.data || [];
  },

  async checkModelHealth(modelId: string): Promise<any> {
    const res = await fetch('/api/models/health-check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ modelId }),
    });
    return res.json();
  },

  async runBatchHealthCheck(): Promise<any> {
    const res = await fetch('/api/models/health-check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ batch: true }),
    });
    return res.json();
  },

  async getProviders(): Promise<ProviderInfo[]> {
    const res = await fetch('/api/providers');
    const json = await res.json();
    return json.data || [];
  },

  // Conversations
  async getConversations(): Promise<Conversation[]> {
    const res = await fetch('/api/conversations');
    const json = await res.json();
    return json.data || [];
  },

  async getConversation(id: string): Promise<Conversation> {
    const res = await fetch(`/api/conversations/${id}`);
    const json = await res.json();
    return json.data;
  },

  async createConversation(title?: string, modelUsed?: string): Promise<Conversation> {
    const res = await fetch('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, modelUsed }),
    });
    const json = await res.json();
    return json.data;
  },

  async updateConversation(id: string, updates: Partial<Conversation>): Promise<Conversation> {
    const res = await fetch(`/api/conversations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const json = await res.json();
    return json.data;
  },

  async deleteConversation(id: string): Promise<boolean> {
    const res = await fetch(`/api/conversations/${id}`, { method: 'DELETE' });
    const json = await res.json();
    return json.success;
  },

  async clearAllConversations(): Promise<boolean> {
    const res = await fetch('/api/conversations/clear', { method: 'POST' });
    const json = await res.json();
    return json.success;
  },

  // Search
  async search(query: string) {
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    const json = await res.json();
    return json.data || [];
  },

  // Chat Streaming
  async streamChat(
    params: {
      conversationId?: string;
      messages: Array<{ role: string; content: string; attachments?: any[] }>;
      modelId: string;
      temperature?: number;
    },
    callbacks: ChatStreamCallbacks,
    abortSignal?: AbortSignal
  ) {
    const res = await fetch('/api/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
      signal: abortSignal,
    });

    if (!res.ok) {
      const err = await res.text();
      callbacks.onError?.(err || `Server error (${res.status})`);
      return;
    }

    if (!res.body) {
      callbacks.onDone?.();
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;
          const jsonStr = trimmed.replace('data: ', '');

          try {
            const data = JSON.parse(jsonStr);
            if (data.type === 'meta') {
              callbacks.onMeta?.(data);
            } else if (data.type === 'reasoning') {
              callbacks.onReasoning?.(data.reasoningContent || '');
            } else if (data.type === 'delta') {
              callbacks.onDelta?.(data.content || '');
            } else if (data.type === 'error') {
              callbacks.onError?.(data.error || 'Unknown error');
            } else if (data.type === 'done') {
              callbacks.onDone?.();
            }
          } catch {
            // Malformed chunk ignore
          }
        }
      }
    } finally {
      reader.releaseLock();
      callbacks.onDone?.();
    }
  },

  // Admin APIs
  admin: {
    async getOverview() {
      const res = await fetch('/api/admin/overview');
      const json = await res.json();
      return json.data;
    },
    async getProviders(): Promise<ProviderInfo[]> {
      const res = await fetch('/api/admin/providers');
      const json = await res.json();
      return json.data || [];
    },
    async updateProvider(id: string, config: { apiKey?: string; baseUrl?: string; enabled?: boolean }) {
      const res = await fetch(`/api/admin/providers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      return res.json();
    },
    async testProvider(id: string) {
      const res = await fetch(`/api/admin/providers/${id}/test`, { method: 'POST' });
      return res.json();
    },
    async getModels(): Promise<AIModel[]> {
      const res = await fetch('/api/admin/models');
      const json = await res.json();
      return json.data || [];
    },
    async updateModel(id: string, override: Partial<AIModel>) {
      const res = await fetch('/api/admin/models/override', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelId: id, ...override }),
      });
      return res.json();
    },
    async checkModelHealth(id: string) {
      const res = await fetch('/api/admin/models/health-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelId: id }),
      });
      return res.json();
    },
    async getRouting() {
      const res = await fetch('/api/admin/routing');
      const json = await res.json();
      return json.data;
    },
    async updateRouting(config: any) {
      const res = await fetch('/api/admin/routing', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      return res.json();
    },
    async getCMS(): Promise<AdminCMSConfig> {
      const res = await fetch('/api/admin/cms');
      const json = await res.json();
      return json.data;
    },
    async updateCMS(cms: Partial<AdminCMSConfig>) {
      const res = await fetch('/api/admin/cms', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cms),
      });
      return res.json();
    },
    async getLogs(limit = 100) {
      const res = await fetch(`/api/admin/logs?limit=${limit}`);
      const json = await res.json();
      return json.data || [];
    },
  },
};
