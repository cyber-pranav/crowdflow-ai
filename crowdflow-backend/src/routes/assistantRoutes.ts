import { Router, Request, Response } from 'express';
import { aiAssistant } from '../services/aiAssistant';

export const assistantRoutes = Router();

// POST /api/assistant/chat — AI assistant query
assistantRoutes.post('/chat', async (req: Request, res: Response) => {
  const { message, userZoneId } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Missing required field: message' });
  }

  if (message.length > 500) {
    return res.status(400).json({ error: 'Message too long (max 500 chars)' });
  }

  try {
    const response = await aiAssistant.processQuery(message, userZoneId);
    res.json(response);
  } catch (error) {
    console.error('Assistant error:', error);
    res.status(500).json({ error: 'Failed to process query' });
  }
});
