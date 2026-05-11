import { Router } from 'express';
import { prisma } from '@sansur/database';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (_req, res) => {
  const suppliers = await prisma.supplier.findMany({
    where: { active: true },
    orderBy: { name: 'asc' },
  });
  return res.json(suppliers);
});

router.post('/', requireRole('ADMIN'), async (req, res) => {
  const { name, ruc, phone, email } = req.body;
  if (!name) return res.status(400).json({ error: 'Nombre requerido' });
  const supplier = await prisma.supplier.create({ data: { name, ruc, phone, email } });
  return res.status(201).json(supplier);
});

export default router;
