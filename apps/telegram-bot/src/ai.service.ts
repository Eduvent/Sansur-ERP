/**
 * Servicio IA para el Bot de Telegram — Function Calling con OpenAI
 *
 * Misma logica que el servicio de la API, pero standalone para el bot.
 * El LLM tiene acceso a funciones tipadas que consultan Prisma.
 */
import OpenAI from 'openai';
import { prisma, MovementType } from '@sansur/database';
import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from 'openai/resources/chat/completions';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function buildSystemPrompt(): string {
  const today = new Date().toISOString().split('T')[0];
  return `Eres el asistente virtual de SANSUR, una empresa peruana que vende ventiladores.
Tienes acceso al sistema ERP via Telegram y puedes consultar la base de datos.

Puedes consultar:
- Catalogo de productos (ventiladores de techo, pie, pared, mesa)
- Stock actual y alertas de stock minimo
- Historial y resumen de ventas
- Movimientos de inventario (kardex)
- Proveedores

Reglas:
- Responde SIEMPRE en espanol, de forma concisa y amigable.
- Para dinero usa S/ (soles peruanos).
- Usa las funciones para consultar datos reales. No inventes datos.
- Formatea para Telegram: usa texto plano, listas con guiones, numeros claros.
- No uses markdown avanzado (solo *negrita* e _italica_).
- Hoy es ${today}.`;
}

// ── Tools ───────────────────────────────────────────────────────
const tools: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'buscar_productos',
      description: 'Busca productos por nombre, marca, categoria o SKU',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Texto de busqueda' },
          category: { type: 'string', description: 'Categoria: techo, pie, pared, mesa' },
          limit: { type: 'number', description: 'Max resultados (default: 10)' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'productos_stock_bajo',
      description: 'Productos con stock menor o igual al minimo configurado',
      parameters: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Max resultados (default: 10)' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'resumen_ventas',
      description: 'Resumen de ventas para un periodo',
      parameters: {
        type: 'object',
        properties: {
          desde: { type: 'string', description: 'Fecha inicio YYYY-MM-DD' },
          hasta: { type: 'string', description: 'Fecha fin YYYY-MM-DD' },
          limit: { type: 'number', description: 'Max ventas detalladas (default: 20)' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'top_productos_vendidos',
      description: 'Productos mas vendidos en un periodo',
      parameters: {
        type: 'object',
        properties: {
          desde: { type: 'string', description: 'Fecha inicio YYYY-MM-DD' },
          hasta: { type: 'string', description: 'Fecha fin YYYY-MM-DD' },
          limit: { type: 'number', description: 'Cantidad top (default: 5)' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'estadisticas_generales',
      description: 'Estadisticas generales: productos, ventas de hoy, stock bajo',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'movimientos_recientes',
      description: 'Movimientos recientes del kardex',
      parameters: {
        type: 'object',
        properties: {
          tipo: { type: 'string', enum: ['ENTRADA', 'SALIDA', 'AJUSTE', 'DEVOLUCION'] },
          limit: { type: 'number', description: 'Max movimientos (default: 10)' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'listar_proveedores',
      description: 'Lista proveedores registrados',
      parameters: { type: 'object', properties: {} },
    },
  },
];

// ── Implementations ─────────────────────────────────────────────
async function buscar_productos(args: { query?: string; category?: string; limit?: number }) {
  const { query, category, limit = 10 } = args;
  const where: Record<string, unknown> = { active: true };
  if (category) where.category = { contains: category, mode: 'insensitive' };
  if (query) {
    where.OR = [
      { name: { contains: query, mode: 'insensitive' } },
      { brand: { contains: query, mode: 'insensitive' } },
      { sku: { contains: query, mode: 'insensitive' } },
    ];
  }
  const products = await prisma.product.findMany({
    where, take: limit, orderBy: { name: 'asc' },
    select: { sku: true, name: true, brand: true, category: true, price: true, stock: true, minStock: true },
  });
  return { total: products.length, productos: products };
}

async function productos_stock_bajo(args: { limit?: number }) {
  const products = await prisma.product.findMany({
    where: { active: true }, orderBy: { stock: 'asc' },
    select: { sku: true, name: true, brand: true, stock: true, minStock: true, price: true },
  });
  const low = products.filter((p) => p.stock <= p.minStock).slice(0, args.limit ?? 10);
  return { total: low.length, productos: low };
}

async function resumen_ventas(args: { desde?: string; hasta?: string; limit?: number }) {
  const today = new Date().toISOString().split('T')[0];
  const desde = new Date(args.desde ?? today); desde.setHours(0, 0, 0, 0);
  const hasta = new Date(args.hasta ?? today); hasta.setHours(23, 59, 59, 999);

  const [agg, ventas] = await Promise.all([
    prisma.sale.aggregate({
      where: { createdAt: { gte: desde, lte: hasta }, cancelled: false },
      _sum: { total: true }, _count: true,
    }),
    prisma.sale.findMany({
      where: { createdAt: { gte: desde, lte: hasta }, cancelled: false },
      take: args.limit ?? 20, orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { fullName: true } },
        movement: { include: { items: { include: { product: { select: { name: true } } } } } },
      },
    }),
  ]);

  return {
    periodo: { desde: desde.toISOString().split('T')[0], hasta: hasta.toISOString().split('T')[0] },
    totalVentas: agg._count, montoTotal: agg._sum.total ?? 0,
    ventas: ventas.map((v) => ({
      boleta: v.receiptNumber, total: v.total, vendedor: v.user.fullName,
      items: v.movement?.items.map((it) => ({ producto: it.product.name, cantidad: it.quantity })),
    })),
  };
}

async function top_productos_vendidos(args: { desde?: string; hasta?: string; limit?: number }) {
  const today = new Date().toISOString().split('T')[0];
  const desde = new Date(args.desde ?? new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]);
  desde.setHours(0, 0, 0, 0);
  const hasta = new Date(args.hasta ?? today); hasta.setHours(23, 59, 59, 999);

  const items = await prisma.movementItem.findMany({
    where: { movement: { type: MovementType.SALIDA, createdAt: { gte: desde, lte: hasta } } },
    include: { product: { select: { name: true, sku: true, brand: true } } },
  });

  const grouped = new Map<string, { name: string; sku: string; brand: string; cantidad: number }>();
  for (const item of items) {
    const e = grouped.get(item.productId) ?? { name: item.product.name, sku: item.product.sku, brand: item.product.brand, cantidad: 0 };
    e.cantidad += item.quantity;
    grouped.set(item.productId, e);
  }

  return { top: [...grouped.values()].sort((a, b) => b.cantidad - a.cantidad).slice(0, args.limit ?? 5) };
}

async function estadisticas_generales() {
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const [total, active, moves, salesAgg, prods] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { active: true } }),
    prisma.movement.findMany({ where: { createdAt: { gte: todayStart } }, include: { items: true } }),
    prisma.sale.aggregate({ where: { createdAt: { gte: todayStart }, cancelled: false }, _sum: { total: true }, _count: true }),
    prisma.product.findMany({ where: { active: true }, select: { stock: true, minStock: true } }),
  ]);
  const entradas = moves.filter((m) => m.type === MovementType.ENTRADA || m.type === MovementType.DEVOLUCION).flatMap((m) => m.items).reduce((s, i) => s + i.quantity, 0);
  const salidas = moves.filter((m) => m.type === MovementType.SALIDA).flatMap((m) => m.items).reduce((s, i) => s + i.quantity, 0);
  return { totalProductos: total, activos: active, entradasHoy: entradas, salidasHoy: salidas, ventasHoy: salesAgg._count, montoVentasHoy: salesAgg._sum.total ?? 0, stockBajo: prods.filter((p) => p.stock <= p.minStock).length };
}

async function movimientos_recientes(args: { tipo?: string; limit?: number }) {
  const where: Record<string, unknown> = {};
  if (args.tipo) where.type = args.tipo;
  const moves = await prisma.movement.findMany({
    where, take: args.limit ?? 10, orderBy: { createdAt: 'desc' },
    include: { user: { select: { fullName: true } }, supplier: { select: { name: true } }, items: { include: { product: { select: { name: true, sku: true } } } } },
  });
  return {
    total: moves.length,
    movimientos: moves.map((m) => ({
      tipo: m.type, razon: m.reason, nota: m.note, proveedor: m.supplier?.name, usuario: m.user.fullName,
      fecha: m.createdAt.toISOString(),
      items: m.items.map((it) => ({ producto: it.product.name, cantidad: it.quantity })),
    })),
  };
}

async function listar_proveedores() {
  const suppliers = await prisma.supplier.findMany({ where: { active: true }, orderBy: { name: 'asc' }, select: { name: true, ruc: true, phone: true, email: true } });
  return { total: suppliers.length, proveedores: suppliers };
}

// ── Dispatcher ──────────────────────────────────────────────────
const toolFns: Record<string, (a: Record<string, unknown>) => Promise<unknown>> = {
  buscar_productos: (a) => buscar_productos(a as Parameters<typeof buscar_productos>[0]),
  productos_stock_bajo: (a) => productos_stock_bajo(a as Parameters<typeof productos_stock_bajo>[0]),
  resumen_ventas: (a) => resumen_ventas(a as Parameters<typeof resumen_ventas>[0]),
  top_productos_vendidos: (a) => top_productos_vendidos(a as Parameters<typeof top_productos_vendidos>[0]),
  estadisticas_generales: () => estadisticas_generales(),
  movimientos_recientes: (a) => movimientos_recientes(a as Parameters<typeof movimientos_recientes>[0]),
  listar_proveedores: () => listar_proveedores(),
};

// ── Main chat ───────────────────────────────────────────────────
export type ChatMessage = { role: 'user' | 'assistant'; content: string };

export async function chat(userMessage: string, history: ChatMessage[] = []): Promise<string> {
  const messages: ChatCompletionMessageParam[] = [
    { role: 'system', content: buildSystemPrompt() },
    ...history.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user', content: userMessage },
  ];

  let iterations = 0;

  while (iterations < 5) {
    iterations++;
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', messages, tools, tool_choice: 'auto', temperature: 0.3, max_tokens: 1024,
    });

    const msg = completion.choices[0].message;

    if (!msg.tool_calls || msg.tool_calls.length === 0) {
      return msg.content ?? 'No pude generar una respuesta.';
    }

    messages.push(msg);

    for (const tc of msg.tool_calls) {
      const fn = toolFns[tc.function.name];
      let result: unknown;
      if (fn) {
        try { result = await fn(JSON.parse(tc.function.arguments)); }
        catch (err) { result = { error: (err as Error).message }; }
      } else {
        result = { error: `Funcion desconocida: ${tc.function.name}` };
      }
      messages.push({ role: 'tool', tool_call_id: tc.id, content: JSON.stringify(result) });
    }
  }

  return 'Limite de iteraciones alcanzado. Simplifica tu pregunta.';
}
