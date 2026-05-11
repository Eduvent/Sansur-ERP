import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import authRoutes from './routes/auth.routes.js';
import productsRoutes from './routes/products.routes.js';
import inventoryRoutes from './routes/inventory.routes.js';
import kardexRoutes from './routes/kardex.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import suppliersRoutes from './routes/suppliers.routes.js';
import chatRoutes from './routes/chat.routes.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  // CORS — acepta una lista de origenes separados por coma.
  // Soporta wildcards: "https://*.vercel.app" matchea cualquier subdominio.
  // Permite curl/postman (sin origen).
  const allowed = env.CORS_ORIGIN.split(',').map((s) => s.trim()).filter(Boolean);

  function isOriginAllowed(origin: string): boolean {
    return allowed.some((pattern) => {
      if (pattern.includes('*')) {
        const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\\\*/g, '.*');
        return new RegExp(`^${escaped}$`).test(origin);
      }
      return pattern === origin;
    });
  }

  app.use(helmet());
  app.use(
    cors({
      origin: (origin, cb) => {
        if (!origin) return cb(null, true);
        if (isOriginAllowed(origin)) return cb(null, true);
        return cb(new Error(`CORS: origen ${origin} no permitido`));
      },
      credentials: true,
    })
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'sansur-api' }));

  app.use('/api/auth', authRoutes);
  app.use('/api/products', productsRoutes);
  app.use('/api/inventory', inventoryRoutes);
  app.use('/api/kardex', kardexRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/suppliers', suppliersRoutes);
  app.use('/api/chat', chatRoutes);

  app.use(errorHandler);

  return app;
}
