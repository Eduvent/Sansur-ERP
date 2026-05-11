// US01 — autenticacion
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '@sansur/database';
import { loginSchema } from '@sansur/shared';
import { validateBody } from '../middleware/validate.js';
import { env } from '../config/env.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/login', validateBody(loginSchema), async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.active) {
    return res.status(401).json({ error: 'Credenciales invalidas' });
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ error: 'Credenciales invalidas' });
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions
  );

  return res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    },
  });
});

router.get('/me', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { id: true, email: true, fullName: true, role: true },
  });
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  return res.json(user);
});

export default router;
