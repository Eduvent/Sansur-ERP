// US11, US12 — dashboard y alertas de stock minimo
import { Router } from 'express';
import { prisma, MovementType } from '@sansur/database';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/summary', async (_req, res) => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [totalProducts, totalActive, todayMovements, lowStockProducts, todaySalesAgg] =
    await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { active: true } }),
      prisma.movement.findMany({
        where: { createdAt: { gte: todayStart } },
        include: { items: true },
      }),
      prisma.product.findMany({
        where: { active: true },
        orderBy: { stock: 'asc' },
      }),
      prisma.sale.aggregate({
        where: { createdAt: { gte: todayStart }, cancelled: false },
        _sum: { total: true },
        _count: true,
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

  const lowStock = lowStockProducts.filter((p) => p.stock <= p.minStock);

  return res.json({
    totalProducts,
    totalActive,
    entradasHoy,
    salidasHoy,
    ventasHoy: todaySalesAgg._count,
    montoVentasHoy: todaySalesAgg._sum.total ?? 0,
    lowStockCount: lowStock.length,
    lowStockProducts: lowStock.slice(0, 10),
  });
});

export default router;
