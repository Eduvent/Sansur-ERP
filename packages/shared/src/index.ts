import { z } from 'zod';

// === Auth ===
export const loginSchema = z.object({
  email: z.string().email('Email invalido'),
  password: z.string().min(6, 'Minimo 6 caracteres'),
});
export type LoginInput = z.infer<typeof loginSchema>;

// === Productos (US03/US04) ===
export const productCreateSchema = z.object({
  sku: z.string().min(1, 'SKU requerido').max(50),
  name: z.string().min(1, 'Nombre requerido'),
  brand: z.string().min(1, 'Marca requerida'),
  description: z.string().optional(),
  category: z.string().optional(),
  power: z.coerce.number().int().nonnegative().optional(),
  price: z.coerce.number().nonnegative('Precio invalido'),
  minStock: z.coerce.number().int().nonnegative().default(5),
});
export type ProductCreateInput = z.infer<typeof productCreateSchema>;

export const productUpdateSchema = productCreateSchema.partial().extend({
  active: z.boolean().optional(),
});
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;

// === Movimientos de inventario ===
export const movementItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().positive('Cantidad debe ser positiva'),
  unitPrice: z.coerce.number().nonnegative().optional(),
});

// US08 — ingreso de mercaderia
export const stockInSchema = z.object({
  supplierId: z.string().optional(),
  note: z.string().optional(),
  items: z.array(movementItemSchema).min(1, 'Debe incluir al menos un producto'),
});
export type StockInInput = z.infer<typeof stockInSchema>;

// US09 — registrar venta
export const saleSchema = z.object({
  items: z.array(movementItemSchema).min(1, 'Debe incluir al menos un producto'),
});
export type SaleInput = z.infer<typeof saleSchema>;

// US10 — ajuste de inventario
export const adjustmentSchema = z.object({
  reason: z.enum(['DANIO', 'ROBO', 'ERROR_PREVIO', 'CONTEO_FISICO', 'OTRO']),
  note: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.string(),
        quantity: z.coerce.number().int(), // puede ser positivo o negativo
      })
    )
    .min(1),
});
export type AdjustmentInput = z.infer<typeof adjustmentSchema>;

// US17 — devolucion
export const returnSchema = z.object({
  saleId: z.string().min(1, 'Numero de venta requerido'),
  note: z.string().optional(),
});
export type ReturnInput = z.infer<typeof returnSchema>;

// === Respuestas API ===
export type ApiError = {
  error: string;
  details?: Record<string, string[]>;
};

export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  role: 'ADMIN' | 'VENDEDOR';
};

export type AuthResponse = {
  token: string;
  user: AuthUser;
};
