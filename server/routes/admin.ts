import { Router } from 'express';
import { db } from '../db';
import { modelRegistry } from '../providers/registry';

export const adminRouter = Router();

// GET /api/admin/overview - summary metrics
adminRouter.get('/admin/overview', async (req, res) => {
  try {
    const models = await modelRegistry.discoverAllModels();
    const workingModels = models.filter(m => m.health === 'WORKING');
    const conversations = db.listConversations();
    const totalMessages = conversations.reduce((acc, c) => acc + c.messages.length, 0);
    const logs = db.getLogs(15);
    const providers = modelRegistry.listProviders();

    res.json({
      success: true,
      data: {
        totalModels: models.length,
        workingModels: workingModels.length,
        totalProviders: providers.length,
        configuredProviders: providers.filter(p => p.configured).length,
        totalConversations: conversations.length,
        totalMessages,
        systemStatus: 'healthy',
        uptimeSeconds: Math.floor(process.uptime()),
        recentLogs: logs,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/admin/providers - list providers with masked keys
adminRouter.get('/admin/providers', (req, res) => {
  try {
    const list = modelRegistry.listProviders();
    const secrets = db.getProviderSecrets();

    const data = list.map(p => {
      const secret = secrets[p.id] || {};
      const key = secret.apiKey || '';
      const masked = key ? (key.substring(0, 6) + '...' + key.substring(key.length - 4)) : '';

      return {
        ...p,
        enabled: secret.enabled !== false,
        baseUrl: secret.baseUrl || '',
        hasKey: !!key,
        maskedKey: masked,
      };
    });

    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/admin/providers/:id - update provider key, base url, enabled status
adminRouter.patch('/admin/providers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { apiKey, baseUrl, enabled } = req.body;

    db.updateProviderConfig(id, { apiKey, baseUrl, enabled });
    // Trigger fresh model discovery
    await modelRegistry.discoverAllModels(true);

    res.json({ success: true, message: `Provider ${id} configuration updated.` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/admin/providers/:id/test - run live connectivity test
adminRouter.post('/admin/providers/:id/test', async (req, res) => {
  try {
    const { id } = req.params;
    const provider = modelRegistry.getProvider(id);

    if (!provider) {
      return res.status(404).json({ success: false, error: `Provider ${id} not found.` });
    }

    const models = await provider.listModels();
    const testModel = models[0];

    if (!testModel) {
      return res.json({
        success: true,
        data: {
          status: 'UNSUPPORTED',
          message: 'No testable models discovered for this provider.',
          latencyMs: 0,
        },
      });
    }

    const health = await provider.healthCheck(testModel);
    res.json({ success: true, data: health });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/admin/models - list all models with admin controls
adminRouter.get('/admin/models', async (req, res) => {
  try {
    const models = await modelRegistry.discoverAllModels();
    res.json({ success: true, data: models });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/admin/models/override - override capabilities, enabled, priority
adminRouter.patch('/admin/models/override', (req, res) => {
  try {
    const { modelId, enabled, priority, capabilities, isFree } = req.body;
    if (!modelId) {
      return res.status(400).json({ success: false, error: 'modelId is required' });
    }

    db.setModelOverride(modelId, {
      enabled,
      priority,
      capabilities,
      isFree,
    });

    res.json({ success: true, message: `Model override applied for ${modelId}` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/admin/models/health-check - manual trigger
adminRouter.post('/admin/models/health-check', async (req, res) => {
  try {
    const { modelId } = req.body;
    if (!modelId) {
      return res.status(400).json({ success: false, error: 'modelId is required' });
    }
    const health = await modelRegistry.checkModelHealth(modelId, true);
    res.json({ success: true, data: health });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/admin/routing
adminRouter.get('/admin/routing', (req, res) => {
  try {
    const config = db.getRouterConfig();
    res.json({ success: true, data: config });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/admin/routing
adminRouter.patch('/admin/routing', (req, res) => {
  try {
    db.updateRouterConfig(req.body);
    res.json({ success: true, message: 'Router configuration updated' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/admin/cms
adminRouter.get('/admin/cms', (req, res) => {
  try {
    const cms = db.getCMSConfig();
    res.json({ success: true, data: cms });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/admin/cms
adminRouter.patch('/admin/cms', (req, res) => {
  try {
    db.updateCMSConfig(req.body);
    res.json({ success: true, message: 'CMS updated' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/admin/logs
adminRouter.get('/admin/logs', (req, res) => {
  try {
    const limit = Number(req.query.limit) || 100;
    const logs = db.getLogs(limit);
    res.json({ success: true, data: logs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
