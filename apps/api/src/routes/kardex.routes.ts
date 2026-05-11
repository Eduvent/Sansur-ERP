// US13 — historial de movimientos (Kardex)
import { Router } from 'express';
import { prisma } from '@sansur/database';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const { productId, type, from, to } = req.query;

  const where: Record<string, unknown> = {};
  if (type) where.type = type;
  if (productId) {
    where.items = { some: { productId: String(productId) } };
  }
  if (from || to) {
    const range: Record<string, Date> = {};
    if (from) range.gte = new Date(String(from));
    if (to) range.lte = new Date(String(to));
    where.createdAt = range;
  }

  const movements = await prisma.movement.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: {
      items: { include: { product: { select: { sku: true, name: true } } } },
      user: { select: { fullName: true, email: true } },
      supplier: { select: { name: true } },
      sale: { select: { receiptNumber: true } },
    },
  });

  return res.json(movements);
});

// Kardex especifico por producto (US13)
router.get<{ productId: string }>('/product/:productId', async (req, res) => {
  const { productId } = req.params;
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return res.status(404).json({ error: 'Producto no encontrado' });

  const items = await prisma.movementItem.findMany({
    where: { productId },
    orderBy: { movement: { createdAt: 'desc' } },
    include: {
      movement: {
        include: {
          user: { select: { fullName: true } },
          supplier: { select: { name: true } },
          sale: { select: { receiptNumber: true } },
        },
      },
    },
  });

  return res.json({ product, movements: items });
});

export default router;
