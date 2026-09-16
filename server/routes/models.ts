import { Router } from 'express';
import { modelRegistry } from '../providers/registry';

export const modelsRouter = Router();

// GET /api/models - discover and return all normalized models
modelsRouter.get('/models', async (req, res) => {
  try {
    const force = req.query.refresh === 'true';
    const models = await modelRegistry.discoverAllModels(force);
    res.json({
      success: true,
      data: models,
      total: models.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/models/available - filtered by available & working
modelsRouter.get('/models/available', async (req, res) => {
  try {
    const models = await modelRegistry.getAvailableModels();
    res.json({
      success: true,
      data: models,
      total: models.length,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/models/health-check - run health check on single or batch
modelsRouter.post('/models/health-check', async (req, res) => {
  try {
    const { modelId, batch } = req.body;
    if (batch) {
      const results = await modelRegistry.runHealthCheckBatch();
      return res.json({ success: true, data: results });
    }

    if (!modelId) {
      return res.status(400).json({ success: false, error: 'modelId is required' });
    }

    const health = await modelRegistry.checkModelHealth(modelId, true);
    res.json({ success: true, data: health });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/providers - list provider status
modelsRouter.get('/providers', (req, res) => {
  try {
    const providers = modelRegistry.listProviders();
    res.json({ success: true, data: providers });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
