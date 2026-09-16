import { AIProvider, AIModel, ModelHealth, ModelHealthStatus } from './types';
import { NvidiaNimProvider } from './nvidia';
import { OpenRouterProvider } from './openrouter';
import { CloudflareAiProvider } from './cloudflare';
import { SaturdayEngineProvider } from './saturday-engine';
import { db } from '../db';

interface CachedHealth {
  health: ModelHealth;
  timestamp: number;
}

export class ModelRegistry {
  private providers: Map<string, AIProvider> = new Map();
  private healthCache: Map<string, CachedHealth> = new Map();
  private modelsCache: AIModel[] = [];
  private lastDiscoveryTime = 0;
  private readonly DISCOVERY_TTL = 60 * 1000; // 1 minute
  private readonly HEALTH_TTL = 3 * 60 * 1000; // 3 minutes

  constructor() {
    this.registerProvider(new NvidiaNimProvider());
    this.registerProvider(new OpenRouterProvider());
    this.registerProvider(new CloudflareAiProvider());
    this.registerProvider(new SaturdayEngineProvider());
  }

  public registerProvider(provider: AIProvider) {
    this.providers.set(provider.id, provider);
  }

  public getProvider(id: string): AIProvider | undefined {
    return this.providers.get(id);
  }

  public listProviders(): Array<{ id: string; name: string; description: string; configured: boolean }> {
    return Array.from(this.providers.values()).map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      configured: p.isConfigured(),
    }));
  }

  public async discoverAllModels(force = false): Promise<AIModel[]> {
    const now = Date.now();
    if (!force && this.modelsCache.length > 0 && (now - this.lastDiscoveryTime) < this.DISCOVERY_TTL) {
      return this.applyOverrides(this.modelsCache);
    }

    const allModels: AIModel[] = [];
    const overrides = db.getModelOverrides();

    for (const provider of this.providers.values()) {
      try {
        const providerSecrets = db.getProviderSecrets();
        const isEnabled = providerSecrets[provider.id]?.enabled !== false;
        if (!isEnabled) continue;

        const models = await provider.listModels();
        for (const model of models) {
          // Check cached health
          const cached = this.healthCache.get(model.id);
          if (cached && (now - cached.timestamp) < this.HEALTH_TTL) {
            model.health = cached.health.status;
            model.latencyMs = cached.health.latencyMs;
            model.healthMessage = cached.health.message;
            model.lastCheckedAt = cached.health.checkedAt;
            model.status = (model.health === 'WORKING' || model.health === 'DEGRADED') ? 'available' : 'unavailable';
          }
          allModels.push(model);
        }
      } catch (err: any) {
        db.addLog('error', `Model discovery failed for provider ${provider.id}`, { error: err?.message });
      }
    }

    this.modelsCache = allModels;
    this.lastDiscoveryTime = now;
    return this.applyOverrides(allModels);
  }

  public applyOverrides(models: AIModel[]): AIModel[] {
    const overrides = db.getModelOverrides();
    return models.map(m => {
      const override = overrides[m.id];
      if (override) {
        return { ...m, ...override };
      }
      return m;
    });
  }

  public async getAvailableModels(): Promise<AIModel[]> {
    const models = await this.discoverAllModels();
    return models.filter(m => m.enabled !== false && m.status === 'available');
  }

  public async checkModelHealth(modelId: string, force = false): Promise<ModelHealth> {
    const now = Date.now();
    const cached = this.healthCache.get(modelId);
    if (!force && cached && (now - cached.timestamp) < this.HEALTH_TTL) {
      return cached.health;
    }

    const models = await this.discoverAllModels();
    const model = models.find(m => m.id === modelId);

    if (!model) {
      const result: ModelHealth = {
        status: 'NOT_FOUND',
        latencyMs: 0,
        message: `Model ${modelId} not found in provider catalogs`,
        checkedAt: new Date().toISOString(),
      };
      return result;
    }

    const provider = this.providers.get(model.provider);
    if (!provider) {
      const result: ModelHealth = {
        status: 'UNSUPPORTED',
        latencyMs: 0,
        message: `Provider ${model.provider} is not registered`,
        checkedAt: new Date().toISOString(),
      };
      return result;
    }

    try {
      const health = await provider.healthCheck(model);
      this.healthCache.set(modelId, { health, timestamp: now });

      // Update in cached model if present
      const index = this.modelsCache.findIndex(m => m.id === modelId);
      if (index !== -1) {
        this.modelsCache[index].health = health.status;
        this.modelsCache[index].latencyMs = health.latencyMs;
        this.modelsCache[index].healthMessage = health.message;
        this.modelsCache[index].lastCheckedAt = health.checkedAt;
        this.modelsCache[index].status = (health.status === 'WORKING' || health.status === 'DEGRADED') ? 'available' : 'unavailable';
      }

      db.addLog(
        health.status === 'WORKING' ? 'info' : 'warn',
        `Health check for ${modelId}: ${health.status}`,
        { modelId, latencyMs: health.latencyMs, status: health.status }
      );

      return health;
    } catch (err: any) {
      const errorResult: ModelHealth = {
        status: 'ERROR',
        latencyMs: 0,
        message: err?.message || 'Health check exception',
        checkedAt: new Date().toISOString(),
      };
      this.healthCache.set(modelId, { health: errorResult, timestamp: now });
      return errorResult;
    }
  }

  public async runHealthCheckBatch(limit = 6): Promise<Record<string, ModelHealth>> {
    const models = await this.discoverAllModels();
    const results: Record<string, ModelHealth> = {};
    const selected = models.slice(0, limit);

    await Promise.all(
      selected.map(async m => {
        results[m.id] = await this.checkModelHealth(m.id, true);
      })
    );

    return results;
  }
}

export const modelRegistry = new ModelRegistry();
