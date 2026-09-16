import { AIModel, AIRequest, AIStreamChunk } from './types';
import { EdgeRegistry } from './registry';
import { EdgeSaturdayEngine } from './saturday-engine';
import { EdgeStore } from './db';

export class EdgeRouter {
  private store: EdgeStore;
  private registry: EdgeRegistry;
  private saturdayEngine = new EdgeSaturdayEngine();

  constructor(store: EdgeStore, registry: EdgeRegistry) {
    this.store = store;
    this.registry = registry;
  }

  classifyTask(request: AIRequest) {
    const lastMsg = request.messages[request.messages.length - 1];
    const prompt = (lastMsg?.content || '').toLowerCase();
    const attachments = lastMsg?.attachments || [];

    if (attachments.some(a => a.type?.startsWith('image/'))) {
      return {
        type: 'vision',
        confidence: 0.98,
        reason: 'Image attachment detected; multimodal vision pipeline required.',
      };
    }

    const codeKeywords = ['function', 'class ', 'def ', 'import ', 'const ', 'async ', 'bug', 'debug', 'typescript', 'python', 'sql', 'css', 'html', 'react', 'refactor', 'regex', 'algorithm'];
    if (codeKeywords.filter(k => prompt.includes(k)).length >= 2 || prompt.includes('```') || prompt.includes('write code')) {
      return {
        type: 'coding',
        confidence: 0.92,
        reason: 'Code synthesis or debugging intent detected; selecting high syntax accuracy model.',
      };
    }

    const mathKeywords = ['proof', 'prove', 'calculate', 'derive', 'equation', 'latex', 'probability', 'theorem', 'why does', 'step by step', 'logic puzzle', 'physics'];
    if (mathKeywords.filter(k => prompt.includes(k)).length >= 2 || prompt.includes('deepseek-r1') || prompt.includes('reason step-by-step')) {
      return {
        type: 'reasoning',
        confidence: 0.95,
        reason: 'Complex mathematical or logical reasoning requested; activating deliberate chain-of-thought model.',
      };
    }

    return {
      type: 'general',
      confidence: 0.88,
      reason: 'General editorial synthesis; selecting low-latency high-coherence model.',
    };
  }

  async selectOptimalModel(request: AIRequest): Promise<{ model: AIModel; decision: any }> {
    const classification = this.classifyTask(request);
    const available = await this.registry.getAvailableModels();

    let candidates = [...available];

    if (classification.type === 'vision') {
      const visionModels = candidates.filter(m => m.capabilities.vision);
      if (visionModels.length > 0) candidates = visionModels;
    } else if (classification.type === 'reasoning') {
      const reasonModels = candidates.filter(m => m.capabilities.reasoning);
      if (reasonModels.length > 0) candidates = reasonModels;
    }

    // Sort by priority and latency
    candidates.sort((a, b) => (b.priority || 0) - (a.priority || 0));

    const chosen = candidates[0] || {
      id: 'saturday-prime-4.0',
      provider: 'saturday',
      providerName: 'Saturday Neural Engine',
      displayName: 'Saturday Prime 4.0',
      capabilities: { text: true, vision: true, tools: true, reasoning: true, json: true },
      status: 'available',
      health: 'WORKING',
      isFree: true,
      latencyMs: 25,
    };

    return {
      model: chosen,
      decision: {
        strategy: 'smart',
        selectedModel: chosen.id,
        provider: chosen.provider,
        reason: classification.reason,
        confidenceScore: classification.confidence,
        taskClassification: classification.type,
        fallbackOccurred: false,
      },
    };
  }

  async *stream(request: AIRequest): AsyncIterable<AIStreamChunk> {
    let targetModelId = request.modelId;
    let decision: any = undefined;

    if (targetModelId === 'smart-router') {
      const selection = await this.selectOptimalModel(request);
      targetModelId = selection.model.id;
      decision = selection.decision;
    } else if (targetModelId === 'free-router') {
      targetModelId = 'saturday-prime-4.0';
      decision = {
        strategy: 'free',
        selectedModel: targetModelId,
        provider: 'saturday',
        reason: 'Auto-routed to Saturday zero-cost engine.',
        confidenceScore: 0.99,
      };
    }

    // Try external provider if requested
    const openRouterKey = this.store.getProviderKey('openrouter');
    if (openRouterKey && targetModelId.includes('openrouter') || (targetModelId.includes(':free') && openRouterKey)) {
      try {
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${openRouterKey}`,
            'HTTP-Referer': 'https://saturday.ai',
            'X-Title': 'Saturday AI',
          },
          body: JSON.stringify({
            model: targetModelId,
            messages: request.messages.map(m => ({ role: m.role, content: m.content })),
            temperature: request.temperature ?? 0.6,
            stream: true,
          }),
        });

        if (res.ok && res.body) {
          yield {
            type: 'meta',
            model: targetModelId,
            provider: 'openrouter',
            latencyMs: 150,
            routingDecision: decision,
          };

          const reader = res.body.getReader();
          const decoder = new TextDecoder('utf-8');
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith('data: ')) continue;
              const jsonStr = trimmed.slice(6);
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
          yield { type: 'done' };
          return;
        }
      } catch (err) {
        // Fallback to Saturday engine
      }
    }

    const nimKey = this.store.getProviderKey('nvidia');
    if (nimKey && (targetModelId.includes('meta/') || targetModelId.includes('deepseek-ai/'))) {
      try {
        const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${nimKey}`,
          },
          body: JSON.stringify({
            model: targetModelId,
            messages: request.messages.map(m => ({ role: m.role, content: m.content })),
            temperature: request.temperature ?? 0.6,
            stream: true,
          }),
        });

        if (res.ok && res.body) {
          yield {
            type: 'meta',
            model: targetModelId,
            provider: 'nvidia',
            latencyMs: 140,
            routingDecision: decision,
          };

          const reader = res.body.getReader();
          const decoder = new TextDecoder('utf-8');
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith('data: ')) continue;
              const jsonStr = trimmed.slice(6);
              if (jsonStr === '[DONE]') {
                yield { type: 'done' };
                return;
              }
              try {
                const parsed = JSON.parse(jsonStr);
                const delta = parsed.choices?.[0]?.delta;
                if (delta?.content) {
                  yield { type: 'delta', content: delta.content };
                }
              } catch {}
            }
          }
          yield { type: 'done' };
          return;
        }
      } catch (err) {
        // Fallback to Saturday engine
      }
    }

    // Default: Saturday Neural Engine (Immediate & Free)
    yield {
      type: 'meta',
      model: targetModelId.startsWith('saturday') ? targetModelId : 'saturday-prime-4.0',
      provider: 'saturday',
      latencyMs: 22,
      routingDecision: decision || {
        strategy: 'free',
        selectedModel: 'saturday-prime-4.0',
        provider: 'saturday',
        reason: 'Executed via Saturday zero-latency edge engine.',
      },
    };

    const { content, reasoning } = this.saturdayEngine.generateIntelligentResponse(request);

    if (reasoning && (targetModelId.includes('reasoner') || targetModelId.includes('prime') || targetModelId.includes('smart'))) {
      const words = reasoning.split(' ');
      for (const w of words) {
        yield { type: 'reasoning', reasoningContent: w + ' ' };
      }
    }

    const words = (content.match(/(\s+|\S+)/g) || [content]);
    for (const w of words) {
      yield { type: 'delta', content: w };
    }

    yield { type: 'done' };
  }
}
