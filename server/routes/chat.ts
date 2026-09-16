import { Router } from 'express';
import { AIRequest, ChatMessage } from '../providers/types';
import { smartRouter } from '../router/smart-router';
import { freeRouter } from '../router/free-router';
import { modelRegistry } from '../providers/registry';
import { db } from '../db';

export const chatRouter = Router();

chatRouter.post('/chat/stream', async (req, res) => {
  const { conversationId, messages, modelId = 'smart-router', temperature } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Messages array is required.' });
  }

  // Set up SSE
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable proxy buffering
  res.flushHeaders?.();

  const aiRequest: AIRequest = {
    messages,
    modelId,
    temperature,
    stream: true,
  };

  let fullContent = '';
  let fullReasoning = '';
  let effectiveModel = modelId;
  let effectiveProvider = 'saturday';
  let routingDecision: ChatMessage['routingDecision'] = undefined;

  const sendChunk = (data: any) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    let streamIterator: AsyncIterable<any>;

    if (modelId === 'smart-router') {
      streamIterator = smartRouter.streamWithFallback(aiRequest);
    } else if (modelId === 'free-router') {
      streamIterator = freeRouter.stream(aiRequest);
    } else {
      // Direct model chosen
      const models = await modelRegistry.discoverAllModels();
      const targetModel = models.find(m => m.id === modelId);

      if (targetModel) {
        const provider = modelRegistry.getProvider(targetModel.provider);
        if (provider) {
          streamIterator = provider.stream(aiRequest);
        } else {
          streamIterator = smartRouter.streamWithFallback(aiRequest);
        }
      } else {
        streamIterator = smartRouter.streamWithFallback(aiRequest);
      }
    }

    for await (const chunk of streamIterator) {
      if (chunk.type === 'meta') {
        effectiveModel = chunk.model || effectiveModel;
        effectiveProvider = chunk.provider || effectiveProvider;
        routingDecision = chunk.routingDecision;
        sendChunk(chunk);
      } else if (chunk.type === 'delta') {
        fullContent += chunk.content || '';
        sendChunk(chunk);
      } else if (chunk.type === 'reasoning') {
        fullReasoning += chunk.reasoningContent || '';
        sendChunk(chunk);
      } else if (chunk.type === 'error') {
        sendChunk(chunk);
        break;
      } else if (chunk.type === 'done') {
        sendChunk(chunk);
      }
    }

    // Persist messages to conversation in database if conversationId provided
    if (conversationId) {
      const conv = db.getConversation(conversationId);
      if (conv) {
        const assistantMessage: ChatMessage = {
          id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
          role: 'assistant',
          content: fullContent,
          reasoningContent: fullReasoning || undefined,
          timestamp: new Date().toISOString(),
          modelUsed: effectiveModel,
          providerUsed: effectiveProvider,
          routingDecision,
        };
        conv.messages.push(assistantMessage);
        conv.modelUsed = effectiveModel;
        db.saveConversation(conv);
      }
    }
  } catch (err: any) {
    sendChunk({ type: 'error', error: err.message || 'Streaming failed' });
  } finally {
    res.end();
  }
});

chatRouter.post('/chat', async (req, res) => {
  const { messages, modelId = 'smart-router', temperature } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages array is required.' });
  }

  const aiRequest: AIRequest = {
    messages,
    modelId,
    temperature,
    stream: false,
  };

  try {
    let result;
    if (modelId === 'smart-router') {
      const { model, decision } = await smartRouter.selectOptimalModel(aiRequest);
      const provider = modelRegistry.getProvider(model.provider) || modelRegistry.getProvider('saturday')!;
      const resp = await provider.generate({ ...aiRequest, modelId: model.id });
      result = { ...resp, routingDecision: decision };
    } else if (modelId === 'free-router') {
      const { model, decision } = await freeRouter.selectFreeModel(aiRequest);
      const provider = modelRegistry.getProvider(model.provider) || modelRegistry.getProvider('saturday')!;
      const resp = await provider.generate({ ...aiRequest, modelId: model.id });
      result = { ...resp, routingDecision: decision };
    } else {
      const models = await modelRegistry.discoverAllModels();
      const targetModel = models.find(m => m.id === modelId);
      const provider = targetModel ? modelRegistry.getProvider(targetModel.provider) : modelRegistry.getProvider('saturday');
      result = await provider!.generate(aiRequest);
    }

    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
