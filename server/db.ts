import fs from 'fs';
import path from 'path';
import { AIModel, ChatMessage, ChatMessageAttachment } from './providers/types';

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

export interface ProviderSecretConfig {
  [providerId: string]: {
    apiKey?: string;
    baseUrl?: string;
    enabled: boolean;
    customHeaders?: Record<string, string>;
  };
}

export interface SystemAuditLog {
  id: string;
  timestamp: string;
  event: string;
  level: 'info' | 'warn' | 'error';
  details?: Record<string, any>;
}

interface StorageData {
  conversations: Record<string, Conversation>;
  providerSecrets: ProviderSecretConfig;
  modelOverrides: Record<string, Partial<AIModel>>;
  routerConfig: RouterConfig;
  cmsConfig: AdminCMSConfig;
  auditLogs: SystemAuditLog[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'saturday-store.json');

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
      text: 'Saturday v1.0 active — Dynamic NVIDIA NIM discovery, Smart Router & Edge Fallbacks online.',
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
  preferredProviders: ['nvidia', 'openrouter', 'cloudflare', 'saturday'],
};

class Database {
  private data: StorageData;

  constructor() {
    this.data = {
      conversations: {},
      providerSecrets: {
        nvidia: {
          apiKey: process.env.NVIDIA_NIM_API_KEY || '',
          baseUrl: 'https://integrate.api.nvidia.com/v1',
          enabled: true,
        },
        openrouter: {
          apiKey: process.env.OPENROUTER_API_KEY || '',
          baseUrl: 'https://openrouter.ai/api/v1',
          enabled: true,
        },
        cloudflare: {
          apiKey: process.env.CLOUDFLARE_API_KEY || '',
          baseUrl: 'https://api.cloudflare.com/client/v4/accounts',
          enabled: true,
        },
        saturday: {
          enabled: true,
        },
      },
      modelOverrides: {},
      routerConfig: DEFAULT_ROUTER_CONFIG,
      cmsConfig: DEFAULT_CMS,
      auditLogs: [],
    };
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        this.data = {
          ...this.data,
          ...parsed,
          cmsConfig: { ...DEFAULT_CMS, ...(parsed.cmsConfig || {}) },
          routerConfig: { ...DEFAULT_ROUTER_CONFIG, ...(parsed.routerConfig || {}) },
          providerSecrets: { ...this.data.providerSecrets, ...(parsed.providerSecrets || {}) },
        };
      } else {
        this.save();
      }
    } catch (err) {
      console.error('Failed to load storage, using in-memory defaults:', err);
    }
  }

  private save() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist database:', err);
    }
  }

  // Conversations
  listConversations(): Conversation[] {
    return Object.values(this.data.conversations).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  getConversation(id: string): Conversation | undefined {
    return this.data.conversations[id];
  }

  saveConversation(conv: Conversation): Conversation {
    this.data.conversations[conv.id] = {
      ...conv,
      updatedAt: new Date().toISOString(),
    };
    this.save();
    return this.data.conversations[conv.id];
  }

  deleteConversation(id: string): boolean {
    if (this.data.conversations[id]) {
      delete this.data.conversations[id];
      this.save();
      return true;
    }
    return false;
  }

  clearAllConversations(): void {
    this.data.conversations = {};
    this.save();
  }

  // Provider Secrets & Config
  getProviderSecrets(): ProviderSecretConfig {
    return this.data.providerSecrets;
  }

  getProviderKey(providerId: string): string | undefined {
    return this.data.providerSecrets[providerId]?.apiKey || process.env[`${providerId.toUpperCase()}_API_KEY`];
  }

  updateProviderConfig(providerId: string, config: { apiKey?: string; baseUrl?: string; enabled?: boolean }) {
    if (!this.data.providerSecrets[providerId]) {
      this.data.providerSecrets[providerId] = { enabled: true };
    }
    if (config.apiKey !== undefined) {
      this.data.providerSecrets[providerId].apiKey = config.apiKey;
    }
    if (config.baseUrl !== undefined) {
      this.data.providerSecrets[providerId].baseUrl = config.baseUrl;
    }
    if (config.enabled !== undefined) {
      this.data.providerSecrets[providerId].enabled = config.enabled;
    }
    this.addLog('info', `Provider config updated for ${providerId}`, { providerId, enabled: config.enabled });
    this.save();
  }

  // Model Overrides (admin enable/disable, capability overrides)
  getModelOverrides(): Record<string, Partial<AIModel>> {
    return this.data.modelOverrides;
  }

  setModelOverride(modelId: string, override: Partial<AIModel>) {
    this.data.modelOverrides[modelId] = {
      ...this.data.modelOverrides[modelId],
      ...override,
    };
    this.save();
  }

  // Router Config
  getRouterConfig(): RouterConfig {
    return this.data.routerConfig;
  }

  updateRouterConfig(config: Partial<RouterConfig>) {
    this.data.routerConfig = {
      ...this.data.routerConfig,
      ...config,
    };
    this.addLog('info', 'Router configuration updated', { config });
    this.save();
  }

  // CMS
  getCMSConfig(): AdminCMSConfig {
    return this.data.cmsConfig;
  }

  updateCMSConfig(cms: Partial<AdminCMSConfig>) {
    this.data.cmsConfig = {
      ...this.data.cmsConfig,
      ...cms,
    };
    this.addLog('info', 'CMS configuration updated');
    this.save();
  }

  // Audit Logs
  getLogs(limit = 100): SystemAuditLog[] {
    return [...this.data.auditLogs].slice(-limit).reverse();
  }

  addLog(level: 'info' | 'warn' | 'error', event: string, details?: Record<string, any>) {
    const log: SystemAuditLog = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      timestamp: new Date().toISOString(),
      event,
      level,
      details,
    };
    this.data.auditLogs.push(log);
    if (this.data.auditLogs.length > 500) {
      this.data.auditLogs = this.data.auditLogs.slice(-500);
    }
    this.save();
  }
}

export const db = new Database();
