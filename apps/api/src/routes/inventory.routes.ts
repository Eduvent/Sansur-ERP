// US08, US09, US10, US17 — movimientos de inventario
import { Router } from 'express';
import { prisma, MovementType } from '@sansur/database';
import {
  stockInSchema,
  saleSchema,
  adjustmentSchema,
  returnSchema,
} from '@sansur/shared';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';

const router = Router();
router.use(requireAuth);

// US08 — ingreso de mercaderia (solo admin)
router.post(
  '/stock-in',
  requireRole('ADMIN'),
  validateBody(stockInSchema),
  async (req, res) => {
    const { supplierId, note, items } = req.body;
    const userId = req.user!.userId;

    const movement = await prisma.$transaction(async (tx) => {
      const products = await tx.product.findMany({
        where: { id: { in: items.map((i: { productId: string }) => i.productId) } },
      });
      if (products.length !== items.length) {
        throw new Error('Uno o mas productos no existen');
      }

      const created = await tx.movement.create({
        data: {
          type: MovementType.ENTRADA,
          supplierId,
          note,
          userId,
          items: {
            create: items.map((i: { productId: string; quantity: number; unitPrice?: number }) => ({
              productId: i.productId,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
            })),
          },
        },
        include: { items: { include: { product: true } }, supplier: true },
      });

      for (const item of items as Array<{ productId: string; quantity: number }>) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }

      return created;
    });

    return res.status(201).json(movement);
  }
);

// US09 — registrar venta
router.post('/sale', validateBody(saleSchema), async (req, res) => {
  const { items } = req.body;
  const userId = req.user!.userId;

  const result = await prisma.$transaction(async (tx) => {
    const products = await tx.product.findMany({
      where: { id: { in: items.map((i: { productId: string }) => i.productId) } },
    });

    let total = 0;
    for (const item of items as Array<{ productId: string; quantity: number; unitPrice?: number }>) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) throw new Error(`Producto ${item.productId} no existe`);
      if (!product.active) throw new Error(`Producto ${product.name} no esta activo`);
      if (product.stock < item.quantity) {
        throw new Error(`Stock insuficiente para ${product.name} (disponible: ${product.stock})`);
      }
      const unit = item.unitPrice ?? Number(product.price);
      total += unit * item.quantity;
    }

    const receiptNumber = `B-${Date.now()}`;
    const sale = await tx.sale.create({
      data: { receiptNumber, total, userId },
    });

    const movement = await tx.movement.create({
      data: {
        type: MovementType.SALIDA,
        userId,
        saleId: sale.id,
        items: {
          create: items.map((i: { productId: string; quantity: number; unitPrice?: number }) => {
            const product = products.find((p) => p.id === i.productId)!;
            return {
              productId: i.productId,
              quantity: i.quantity,
              unitPrice: i.unitPrice ?? product.price,
            };
          }),
        },
      },
      include: { items: { include: { product: true } } },
    });

    for (const item of items as Array<{ productId: string; quantity: number }>) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    return { sale, movement };
  });

  return res.status(201).json(result);
});

// US10 — ajuste de inventario (solo admin)
router.post(
  '/adjustment',
  requireRole('ADMIN'),
  validateBody(adjustmentSchema),
  async (req, res) => {
    const { reason, note, items } = req.body;
    const userId = req.user!.userId;

    const movement = await prisma.$transaction(async (tx) => {
      const created = await tx.movement.create({
        data: {
          type: MovementType.AJUSTE,
          reason,
          note,
          userId,
          items: {
            create: items.map((i: { productId: string; quantity: number }) => ({
              productId: i.productId,
              quantity: Math.abs(i.quantity),
            })),
          },
        },
        include: { items: { include: { product: true } } },
      });

      for (const item of items as Array<{ productId: string; quantity: number }>) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } }, // puede ser negativo
        });
      }

      return created;
    });

    return res.status(201).json(movement);
  }
);

// US17 — devolucion
router.post(
  '/return',
  requireRole('ADMIN'),
  validateBody(returnSchema),
  async (req, res) => {
    const { saleId, note } = req.body;
    const userId = req.user!.userId;

    const result = await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findUnique({
        where: { id: saleId },
        include: { movement: { include: { items: true } } },
      });
      if (!sale) throw new Error('Venta no encontrada');
      if (sale.cancelled) throw new Error('Esta venta ya fue cancelada');
      if (!sale.movement) throw new Error('Venta sin movimiento asociado');

      const movement = await tx.movement.create({
        data: {
          type: MovementType.DEVOLUCION,
          note: note ?? `Devolucion de ${sale.receiptNumber}`,
          userId,
          items: {
            create: sale.movement.items.map((it) => ({
              productId: it.productId,
              quantity: it.quantity,
              unitPrice: it.unitPrice ?? undefined,
            })),
          },
        },
        include: { items: { include: { product: true } } },
      });

      for (const it of sale.movement.items) {
        await tx.product.update({
          where: { id: it.productId },
          data: { stock: { increment: it.quantity } },
        });
      }

      await tx.sale.update({
        where: { id: saleId },
        data: { cancelled: true },
      });

      return movement;
    });

    return res.status(201).json(result);
  }
);

export default router;
