import { Router, Request, Response } from 'express';
import { aiAssistant } from '../services/aiAssistant';
import { sanitizeChatMessage, isValidZoneId } from '../utils/validators';

export const assistantRoutes = Router();

// POST /api/assistant/chat — AI assistant query
assistantRoutes.post('/chat', async (req: Request, res: Response) => {
  const { message, userZoneId } = req.body;

  // Validate and sanitize message
  const validation = sanitizeChatMessage(message);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }

  // Validate optional userZoneId
  if (userZoneId && !isValidZoneId(userZoneId)) {
    return res.status(400).json({ error: `Invalid zone: '${userZoneId}'` });
  }

  try {
    const response = await aiAssistant.processQuery(validation.sanitized, userZoneId);
    res.json(response);
  } catch (error) {
    console.error('Assistant error:', error);
    res.status(500).json({ error: 'Failed to process query' });
  }
});
