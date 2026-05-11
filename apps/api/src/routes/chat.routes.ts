// US18 — Asistente IA con consultas en lenguaje natural
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { chat, type ChatMessage } from '../services/ai.service.js';

const router = Router();
router.use(requireAuth);

router.post('/', async (req, res) => {
  const { message, history } = req.body as {
    message?: string;
    history?: ChatMessage[];
  };

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ error: 'El campo "message" es requerido' });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({ error: 'Servicio de IA no configurado (falta OPENAI_API_KEY)' });
  }

  try {
    const reply = await chat(message.trim(), history ?? []);
    return res.json({ reply });
  } catch (err) {
    console.error('[Chat AI Error]', err);
    const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
    return res.status(500).json({ error: `Error del servicio IA: ${errorMsg}` });
  }
});

export default router;
