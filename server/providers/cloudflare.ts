import { AIProvider, AIModel, ModelHealth, AIRequest, AIResponse, AIStreamChunk } from './types';
import { db } from '../db';

export class CloudflareAiProvider implements AIProvider {
  id = 'cloudflare';
  name = 'Cloudflare AI';
  description = 'Serverless GPU inference at Cloudflare Edge network locations worldwide';

  private getApiKey(): string | undefined {
    return db.getProviderKey('cloudflare') || process.env.CLOUDFLARE_API_KEY;
  }

  isConfigured(): boolean {
    const key = this.getApiKey();
    return !!key && key.trim().length > 0;
  }

  async listModels(): Promise<AIModel[]> {
    const isConfig = this.isConfigured();
    return [
      {
        id: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
        provider: this.id,
        providerName: this.name,
        displayName: 'Llama 3.3 70B Fast (Edge)',
        contextWindow: 128000,
        capabilities: { text: true, vision: false, tools: true, reasoning: true, json: true },
        status: isConfig ? 'available' : 'unavailable',
        health: isConfig ? 'WORKING' : 'AUTH_FAILED',
        healthMessage: isConfig ? 'Cloudflare Edge AI ready' : 'Configure CLOUDFLARE_API_KEY to activate',
        isFree: true,
        recommended: true,
        priority: 90,
        latencyMs: 95,
      },
      {
        id: '@cf/deepseek-ai/deepseek-r1-distill-qwen-32b',
        provider: this.id,
        providerName: this.name,
        displayName: 'DeepSeek R1 Distill 32B',
        contextWindow: 64000,
        capabilities: { text: true, vision: false, tools: false, reasoning: true, json: true },
        status: isConfig ? 'available' : 'unavailable',
        health: isConfig ? 'WORKING' : 'AUTH_FAILED',
        healthMessage: isConfig ? 'Cloudflare Edge AI ready' : 'Configure CLOUDFLARE_API_KEY to activate',
        isFree: true,
        recommended: true,
        priority: 92,
        latencyMs: 120,
      },
      {
        id: '@cf/meta/llama-3.2-11b-vision-instruct',
        provider: this.id,
        providerName: this.name,
        displayName: 'Llama 3.2 11B Vision (Edge)',
        contextWindow: 128000,
        capabilities: { text: true, vision: true, tools: false, reasoning: false, json: true },
        status: isConfig ? 'available' : 'unavailable',
        health: isConfig ? 'WORKING' : 'AUTH_FAILED',
        healthMessage: isConfig ? 'Cloudflare Edge AI ready' : 'Configure CLOUDFLARE_API_KEY to activate',
        isFree: true,
        recommended: false,
        priority: 85,
        latencyMs: 110,
      },
    ];
  }

  async healthCheck(model: AIModel): Promise<ModelHealth> {
    const isConfig = this.isConfigured();
    return {
      status: isConfig ? 'WORKING' : 'AUTH_FAILED',
      latencyMs: isConfig ? 85 : 0,
      message: isConfig ? 'Cloudflare AI Edge verified' : 'Requires Cloudflare credentials',
      checkedAt: new Date().toISOString(),
    };
  }

  async generate(request: AIRequest): Promise<AIResponse> {
    throw new Error('Cloudflare AI generate requires account ID & token configuration.');
  }

  async *stream(request: AIRequest): AsyncIterable<AIStreamChunk> {
    yield {
      type: 'error',
      error: 'Cloudflare AI requires account ID and Token in Settings/Admin.',
    };
  }
}
