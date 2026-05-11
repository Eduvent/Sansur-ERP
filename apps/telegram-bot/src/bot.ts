/**
 * Bot de Telegram para SANSUR ERP
 *
 * Permite consultar la base de datos del ERP usando lenguaje natural.
 * Usa OpenAI GPT-4o-mini con function calling sobre Prisma (nunca SQL crudo).
 *
 * Ejemplos de preguntas:
 *   "Cuantos ventiladores Miray me quedan?"
 *   "Cual fue el monto de ventas de hoy?"
 *   "Que productos estan en stock minimo?"
 *   "Top 5 ventiladores mas vendidos este mes"
 */
import 'dotenv/config';
import { Bot } from 'grammy';
import { chat } from './ai.service.js';

const token = process.env.TELEGRAM_BOT_TOKEN;
const openaiKey = process.env.OPENAI_API_KEY;

if (!token) {
  console.error('TELEGRAM_BOT_TOKEN no configurado. Revisa tu .env');
  process.exit(1);
}

if (!openaiKey) {
  console.error('OPENAI_API_KEY no configurado. Revisa tu .env');
  process.exit(1);
}

const bot = new Bot(token);

// IDs de Telegram autorizados (opcional — si esta vacio, cualquiera puede usar el bot)
const ALLOWED_IDS = process.env.TELEGRAM_ALLOWED_IDS
  ? process.env.TELEGRAM_ALLOWED_IDS.split(',').map((id) => Number(id.trim()))
  : [];

// Historial de conversacion por usuario (en memoria, se pierde al reiniciar)
const userHistory = new Map<number, Array<{ role: 'user' | 'assistant'; content: string }>>();
const MAX_HISTORY = 10;

// ── Middleware de autorizacion ─────────────────────────────────
bot.use(async (ctx, next) => {
  if (ALLOWED_IDS.length > 0 && ctx.from) {
    if (!ALLOWED_IDS.includes(ctx.from.id)) {
      await ctx.reply('No tienes acceso a este bot. Contacta al administrador.');
      return;
    }
  }
  await next();
});

// ── Comando /start ────────────────────────────────────────────
bot.command('start', async (ctx) => {
  await ctx.reply(
    '👋 ¡Hola! Soy el asistente de *SANSUR ERP*.\n\n' +
    'Puedes preguntarme sobre:\n' +
    '📦 Stock y productos\n' +
    '💰 Ventas del dia/mes\n' +
    '📊 Estadisticas generales\n' +
    '📋 Movimientos del kardex\n' +
    '🏭 Proveedores\n\n' +
    'Escribe tu pregunta en lenguaje natural. Ejemplo:\n' +
    '_"Cuantos ventiladores de techo me quedan?"_',
    { parse_mode: 'Markdown' },
  );
});

// ── Comando /clear — limpia historial ─────────────────────────
bot.command('clear', async (ctx) => {
  if (ctx.from) userHistory.delete(ctx.from.id);
  await ctx.reply('Historial limpiado.');
});

// ── Comando /help ─────────────────────────────────────────────
bot.command('help', async (ctx) => {
  await ctx.reply(
    '*Comandos disponibles:*\n\n' +
    '/start — Mensaje de bienvenida\n' +
    '/clear — Limpiar historial de conversacion\n' +
    '/help — Mostrar esta ayuda\n\n' +
    '*Ejemplos de preguntas:*\n' +
    '• Que productos estan con stock bajo?\n' +
    '• Cual fue el total de ventas de hoy?\n' +
    '• Cuantos ventiladores Miray tenemos?\n' +
    '• Top 5 productos mas vendidos del mes\n' +
    '• Lista de proveedores',
    { parse_mode: 'Markdown' },
  );
});

// ── Handler de mensajes de texto ──────────────────────────────
bot.on('message:text', async (ctx) => {
  const userId = ctx.from.id;
  const userMessage = ctx.message.text;

  // Indicador de "escribiendo..."
  await ctx.replyWithChatAction('typing');

  // Obtener/crear historial
  const history = userHistory.get(userId) ?? [];

  try {
    const reply = await chat(userMessage, history);

    // Actualizar historial
    history.push({ role: 'user', content: userMessage });
    history.push({ role: 'assistant', content: reply });

    // Mantener solo los ultimos N mensajes
    while (history.length > MAX_HISTORY * 2) {
      history.shift();
    }
    userHistory.set(userId, history);

    // Enviar respuesta (dividir si es muy larga para Telegram)
    const MAX_LENGTH = 4000;
    if (reply.length <= MAX_LENGTH) {
      await ctx.reply(reply);
    } else {
      // Dividir en chunks
      for (let i = 0; i < reply.length; i += MAX_LENGTH) {
        await ctx.reply(reply.substring(i, i + MAX_LENGTH));
      }
    }
  } catch (err) {
    console.error('[Bot Error]', err);
    await ctx.reply('Hubo un error procesando tu pregunta. Intenta de nuevo.');
  }
});

// ── Arrancar bot ──────────────────────────────────────────────
bot.start({
  onStart: (info) => {
    console.log(`[SANSUR Bot] Conectado como @${info.username}`);
    console.log(`[SANSUR Bot] Usuarios autorizados: ${ALLOWED_IDS.length > 0 ? ALLOWED_IDS.join(', ') : 'todos'}`);
  },
});

// Graceful shutdown
process.once('SIGINT', () => bot.stop());
process.once('SIGTERM', () => bot.stop());
