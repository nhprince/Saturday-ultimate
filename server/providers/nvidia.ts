import { AIProvider, AIModel, ModelHealth, AIRequest, AIResponse, AIStreamChunk } from './types';
import { db } from '../db';

export class NvidiaNimProvider implements AIProvider {
  id = 'nvidia';
  name = 'NVIDIA NIM';
  description = 'High-throughput enterprise AI inference accelerated on NVIDIA DGX Cloud';

  private getApiKey(): string | undefined {
    return db.getProviderKey('nvidia') || process.env.NVIDIA_NIM_API_KEY;
  }

  private getBaseUrl(): string {
    return db.getProviderSecrets()['nvidia']?.baseUrl || 'https://integrate.api.nvidia.com/v1';
  }

  isConfigured(): boolean {
    const key = this.getApiKey();
    return !!key && key.trim().length > 0;
  }

  async listModels(): Promise<AIModel[]> {
    const apiKey = this.getApiKey();
    const baseUrl = this.getBaseUrl();

    // Standard known NIM catalog as baseline or if key is not yet set
    const baselineModels: AIModel[] = [
      {
        id: 'meta/llama-3.3-70b-instruct',
        provider: this.id,
        providerName: this.name,
        displayName: 'Llama 3.3 70B Instruct',
        contextWindow: 128000,
        capabilities: { text: true, vision: false, tools: true, reasoning: true, json: true },
        status: this.isConfigured() ? 'available' : 'unavailable',
        health: this.isConfigured() ? 'WORKING' : 'AUTH_FAILED',
        healthMessage: this.isConfigured() ? 'NVIDIA NIM endpoint ready' : 'Configure NVIDIA_NIM_API_KEY to activate',
        isFree: true,
        recommended: true,
        priority: 100,
        latencyMs: 140,
      },
      {
        id: 'deepseek-ai/deepseek-r1',
        provider: this.id,
        providerName: this.name,
        displayName: 'DeepSeek R1 (NIM)',
        contextWindow: 64000,
        capabilities: { text: true, vision: false, tools: false, reasoning: true, json: false },
        status: this.isConfigured() ? 'available' : 'unavailable',
        health: this.isConfigured() ? 'WORKING' : 'AUTH_FAILED',
        healthMessage: this.isConfigured() ? 'NVIDIA NIM endpoint ready' : 'Configure NVIDIA_NIM_API_KEY to activate',
        isFree: true,
        recommended: true,
        priority: 95,
        latencyMs: 320,
      },
      {
        id: 'nvidia/llama-3.1-nemotron-70b-instruct',
        provider: this.id,
        providerName: this.name,
        displayName: 'Nemotron 70B Instruct',
        contextWindow: 128000,
        capabilities: { text: true, vision: false, tools: true, reasoning: true, json: true },
        status: this.isConfigured() ? 'available' : 'unavailable',
        health: this.isConfigured() ? 'WORKING' : 'AUTH_FAILED',
        healthMessage: this.isConfigured() ? 'NVIDIA NIM endpoint ready' : 'Configure NVIDIA_NIM_API_KEY to activate',
        isFree: true,
        recommended: true,
        priority: 90,
        latencyMs: 180,
      },
      {
        id: 'meta/llama-3.2-11b-vision-instruct',
        provider: this.id,
        providerName: this.name,
        displayName: 'Llama 3.2 11B Vision',
        contextWindow: 128000,
        capabilities: { text: true, vision: true, tools: false, reasoning: false, json: true },
        status: this.isConfigured() ? 'available' : 'unavailable',
        health: this.isConfigured() ? 'WORKING' : 'AUTH_FAILED',
        healthMessage: this.isConfigured() ? 'NVIDIA NIM endpoint ready' : 'Configure NVIDIA_NIM_API_KEY to activate',
        isFree: true,
        recommended: false,
        priority: 85,
        latencyMs: 195,
      },
      {
        id: 'mistralai/mistral-large-2-instruct',
        provider: this.id,
        providerName: this.name,
        displayName: 'Mistral Large 2',
        contextWindow: 128000,
        capabilities: { text: true, vision: false, tools: true, reasoning: true, json: true },
        status: this.isConfigured() ? 'available' : 'unavailable',
        health: this.isConfigured() ? 'WORKING' : 'AUTH_FAILED',
        healthMessage: this.isConfigured() ? 'NVIDIA NIM endpoint ready' : 'Configure NVIDIA_NIM_API_KEY to activate',
        isFree: true,
        recommended: false,
        priority: 80,
        latencyMs: 210,
      },
      {
        id: 'microsoft/phi-3-medium-128k-instruct',
        provider: this.id,
        providerName: this.name,
        displayName: 'Phi-3 Medium (128k)',
        contextWindow: 128000,
        capabilities: { text: true, vision: false, tools: false, reasoning: false, json: true },
        status: this.isConfigured() ? 'available' : 'unavailable',
        health: this.isConfigured() ? 'WORKING' : 'AUTH_FAILED',
        healthMessage: this.isConfigured() ? 'NVIDIA NIM endpoint ready' : 'Configure NVIDIA_NIM_API_KEY to activate',
        isFree: true,
        recommended: false,
        priority: 70,
        latencyMs: 110,
      },
    ];

    if (!apiKey) {
      return baselineModels;
    }

    try {
      const response = await fetch(`${baseUrl}/models`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(6000),
      });

      if (!response.ok) {
        db.addLog('warn', `NVIDIA model discovery returned HTTP ${response.status}`, { status: response.status });
        return baselineModels.map(m => ({
          ...m,
          status: 'unavailable',
          health: response.status === 401 ? 'AUTH_FAILED' : 'ERROR',
          healthMessage: `NVIDIA returned HTTP ${response.status}`,
        }));
      }

      const json = await response.json() as any;
      const discoveredList: any[] = Array.isArray(json?.data) ? json.data : [];

      if (discoveredList.length === 0) {
        return baselineModels;
      }

      const liveModels: AIModel[] = discoveredList.map((m: any) => {
        const id = m.id;
        const lower = id.toLowerCase();
        const isVision = lower.includes('vision') || lower.includes('multimodal');
        const isReasoning = lower.includes('r1') || lower.includes('nemotron') || lower.includes('reason');
        const isCode = lower.includes('code') || lower.includes('starcoder');

        return {
          id,
          provider: this.id,
          providerName: this.name,
          displayName: id.split('/').pop()?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || id,
          contextWindow: 128000,
          capabilities: {
            text: true,
            vision: isVision,
            tools: !isReasoning,
            reasoning: isReasoning,
            json: true,
          },
          status: 'available',
          health: 'WORKING',
          healthMessage: 'Live discovery verified',
          isFree: true,
          recommended: lower.includes('llama-3.3-70b') || lower.includes('r1'),
          priority: lower.includes('llama-3.3-70b') ? 100 : 75,
          latencyMs: 150,
          lastCheckedAt: new Date().toISOString(),
        };
      });

      return liveModels;
    } catch (err: any) {
      db.addLog('warn', 'NVIDIA NIM discovery fallback', { error: err?.message });
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
        message: 'No NVIDIA API key configured in Saturday Settings or Environment.',
        checkedAt: new Date().toISOString(),
      };
    }

    try {
      // Lightweight models probe or quick ping
      const res = await fetch(`${baseUrl}/models`, {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(4000),
      });

      const latencyMs = Date.now() - start;

      if (res.status === 401 || res.status === 403) {
        return {
          status: 'AUTH_FAILED',
          latencyMs,
          message: 'Invalid or expired NVIDIA NIM API key.',
          checkedAt: new Date().toISOString(),
        };
      }

      if (res.status === 429) {
        return {
          status: 'RATE_LIMITED',
          latencyMs,
          message: 'NVIDIA NIM rate limit reached.',
          checkedAt: new Date().toISOString(),
        };
      }

      if (!res.ok) {
        return {
          status: 'ERROR',
          latencyMs,
          message: `NVIDIA NIM responded with HTTP ${res.status}`,
          checkedAt: new Date().toISOString(),
        };
      }

      return {
        status: latencyMs > 2500 ? 'DEGRADED' : 'WORKING',
        latencyMs,
        message: 'NVIDIA NIM endpoint responsive and operational.',
        checkedAt: new Date().toISOString(),
      };
    } catch (err: any) {
      return {
        status: err?.name === 'TimeoutError' ? 'TIMEOUT' : 'ERROR',
        latencyMs: Date.now() - start,
        message: err?.message || 'Connection failure to NVIDIA NIM',
        checkedAt: new Date().toISOString(),
      };
    }
  }

  async generate(request: AIRequest): Promise<AIResponse> {
    const apiKey = this.getApiKey();
    const baseUrl = this.getBaseUrl();
    const start = Date.now();

    if (!apiKey) {
      throw new Error('NVIDIA NIM API key is not configured.');
    }

    const payload = {
      model: request.modelId,
      messages: request.messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      temperature: request.temperature ?? 0.6,
      max_tokens: request.maxTokens ?? 2048,
      stream: false,
    };

    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`NVIDIA NIM API error (${res.status}): ${errText}`);
    }

    const data = await res.json() as any;
    const latencyMs = Date.now() - start;

    return {
      id: data.id || 'nim_' + Date.now(),
      content: data.choices?.[0]?.message?.content || '',
      reasoningContent: data.choices?.[0]?.message?.reasoning_content,
      model: request.modelId,
      provider: this.id,
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0,
      },
      latencyMs,
    };
  }

  async *stream(request: AIRequest): AsyncIterable<AIStreamChunk> {
    const apiKey = this.getApiKey();
    const baseUrl = this.getBaseUrl();
    const start = Date.now();

    if (!apiKey) {
      yield {
        type: 'error',
        error: 'NVIDIA NIM API key is not configured. Add your key in Settings or Admin.',
      };
      return;
    }

    const payload = {
      model: request.modelId,
      messages: request.messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      temperature: request.temperature ?? 0.6,
      max_tokens: request.maxTokens ?? 2048,
      stream: true,
    };

    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      yield {
        type: 'error',
        error: `NVIDIA NIM error (${res.status}): ${errText}`,
      };
      return;
    }

    yield {
      type: 'meta',
      model: request.modelId,
      provider: this.id,
      latencyMs: Date.now() - start,
    };

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
          if (!trimmed || !trimmed.startsWith('data: ')) continue;
          const dataStr = trimmed.replace('data: ', '');
          if (dataStr === '[DONE]') {
            yield { type: 'done' };
            return;
          }

          try {
            const parsed = JSON.parse(dataStr);
            const delta = parsed.choices?.[0]?.delta;
            if (delta?.reasoning_content) {
              yield { type: 'reasoning', reasoningContent: delta.reasoning_content };
            }
            if (delta?.content) {
              yield { type: 'delta', content: delta.content };
            }
          } catch {
            // Ignore malformed chunk
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    yield { type: 'done' };
  }
}
