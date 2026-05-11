/**
 * Modulo de IA — Bot de Telegram para SANSUR (placeholder)
 *
 * Objetivo final: permitir consultas a la base de datos del ERP usando
 * lenguaje natural via chat de Telegram. Ejemplos esperados:
 *
 *   "Cuantos ventiladores Miray me quedan?"
 *   "Cual fue el monto de ventas de hoy?"
 *   "Que productos estan en stock minimo?"
 *   "Top 5 ventiladores mas vendidos este mes"
 *
 * Plan de implementacion (Sprint futuro):
 *   1. Conectar con la Telegram Bot API (long polling o webhooks).
 *   2. Mapear chat_id -> usuario del ERP para autenticacion y RBAC.
 *   3. Recibir mensajes de texto y enviarlos a un LLM con function calling.
 *   4. El LLM elige entre herramientas:
 *        - getStockBySku, getStockByBrand
 *        - getDailySalesSummary, getMonthlyTopProducts
 *        - getLowStockAlerts
 *      Cada herramienta es una consulta tipada a Prisma — el LLM nunca
 *      genera SQL crudo, evitando inyeccion.
 *   5. Formatear la respuesta y enviarla al usuario.
 *
 * Por ahora este archivo solo arranca y reporta su estado.
 */

import 'dotenv/config';

const token = process.env.TELEGRAM_BOT_TOKEN;
const openaiKey = process.env.OPENAI_API_KEY;

console.log('[SANSUR Telegram Bot] Modulo de IA — placeholder');
console.log('---------------------------------------------');
console.log(`Token Telegram configurado: ${token ? 'si' : 'NO (pendiente)'}`);
console.log(`API Key LLM configurada:    ${openaiKey ? 'si' : 'NO (pendiente)'}`);
console.log('');
console.log('Este bot esta listo para la siguiente fase del proyecto.');
console.log('Ver TODO en este archivo para el plan de implementacion.');
console.log('');
console.log('Funcionalidades planeadas (US18 + extension Telegram):');
console.log('  - Consulta de stock por marca/modelo en lenguaje natural');
console.log('  - Resumen de ventas del dia');
console.log('  - Alertas de stock minimo');
console.log('  - Top productos vendidos');
console.log('  - Function calling sobre Prisma (no SQL crudo)');

// Heartbeat para que el proceso quede activo en dev
setInterval(() => {}, 1 << 30);
