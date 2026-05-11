/**
 * Servicio IA — Function Calling con OpenAI GPT-4o-mini
 *
 * El LLM NUNCA genera SQL crudo. Tiene un set de funciones tipadas
 * que ejecutan queries seguras via Prisma. El flujo es:
 *
 *   Usuario pregunta -> OpenAI decide que funcion llamar ->
 *   Ejecutamos la query Prisma -> OpenAI formatea la respuesta
 */
import OpenAI from 'openai';
import { prisma, MovementType } from '@sansur/database';
import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from 'openai/resources/chat/completions';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ── System prompt ───────────────────────────────────────────────
function buildSystemPrompt(): string {
  const today = new Date().toISOString().split('T')[0];
  return `Eres el asistente virtual de SANSUR, una empresa peruana que vende ventiladores.
Tienes acceso al sistema ERP y puedes consultar la base de datos para responder preguntas sobre:
- Catalogo de productos (ventiladores de techo, pie, pared, mesa)
- Stock actual y alertas de stock minimo
- Historial y resumen de ventas
- Movimientos de inventario (kardex: entradas, salidas, ajustes, devoluciones)
- Proveedores

Reglas:
- Responde SIEMPRE en espanol, de forma concisa y amigable.
- Para montos de dinero usa S/ (soles peruanos).
- Usa las funciones disponibles para consultar datos reales. No inventes datos.
- Si necesitas mas informacion para responder, pregunta al usuario.
- Formatea los datos de manera legible (usa listas, tablas simples cuando sea apropiado).
- Hoy es ${today}.`;
}

// ── Tool definitions ────────────────────────────────────────────
const tools: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'buscar_productos',
      description:
        'Busca productos en el catalogo por nombre, marca, categoria o SKU. Retorna datos del producto con stock.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Texto de busqueda (nombre, marca o SKU)',
          },
          category: {
            type: 'string',
            description: 'Filtrar por categoria: techo, pie, pared, mesa',
          },
          soloActivos: {
            type: 'boolean',
            description: 'Si true, solo muestra productos activos (default: true)',
          },
          limit: {
            type: 'number',
            description: 'Maximo de resultados (default: 10)',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'productos_stock_bajo',
      description:
        'Obtiene productos cuyo stock actual es menor o igual al stock minimo configurado. Util para alertas de reorden.',
      parameters: {
        type: 'object',
        properties: {
          limit: {
            type: 'number',
            description: 'Maximo de resultados (default: 10)',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'resumen_ventas',
      description:
        'Obtiene el resumen de ventas para un periodo. Retorna cantidad de ventas, monto total, y detalle.',
      parameters: {
        type: 'object',
        properties: {
          desde: {
            type: 'string',
            description: 'Fecha inicio en formato YYYY-MM-DD (default: hoy)',
          },
          hasta: {
            type: 'string',
            description: 'Fecha fin en formato YYYY-MM-DD (default: hoy)',
          },
          limit: {
            type: 'number',
            description: 'Maximo de ventas detalladas a retornar (default: 20)',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'top_productos_vendidos',
      description:
        'Obtiene los productos mas vendidos en un periodo, ordenados por cantidad total vendida.',
      parameters: {
        type: 'object',
        properties: {
          desde: {
            type: 'string',
            description: 'Fecha inicio YYYY-MM-DD',
          },
          hasta: {
            type: 'string',
            description: 'Fecha fin YYYY-MM-DD',
          },
          limit: {
            type: 'number',
            description: 'Cantidad de productos top (default: 5)',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'estadisticas_generales',
      description:
        'Retorna estadisticas generales del ERP: total productos, productos activos, entradas/salidas de hoy, ventas de hoy, productos en stock bajo.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'movimientos_recientes',
      description:
        'Obtiene los movimientos recientes del kardex (entradas, salidas, ajustes, devoluciones) con sus items.',
      parameters: {
        type: 'object',
        properties: {
          tipo: {
            type: 'string',
            enum: ['ENTRADA', 'SALIDA', 'AJUSTE', 'DEVOLUCION'],
            description: 'Filtrar por tipo de movimiento',
          },
          limit: {
            type: 'number',
            description: 'Maximo de movimientos (default: 10)',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'listar_proveedores',
      description: 'Lista los proveedores registrados en el sistema con sus datos de contacto.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
];

// ── Tool implementations ────────────────────────────────────────

async function buscar_productos(args: {
  query?: string;
  category?: string;
  soloActivos?: boolean;
  limit?: number;
}) {
  const { query, category, soloActivos = true, limit = 10 } = args;

  const where: Record<string, unknown> = {};
  if (soloActivos) where.active = true;
  if (category) where.category = { contains: category, mode: 'insensitive' };
  if (query) {
    where.OR = [
      { name: { contains: query, mode: 'insensitive' } },
      { brand: { contains: query, mode: 'insensitive' } },
      { sku: { contains: query, mode: 'insensitive' } },
    ];
  }

  const products = await prisma.product.findMany({
    where,
    take: limit,
    orderBy: { name: 'asc' },
    select: {
      sku: true,
      name: true,
      brand: true,
      category: true,
      price: true,
      stock: true,
      minStock: true,
      active: true,
    },
  });

  return { total: products.length, productos: products };
}

async function productos_stock_bajo(args: { limit?: number }) {
  const { limit = 10 } = args;

  const products = await prisma.product.findMany({
    where: { active: true },
    orderBy: { stock: 'asc' },
    select: {
      sku: true,
      name: true,
      brand: true,
      stock: true,
      minStock: true,
      price: true,
    },
  });

  const lowStock = products.filter((p) => p.stock <= p.minStock).slice(0, limit);
  return { total: lowStock.length, productos: lowStock };
}

async function resumen_ventas(args: { desde?: string; hasta?: string; limit?: number }) {
  const today = new Date().toISOString().split('T')[0];
  const desde = new Date(args.desde ?? today);
  desde.setHours(0, 0, 0, 0);

  const hasta = new Date(args.hasta ?? today);
  hasta.setHours(23, 59, 59, 999);

  const limit = args.limit ?? 20;

  const [agg, ventas] = await Promise.all([
    prisma.sale.aggregate({
      where: { createdAt: { gte: desde, lte: hasta }, cancelled: false },
      _sum: { total: true },
      _count: true,
    }),
    prisma.sale.findMany({
      where: { createdAt: { gte: desde, lte: hasta }, cancelled: false },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { fullName: true } },
        movement: {
          include: { items: { include: { product: { select: { name: true, sku: true } } } } },
        },
      },
    }),
  ]);

  return {
    periodo: { desde: desde.toISOString().split('T')[0], hasta: hasta.toISOString().split('T')[0] },
    totalVentas: agg._count,
    montoTotal: agg._sum.total ?? 0,
    ventas: ventas.map((v) => ({
      boleta: v.receiptNumber,
      total: v.total,
      vendedor: v.user.fullName,
      fecha: v.createdAt.toISOString(),
      items: v.movement?.items.map((it) => ({
        producto: it.product.name,
        cantidad: it.quantity,
        precioUnit: it.unitPrice,
      })),
    })),
  };
}

async function top_productos_vendidos(args: { desde?: string; hasta?: string; limit?: number }) {
  const today = new Date().toISOString().split('T')[0];
  const desde = new Date(args.desde ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  desde.setHours(0, 0, 0, 0);

  const hasta = new Date(args.hasta ?? today);
  hasta.setHours(23, 59, 59, 999);

  const limit = args.limit ?? 5;

  // Movimientos de tipo SALIDA (ventas) en el rango
  const items = await prisma.movementItem.findMany({
    where: {
      movement: {
        type: MovementType.SALIDA,
        createdAt: { gte: desde, lte: hasta },
      },
    },
    include: { product: { select: { name: true, sku: true, brand: true, price: true } } },
  });

  // Agrupar por producto
  const grouped = new Map<string, { name: string; sku: string; brand: string; cantidad: number; monto: number }>();
  for (const item of items) {
    const key = item.productId;
    const existing = grouped.get(key) ?? {
      name: item.product.name,
      sku: item.product.sku,
      brand: item.product.brand,
      cantidad: 0,
      monto: 0,
    };
    existing.cantidad += item.quantity;
    existing.monto += item.quantity * Number(item.unitPrice ?? item.product.price);
    grouped.set(key, existing);
  }

  const top = [...grouped.values()]
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, limit);

  return {
    periodo: { desde: desde.toISOString().split('T')[0], hasta: hasta.toISOString().split('T')[0] },
    top,
  };
}

async function estadisticas_generales() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [totalProducts, totalActive, todayMovements, todaySalesAgg, allProducts] =
    await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { active: true } }),
      prisma.movement.findMany({
        where: { createdAt: { gte: todayStart } },
        include: { items: true },
      }),
      prisma.sale.aggregate({
        where: { createdAt: { gte: todayStart }, cancelled: false },
        _sum: { total: true },
        _count: true,
      }),
      prisma.product.findMany({
        where: { active: true },
        select: { stock: true, minStock: true },
      }),
    ]);

  const entradasHoy = todayMovements
    .filter((m) => m.type === MovementType.ENTRADA || m.type === MovementType.DEVOLUCION)
    .flatMap((m) => m.items)
    .reduce((s, it) => s + it.quantity, 0);

  const salidasHoy = todayMovements
    .filter((m) => m.type === MovementType.SALIDA)
    .flatMap((m) => m.items)
    .reduce((s, it) => s + it.quantity, 0);

  const lowStock = allProducts.filter((p) => p.stock <= p.minStock).length;

  return {
    totalProductos: totalProducts,
    productosActivos: totalActive,
    entradasHoy,
    salidasHoy,
    ventasHoy: todaySalesAgg._count,
    montoVentasHoy: todaySalesAgg._sum.total ?? 0,
    productosStockBajo: lowStock,
  };
}

async function movimientos_recientes(args: { tipo?: string; limit?: number }) {
  const { tipo, limit = 10 } = args;

  const where: Record<string, unknown> = {};
  if (tipo) where.type = tipo as MovementType;

  const movements = await prisma.movement.findMany({
    where,
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { fullName: true } },
      supplier: { select: { name: true } },
      items: { include: { product: { select: { name: true, sku: true } } } },
    },
  });

  return {
    total: movements.length,
    movimientos: movements.map((m) => ({
      tipo: m.type,
      razon: m.reason,
      nota: m.note,
      proveedor: m.supplier?.name,
      usuario: m.user.fullName,
      fecha: m.createdAt.toISOString(),
      items: m.items.map((it) => ({
        producto: it.product.name,
        sku: it.product.sku,
        cantidad: it.quantity,
        precioUnit: it.unitPrice,
      })),
    })),
  };
}

async function listar_proveedores() {
  const suppliers = await prisma.supplier.findMany({
    where: { active: true },
    orderBy: { name: 'asc' },
    select: { name: true, ruc: true, phone: true, email: true },
  });

  return { total: suppliers.length, proveedores: suppliers };
}

// ── Tool dispatcher ─────────────────────────────────────────────
const toolFunctions: Record<string, (args: Record<string, unknown>) => Promise<unknown>> = {
  buscar_productos: (a) => buscar_productos(a as Parameters<typeof buscar_productos>[0]),
  productos_stock_bajo: (a) => productos_stock_bajo(a as Parameters<typeof productos_stock_bajo>[0]),
  resumen_ventas: (a) => resumen_ventas(a as Parameters<typeof resumen_ventas>[0]),
  top_productos_vendidos: (a) => top_productos_vendidos(a as Parameters<typeof top_productos_vendidos>[0]),
  estadisticas_generales: () => estadisticas_generales(),
  movimientos_recientes: (a) => movimientos_recientes(a as Parameters<typeof movimientos_recientes>[0]),
  listar_proveedores: () => listar_proveedores(),
};

// ── Main chat function ──────────────────────────────────────────
export type ChatMessage = { role: 'user' | 'assistant'; content: string };

export async function chat(
  userMessage: string,
  history: ChatMessage[] = [],
): Promise<string> {
  const messages: ChatCompletionMessageParam[] = [
    { role: 'system', content: buildSystemPrompt() },
    ...history.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user', content: userMessage },
  ];

  // Loop para manejar multiples tool calls si el modelo encadena funciones
  let iterations = 0;
  const MAX_ITERATIONS = 5;

  while (iterations < MAX_ITERATIONS) {
    iterations++;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      tools,
      tool_choice: 'auto',
      temperature: 0.3,
      max_tokens: 1024,
    });

    const choice = completion.choices[0];
    const msg = choice.message;

    // Si no hay tool calls, retornamos la respuesta directa
    if (!msg.tool_calls || msg.tool_calls.length === 0) {
      return msg.content ?? 'No pude generar una respuesta.';
    }

    // Agregar el mensaje del asistente con los tool calls
    messages.push(msg);

    // Ejecutar cada tool call
    for (const toolCall of msg.tool_calls) {
      if (toolCall.type !== 'function') continue;
      const fn = toolFunctions[toolCall.function.name];
      let result: unknown;

      if (fn) {
        try {
          const args = JSON.parse(toolCall.function.arguments);
          result = await fn(args);
        } catch (err) {
          result = { error: `Error ejecutando ${toolCall.function.name}: ${(err as Error).message}` };
        }
      } else {
        result = { error: `Funcion desconocida: ${toolCall.function.name}` };
      }

      messages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: JSON.stringify(result),
      });
    }
  }

  return 'Se alcanzo el limite de iteraciones. Por favor simplifica tu pregunta.';
}
