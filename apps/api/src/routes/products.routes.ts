// US03, US04, US05, US06, US07 — catalogo y consulta de stock
import { Router } from 'express';
import { prisma } from '@sansur/database';
import { productCreateSchema, productUpdateSchema } from '@sansur/shared';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';

const router = Router();

router.use(requireAuth);

// US06/US07 — listar y buscar productos con stock en tiempo real
router.get('/', async (req, res) => {
  const { q, active, lowStock } = req.query;

  const where: Record<string, unknown> = {};
  if (active === 'true') where.active = true;
  if (active === 'false') where.active = false;
  if (q && typeof q === 'string') {
    where.OR = [
      { sku: { contains: q, mode: 'insensitive' } },
      { name: { contains: q, mode: 'insensitive' } },
      { brand: { contains: q, mode: 'insensitive' } },
    ];
  }

  const products = await prisma.product.findMany({
    where,
    orderBy: { name: 'asc' },
  });

  const filtered =
    lowStock === 'true' ? products.filter((p) => p.stock <= p.minStock) : products;

  return res.json(filtered);
});

router.get<{ id: string }>('/:id', async (req, res) => {
  const product = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
  return res.json(product);
});

// US03 — crear (solo admin)
router.post('/', requireRole('ADMIN'), validateBody(productCreateSchema), async (req, res) => {
  const product = await prisma.product.create({ data: req.body });
  return res.status(201).json(product);
});

// US04 — editar (solo admin)
router.put<{ id: string }>(
  '/:id',
  requireRole('ADMIN'),
  validateBody(productUpdateSchema),
  async (req, res) => {
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: req.body,
    });
    return res.json(product);
  }
);

// US05 — soft delete (solo admin)
router.delete<{ id: string }>('/:id', requireRole('ADMIN'), async (req, res) => {
  const product = await prisma.product.update({
    where: { id: req.params.id },
    data: { active: false },
  });
  return res.json(product);
});

export default router;
