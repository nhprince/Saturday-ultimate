import { AIProvider, AIModel, ModelHealth, AIRequest, AIResponse, AIStreamChunk } from './types';
import { db } from '../db';

export class OpenRouterProvider implements AIProvider {
  id = 'openrouter';
  name = 'OpenRouter Free';
  description = 'Open unified gateway with curated free tier models and high availability';

  private getApiKey(): string | undefined {
    return db.getProviderKey('openrouter') || process.env.OPENROUTER_API_KEY;
  }

  private getBaseUrl(): string {
    return db.getProviderSecrets()['openrouter']?.baseUrl || 'https://openrouter.ai/api/v1';
  }

  isConfigured(): boolean {
    const key = this.getApiKey();
    return !!key && key.trim().length > 0;
  }

  async listModels(): Promise<AIModel[]> {
    const apiKey = this.getApiKey();
    const baseUrl = this.getBaseUrl();

    const baselineModels: AIModel[] = [
      {
        id: 'meta-llama/llama-3.3-70b-instruct:free',
        provider: this.id,
        providerName: this.name,
        displayName: 'Llama 3.3 70B (Free)',
        contextWindow: 128000,
        capabilities: { text: true, vision: false, tools: true, reasoning: true, json: true },
        status: this.isConfigured() ? 'available' : 'unavailable',
        health: this.isConfigured() ? 'WORKING' : 'AUTH_FAILED',
        healthMessage: this.isConfigured() ? 'OpenRouter Free endpoint active' : 'Add OPENROUTER_API_KEY in Settings',
        isFree: true,
        recommended: true,
        priority: 95,
        latencyMs: 165,
      },
      {
        id: 'deepseek/deepseek-r1:free',
        provider: this.id,
        providerName: this.name,
        displayName: 'DeepSeek R1 (Free)',
        contextWindow: 64000,
        capabilities: { text: true, vision: false, tools: false, reasoning: true, json: false },
        status: this.isConfigured() ? 'available' : 'unavailable',
        health: this.isConfigured() ? 'WORKING' : 'AUTH_FAILED',
        healthMessage: this.isConfigured() ? 'OpenRouter Free endpoint active' : 'Add OPENROUTER_API_KEY in Settings',
        isFree: true,
        recommended: true,
        priority: 92,
        latencyMs: 380,
      },
      {
        id: 'qwen/qwen-2.5-coder-32b-instruct:free',
        provider: this.id,
        providerName: this.name,
        displayName: 'Qwen 2.5 Coder 32B (Free)',
        contextWindow: 32000,
        capabilities: { text: true, vision: false, tools: true, reasoning: true, json: true },
        status: this.isConfigured() ? 'available' : 'unavailable',
        health: this.isConfigured() ? 'WORKING' : 'AUTH_FAILED',
        healthMessage: this.isConfigured() ? 'OpenRouter Free endpoint active' : 'Add OPENROUTER_API_KEY in Settings',
        isFree: true,
        recommended: false,
        priority: 88,
        latencyMs: 190,
      },
      {
        id: 'google/gemini-2.0-flash-exp:free',
        provider: this.id,
        providerName: this.name,
        displayName: 'Gemini 2.0 Flash (Free)',
        contextWindow: 1048576,
        capabilities: { text: true, vision: true, tools: true, reasoning: true, json: true },
        status: this.isConfigured() ? 'available' : 'unavailable',
        health: this.isConfigured() ? 'WORKING' : 'AUTH_FAILED',
        healthMessage: this.isConfigured() ? 'OpenRouter Free endpoint active' : 'Add OPENROUTER_API_KEY in Settings',
        isFree: true,
        recommended: true,
        priority: 90,
        latencyMs: 140,
      },
    ];

    if (!apiKey) return baselineModels;

    try {
      const res = await fetch(`${baseUrl}/models`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://saturday.ai',
          'X-Title': 'Saturday AI',
        },
        signal: AbortSignal.timeout(6000),
      });

      if (!res.ok) return baselineModels;

      const data = await res.json() as any;
      const all: any[] = data.data || [];

      // Filter only free models (:free in id or prompt pricing === 0)
      const freeList = all.filter(m =>
        m.id?.includes(':free') ||
        (m.pricing && Number(m.pricing.prompt) === 0 && Number(m.pricing.completion) === 0)
      );

      if (freeList.length === 0) return baselineModels;

      return freeList.map((m: any) => ({
        id: m.id,
        provider: this.id,
        providerName: this.name,
        displayName: m.name || m.id.split('/').pop()?.replace(':free', '') || m.id,
        contextWindow: m.context_length || 32000,
        capabilities: {
          text: true,
          vision: !!m.architecture?.modality?.includes('image'),
          tools: true,
          reasoning: m.id.toLowerCase().includes('r1') || m.id.toLowerCase().includes('reason'),
          json: true,
        },
        status: 'available',
        health: 'WORKING',
        healthMessage: 'OpenRouter live catalog verified',
        isFree: true,
        recommended: m.id.includes('llama-3.3') || m.id.includes('r1'),
        priority: 85,
        latencyMs: 200,
      }));
    } catch {
      return baselineModels;
    }
  }

  async healthCheck(model: AIModel): Promise<ModelHealth> {
    const apiKey = this.getApiKey();
    const baseUrl = this.getBaseUrl();
    const start = Date.now();

    if (!apiKey) {
      return {
        status: 'AUTH_FAILED',
        latencyMs: 0,
        message: 'No OpenRouter API key configured.',
        checkedAt: new Date().toISOString(),
      };
    }

    try {
      const res = await fetch(`${baseUrl}/models`, {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(4000),
      });
      const latencyMs = Date.now() - start;

      if (res.status === 401 || res.status === 403) {
        return { status: 'AUTH_FAILED', latencyMs, message: 'Invalid OpenRouter API Key', checkedAt: new Date().toISOString() };
      }
      if (res.status === 429) {
        return { status: 'RATE_LIMITED', latencyMs, message: 'OpenRouter rate limit hit', checkedAt: new Date().toISOString() };
      }
      if (!res.ok) {
        return { status: 'ERROR', latencyMs, message: `HTTP ${res.status}`, checkedAt: new Date().toISOString() };
      }

      return { status: 'WORKING', latencyMs, message: 'OpenRouter operational', checkedAt: new Date().toISOString() };
    } catch (err: any) {
      return { status: 'TIMEOUT', latencyMs: Date.now() - start, message: err?.message, checkedAt: new Date().toISOString() };
    }
  }

  async generate(request: AIRequest): Promise<AIResponse> {
    const apiKey = this.getApiKey();
    const baseUrl = this.getBaseUrl();
    const start = Date.now();

    if (!apiKey) throw new Error('OpenRouter API key is not configured.');

    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://saturday.ai',
        'X-Title': 'Saturday AI',
      },
      body: JSON.stringify({
        model: request.modelId,
        messages: request.messages.map(m => ({ role: m.role, content: m.content })),
        temperature: request.temperature ?? 0.6,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenRouter error: ${err}`);
    }

    const data = await res.json() as any;
    return {
      id: data.id || 'openrouter_' + Date.now(),
      content: data.choices?.[0]?.message?.content || '',
      reasoningContent: data.choices?.[0]?.message?.reasoning_content,
      model: request.modelId,
      provider: this.id,
      latencyMs: Date.now() - start,
    };
  }

  async *stream(request: AIRequest): AsyncIterable<AIStreamChunk> {
    const apiKey = this.getApiKey();
    const baseUrl = this.getBaseUrl();
    const start = Date.now();

    if (!apiKey) {
      yield { type: 'error', error: 'OpenRouter API key required.' };
      return;
    }

    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://saturday.ai',
        'X-Title': 'Saturday AI',
      },
      body: JSON.stringify({
        model: request.modelId,
        messages: request.messages.map(m => ({ role: m.role, content: m.content })),
        temperature: request.temperature ?? 0.6,
        stream: true,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      yield { type: 'error', error: `OpenRouter error (${res.status}): ${err}` };
      return;
    }

    yield { type: 'meta', model: request.modelId, provider: this.id, latencyMs: Date.now() - start };

    if (!res.body) {
      yield { type: 'done' };
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
          if (jsonStr === '[DONE]') {
            yield { type: 'done' };
            return;
          }
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta;
            if (delta?.reasoning_content) {
              yield { type: 'reasoning', reasoningContent: delta.reasoning_content };
            }
            if (delta?.content) {
              yield { type: 'delta', content: delta.content };
            }
          } catch {}
        }
      }
    } finally {
      reader.releaseLock();
    }

    yield { type: 'done' };
  }
}
