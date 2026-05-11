import type { Request, Response, NextFunction } from 'express';
import { Prisma } from '@sansur/database';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  console.error('[API error]', err);

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Registro duplicado (clave unica)' });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Registro no encontrado' });
    }
  }

  const message = err instanceof Error ? err.message : 'Error interno del servidor';
  return res.status(500).json({ error: message });
}
