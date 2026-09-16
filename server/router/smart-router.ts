import { AIModel, AIRequest, AIResponse, AIStreamChunk } from '../providers/types';
import { modelRegistry } from '../providers/registry';
import { db } from '../db';

export interface TaskClassification {
  type: 'coding' | 'reasoning' | 'vision' | 'long_context' | 'json' | 'general';
  confidence: number;
  reason: string;
  requiredCapabilities: {
    vision?: boolean;
    reasoning?: boolean;
    tools?: boolean;
    json?: boolean;
  };
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

export class SmartRouter {
  public classifyTask(request: AIRequest): TaskClassification {
    const lastMsg = request.messages[request.messages.length - 1];
    const prompt = (lastMsg?.content || '').toLowerCase();
    const attachments = lastMsg?.attachments || [];

    // 1. Vision
    const hasImages = attachments.some(a => a.type.startsWith('image/'));
    if (hasImages) {
      return {
        type: 'vision',
        confidence: 0.98,
        reason: 'Image attachment detected; requires multimodal vision encoder.',
        requiredCapabilities: { vision: true },
      };
    }

    // 2. Coding
    const codeKeywords = ['function', 'class ', 'def ', 'import ', 'const ', 'async ', 'bug', 'debug', 'typescript', 'python', 'sql', 'css', 'html', 'react', 'refactor', 'regex', 'algorithm', 'compile'];
    const codeMatches = codeKeywords.filter(k => prompt.includes(k)).length;
    if (codeMatches >= 2 || prompt.includes('```') || prompt.includes('write code') || prompt.includes('write a script') || prompt.includes('fix the error')) {
      return {
        type: 'coding',
        confidence: 0.92,
        reason: 'Code synthesis or debugging intent identified; prioritizing models with high HumanEval / syntax fidelity.',
        requiredCapabilities: { tools: true },
      };
    }

    // 3. Complex Reasoning / Mathematics
    const mathKeywords = ['proof', 'prove', 'calculate', 'derive', 'equation', 'latex', 'probability', 'theorem', 'why does', 'step by step', 'logic puzzle', 'physics', 'differential'];
    const mathMatches = mathKeywords.filter(k => prompt.includes(k)).length;
    if (mathMatches >= 2 || prompt.includes('deepseek-r1') || prompt.includes('reason step-by-step') || prompt.includes('attention mechanism')) {
      return {
        type: 'reasoning',
        confidence: 0.95,
        reason: 'Complex mathematical or logical reasoning requested; activating deliberate chain-of-thought model.',
        requiredCapabilities: { reasoning: true },
      };
    }

    // 4. Structured JSON
    if (prompt.includes('json') && (prompt.includes('schema') || prompt.includes('format') || prompt.includes('output strictly'))) {
      return {
        type: 'json',
        confidence: 0.9,
        reason: 'Structured JSON output requested; selecting model with strict JSON mode guarantee.',
        requiredCapabilities: { json: true },
      };
    }

    // 5. Long context
    const totalCharLength = request.messages.reduce((acc, m) => acc + m.content.length, 0);
    if (totalCharLength > 12000) {
      return {
        type: 'long_context',
        confidence: 0.88,
        reason: `Extended context detected (${totalCharLength} chars); routing to high-capacity window architecture.`,
        requiredCapabilities: {},
      };
    }

    return {
      type: 'general',
      confidence: 0.85,
      reason: 'General inquiry; selecting lowest latency, highest-throughput conversational model.',
      requiredCapabilities: {},
    };
  }

  public async selectOptimalModel(request: AIRequest): Promise<{ model: AIModel; decision: RoutingDecision }> {
    const classification = this.classifyTask(request);
    const available = await modelRegistry.getAvailableModels();

    // Filter by capabilities
    let candidates = available.filter(m => {
      if (classification.requiredCapabilities.vision && !m.capabilities.vision) return false;
      if (classification.requiredCapabilities.reasoning && !m.capabilities.reasoning) return false;
      return true;
    });

    if (candidates.length === 0) {
      candidates = available;
    }

    // If still no candidates, discover all
    if (candidates.length === 0) {
      candidates = await modelRegistry.discoverAllModels();
    }

    // Score candidates
    const scored = candidates.map(m => {
      let score = m.priority || 50;

      // Bonus for exact task alignment
      if (classification.type === 'reasoning' && m.capabilities.reasoning) score += 30;
      if (classification.type === 'coding' && (m.id.includes('coder') || m.id.includes('llama-3.3') || m.id.includes('prime'))) score += 25;
      if (classification.type === 'vision' && m.capabilities.vision) score += 40;

      // Bonus for working health
      if (m.health === 'WORKING') score += 20;
      if (m.health === 'DEGRADED') score += 5;

      // Latency penalty
      if (m.latencyMs) {
        score -= Math.min(30, m.latencyMs / 20);
      }

      return { model: m, score };
    });

    scored.sort((a, b) => b.score - a.score);
    const chosen = scored[0]?.model || available[0] || {
      id: 'saturday-prime-4.0',
      provider: 'saturday',
      providerName: 'Saturday Neural Engine',
      displayName: 'Saturday Prime 4.0',
      capabilities: { text: true, vision: true, tools: true, reasoning: true, json: true },
      status: 'available',
      health: 'WORKING',
      isFree: true,
    };

    const decision: RoutingDecision = {
      strategy: 'smart',
      selectedModel: chosen.id,
      provider: chosen.provider,
      reason: classification.reason,
      confidenceScore: classification.confidence,
      taskClassification: classification.type,
      fallbackOccurred: false,
    };

    return { model: chosen, decision };
  }

  public async *streamWithFallback(request: AIRequest): AsyncIterable<AIStreamChunk> {
    const { model, decision } = await this.selectOptimalModel(request);
    const available = await modelRegistry.getAvailableModels();
    const fallbackList = available.filter(m => m.id !== model.id);
    const triedModels: string[] = [model.id];

    let currentModel = model;
    let fallbackHappened = false;

    for (let attempt = 0; attempt <= 2; attempt++) {
      const provider = modelRegistry.getProvider(currentModel.provider);
      if (!provider) {
        if (fallbackList.length > 0) {
          currentModel = fallbackList.shift()!;
          fallbackHappened = true;
          triedModels.push(currentModel.id);
          continue;
        }
        yield { type: 'error', error: 'No providers available to handle request.' };
        return;
      }

      let hasEmittedDelta = false;
      let errorOccurred = false;
      let errorMessage = '';

      try {
        const streamRequest: AIRequest = {
          ...request,
          modelId: currentModel.id,
        };

        const streamGen = provider.stream(streamRequest);

        for await (const chunk of streamGen) {
          if (chunk.type === 'error') {
            errorOccurred = true;
            errorMessage = chunk.error || 'Provider stream error';
            break;
          }

          if (chunk.type === 'delta' || chunk.type === 'reasoning') {
            hasEmittedDelta = true;
          }

          if (chunk.type === 'meta') {
            yield {
              ...chunk,
              routingDecision: {
                ...decision,
                selectedModel: currentModel.id,
                provider: currentModel.provider,
                fallbackOccurred: fallbackHappened,
                triedModels,
              },
            };
            continue;
          }

          yield chunk;
        }

        if (!errorOccurred) {
          return; // Success!
        }
      } catch (err: any) {
        errorOccurred = true;
        errorMessage = err?.message || 'Streaming exception';
      }

      // If error happened BEFORE any deltas were sent, execute fallback!
      if (errorOccurred && !hasEmittedDelta) {
        db.addLog('warn', `Smart router fallback triggered from ${currentModel.id}: ${errorMessage}`);
        fallbackHappened = true;

        // Pick next fallback
        const next = fallbackList.find(m => m.status === 'available') || {
          id: 'saturday-prime-4.0',
          provider: 'saturday',
          providerName: 'Saturday Neural Engine',
          displayName: 'Saturday Prime 4.0',
          capabilities: { text: true, vision: true, tools: true, reasoning: true, json: true },
          status: 'available',
          health: 'WORKING',
          isFree: true,
        };

        currentModel = next as AIModel;
        triedModels.push(currentModel.id);
      } else if (errorOccurred) {
        // Already started emitting, cannot cleanly restart
        yield { type: 'error', error: errorMessage };
        return;
      }
    }
  }
}

export const smartRouter = new SmartRouter();
