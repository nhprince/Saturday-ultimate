import { Router } from 'express';
import { db } from '../db';

export const searchRouter = Router();

searchRouter.get('/search', (req, res) => {
  const query = (req.query.q as string || '').trim().toLowerCase();

  if (!query) {
    return res.json({ success: true, data: [] });
  }

  const conversations = db.listConversations();
  const results: Array<{
    conversationId: string;
    conversationTitle: string;
    matchType: 'title' | 'message';
    snippet: string;
    timestamp: string;
  }> = [];

  for (const conv of conversations) {
    // Check title
    if (conv.title.toLowerCase().includes(query)) {
      results.push({
        conversationId: conv.id,
        conversationTitle: conv.title,
        matchType: 'title',
        snippet: conv.title,
        timestamp: conv.updatedAt,
      });
      continue;
    }

    // Check messages
    for (const msg of conv.messages) {
      if (msg.content.toLowerCase().includes(query)) {
        const index = msg.content.toLowerCase().indexOf(query);
        const start = Math.max(0, index - 40);
        const end = Math.min(msg.content.length, index + query.length + 60);
        const snippet = (start > 0 ? '...' : '') + msg.content.substring(start, end).replace(/\n/g, ' ') + (end < msg.content.length ? '...' : '');

        results.push({
          conversationId: conv.id,
          conversationTitle: conv.title,
          matchType: 'message',
          snippet,
          timestamp: msg.timestamp,
        });
        break; // One match per conversation
      }
    }
  }

  res.json({
    success: true,
    data: results.slice(0, 20),
    total: results.length,
  });
});
