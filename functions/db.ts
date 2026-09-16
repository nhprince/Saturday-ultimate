import { AIModel, ChatMessage, Conversation, AdminCMSConfig, RouterConfig } from './types';

export interface EdgeStoreData {
  conversations: Record<string, Conversation>;
  providerSecrets: Record<string, { apiKey?: string; baseUrl?: string; enabled: boolean }>;
  modelOverrides: Record<string, Partial<AIModel>>;
  routerConfig: RouterConfig;
  cmsConfig: AdminCMSConfig;
  auditLogs: Array<{ id: string; timestamp: string; event: string; level: 'info' | 'warn' | 'error'; details?: any }>;
}

const DEFAULT_CMS: AdminCMSConfig = {
  welcomeHeadline: 'Saturday',
  welcomeSubheadline: 'What are we working on today?',
  promptSuggestions: [
    {
      id: 'sug-1',
      title: 'Help me plan my week',
      prompt: 'Help me plan an intentional, calm, and productive week balancing focused engineering and personal well-being.',
      category: 'productivity',
    },
    {
      id: 'sug-2',
      title: 'Explain something difficult',
      prompt: 'Explain how attention mechanisms in transformer neural networks operate using an intuitive analogy and LaTeX equations for query, key, and value matrices.',
      category: 'reasoning',
    },
    {
      id: 'sug-3',
      title: 'Write something for me',
      prompt: 'Draft an elegant, understated release announcement for our minimalist AI companion, Saturday.',
      category: 'writing',
    },
    {
      id: 'sug-4',
      title: 'Help me build an idea',
      prompt: 'Architect a low-latency, zero-cost edge routing pipeline for LLMs that guarantees 99.9% uptime with intelligent fallback.',
      category: 'coding',
    },
  ],
  announcements: [
    {
      id: 'ann-1',
      text: 'Saturday v1.0 active — Cloudflare Pages Serverless Edge discovery & autonomous fallbacks online.',
      active: true,
      type: 'info',
    },
  ],
  featureFlags: {
    voiceMode: true,
    fileAttachments: true,
    latexRendering: true,
    codeExecutionPreview: true,
    smartRouting: true,
  },
};

const DEFAULT_ROUTER_CONFIG: RouterConfig = {
  defaultRouter: 'smart',
  smartRoutingEnabled: true,
  enableFallback: true,
  maxFallbacks: 3,
  priorityWeights: {
    latency: 0.25,
    health: 0.35,
    capabilities: 0.3,
    providerPreference: 0.1,
  },
  preferredProviders: ['cloudflare', 'nvidia', 'openrouter', 'saturday'],
};

// In-memory store per worker isolate
const memoryStore: EdgeStoreData = {
  conversations: {},
  providerSecrets: {
    nvidia: { enabled: true, baseUrl: 'https://integrate.api.nvidia.com/v1' },
    openrouter: { enabled: true, baseUrl: 'https://openrouter.ai/api/v1' },
    cloudflare: { enabled: true },
    saturday: { enabled: true },
  },
  modelOverrides: {},
  routerConfig: DEFAULT_ROUTER_CONFIG,
  cmsConfig: DEFAULT_CMS,
  auditLogs: [],
};

export class EdgeStore {
  private env: any;

  constructor(env: any = {}) {
    this.env = env;
  }

  // Provider keys from Cloudflare env vars or in-memory config
  getProviderKey(providerId: string): string | undefined {
    const memoryKey = memoryStore.providerSecrets[providerId]?.apiKey;
    if (memoryKey) return memoryKey;

    if (providerId === 'nvidia') {
      return this.env?.NVIDIA_NIM_API_KEY || this.env?.NVIDIA_API_KEY;
    }
    if (providerId === 'openrouter') {
      return this.env?.OPENROUTER_API_KEY;
    }
    if (providerId === 'cloudflare') {
      return this.env?.CLOUDFLARE_API_KEY || this.env?.CF_API_TOKEN;
    }
    return undefined;
  }

  getProviderSecrets() {
    return memoryStore.providerSecrets;
  }

  updateProviderConfig(providerId: string, config: { apiKey?: string; baseUrl?: string; enabled?: boolean }) {
    if (!memoryStore.providerSecrets[providerId]) {
      memoryStore.providerSecrets[providerId] = { enabled: true };
    }
    if (config.apiKey !== undefined) memoryStore.providerSecrets[providerId].apiKey = config.apiKey;
    if (config.baseUrl !== undefined) memoryStore.providerSecrets[providerId].baseUrl = config.baseUrl;
    if (config.enabled !== undefined) memoryStore.providerSecrets[providerId].enabled = config.enabled;
    this.addLog('info', `Provider config updated for ${providerId}`, { providerId, enabled: config.enabled });
  }

  // Conversations
  listConversations(): Conversation[] {
    return Object.values(memoryStore.conversations).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  getConversation(id: string): Conversation | undefined {
    return memoryStore.conversations[id];
  }

  saveConversation(conv: Conversation): Conversation {
    memoryStore.conversations[conv.id] = {
      ...conv,
      updatedAt: new Date().toISOString(),
    };
    return memoryStore.conversations[conv.id];
  }

  deleteConversation(id: string): boolean {
    if (memoryStore.conversations[id]) {
      delete memoryStore.conversations[id];
      return true;
    }
    return false;
  }

  clearAllConversations(): void {
    memoryStore.conversations = {};
  }

  // Overrides & Config
  getModelOverrides(): Record<string, Partial<AIModel>> {
    return memoryStore.modelOverrides;
  }

  setModelOverride(modelId: string, override: Partial<AIModel>) {
    memoryStore.modelOverrides[modelId] = {
      ...memoryStore.modelOverrides[modelId],
      ...override,
    };
  }

  getRouterConfig(): RouterConfig {
    return memoryStore.routerConfig;
  }

  updateRouterConfig(config: Partial<RouterConfig>) {
    memoryStore.routerConfig = {
      ...memoryStore.routerConfig,
      ...config,
    };
    this.addLog('info', 'Router configuration updated', { config });
  }

  getCMSConfig(): AdminCMSConfig {
    return memoryStore.cmsConfig;
  }

  updateCMSConfig(cms: Partial<AdminCMSConfig>) {
    memoryStore.cmsConfig = {
      ...memoryStore.cmsConfig,
      ...cms,
    };
    this.addLog('info', 'CMS configuration updated');
  }

  getLogs(limit = 100) {
    return [...memoryStore.auditLogs].slice(-limit).reverse();
  }

  addLog(level: 'info' | 'warn' | 'error', event: string, details?: Record<string, any>) {
    memoryStore.auditLogs.push({
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      timestamp: new Date().toISOString(),
      event,
      level,
      details,
    });
    if (memoryStore.auditLogs.length > 500) {
      memoryStore.auditLogs = memoryStore.auditLogs.slice(-500);
    }
  }
}
