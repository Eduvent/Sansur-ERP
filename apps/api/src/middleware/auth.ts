import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import type { Role } from '@sansur/database';

export type JwtPayload = {
  userId: string;
  email: string;
  role: Role;
};

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

// TS03 — verificacion JWT de todas las rutas protegidas
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Token invalido o expirado' });
  }
}

// US02 — control de roles
export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'No autenticado' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Permisos insuficientes para esta operacion' });
    }
    next();
  };
}
