import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { modelsRouter } from './routes/models';
import { chatRouter } from './routes/chat';
import { conversationsRouter } from './routes/conversations';
import { searchRouter } from './routes/search';
import { adminRouter } from './routes/admin';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProd = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';

async function createServer() {
  const app = express();

  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  // API Routes
  app.use('/api', modelsRouter);
  app.use('/api', chatRouter);
  app.use('/api', conversationsRouter);
  app.use('/api', searchRouter);
  app.use('/api', adminRouter);

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      name: 'Saturday AI Server',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  if (!isProd) {
    // Vite middleware in development for fast HMR
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', allowedHosts: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    const distPath = path.resolve(__dirname, '../dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`\n✨ Saturday AI server active on http://${HOST}:${PORT}`);
    console.log(`✨ Environment: ${isProd ? 'production' : 'development'}\n`);
  });
}

createServer().catch(err => {
  console.error('Fatal error starting Saturday server:', err);
  process.exit(1);
});
