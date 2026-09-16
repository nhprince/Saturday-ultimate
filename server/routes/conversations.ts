import { Router } from 'express';
import { db, Conversation } from '../db';
import { ChatMessage } from '../providers/types';

export const conversationsRouter = Router();

// GET /api/conversations
conversationsRouter.get('/conversations', (req, res) => {
  try {
    const list = db.listConversations();
    res.json({ success: true, data: list });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/conversations - create new conversation
conversationsRouter.post('/conversations', (req, res) => {
  try {
    const { title = 'New Conversation', modelUsed } = req.body;
    const newConv: Conversation = {
      id: 'conv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      title,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pinned: false,
      archived: false,
      modelUsed: modelUsed || 'smart-router',
      messages: [],
    };

    const saved = db.saveConversation(newConv);
    res.status(201).json({ success: true, data: saved });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/conversations/:id
conversationsRouter.get('/conversations/:id', (req, res) => {
  try {
    const conv = db.getConversation(req.params.id);
    if (!conv) {
      return res.status(404).json({ success: false, error: 'Conversation not found' });
    }
    res.json({ success: true, data: conv });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/conversations/:id - update title, pinned, messages, etc.
conversationsRouter.patch('/conversations/:id', (req, res) => {
  try {
    const conv = db.getConversation(req.params.id);
    if (!conv) {
      return res.status(404).json({ success: false, error: 'Conversation not found' });
    }

    const { title, pinned, archived, modelUsed, messages } = req.body;
    if (title !== undefined) conv.title = title;
    if (pinned !== undefined) conv.pinned = pinned;
    if (archived !== undefined) conv.archived = archived;
    if (modelUsed !== undefined) conv.modelUsed = modelUsed;
    if (messages !== undefined) conv.messages = messages;

    const saved = db.saveConversation(conv);
    res.json({ success: true, data: saved });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/conversations/:id
conversationsRouter.delete('/conversations/:id', (req, res) => {
  try {
    const ok = db.deleteConversation(req.params.id);
    res.json({ success: ok });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/conversations/clear
conversationsRouter.post('/conversations/clear', (req, res) => {
  try {
    db.clearAllConversations();
    res.json({ success: true, message: 'All conversations cleared' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/attachments/upload - lightweight attachment processing
conversationsRouter.post('/attachments/upload', (req, res) => {
  try {
    const { name, size, type, dataUrl, content } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Filename is required' });
    }

    const attachment = {
      id: 'att_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      name,
      size: size || 0,
      type: type || 'application/octet-stream',
      dataUrl,
      content: content || (type?.startsWith('text/') || type?.includes('json') ? dataUrl : undefined),
    };

    res.json({ success: true, data: attachment });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
