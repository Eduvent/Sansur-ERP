import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  // PORT es la convencion de PaaS (Render, Heroku, Fly). API_PORT es nuestro fallback local.
  PORT: z.coerce.number().optional(),
  API_PORT: z.coerce.number().default(4000),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET debe tener al menos 16 caracteres'),
  JWT_EXPIRES_IN: z.string().default('8h'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  DATABASE_URL: z.string().min(1),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Error en variables de entorno:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

// Render/Heroku setean PORT — si esta presente, gana sobre API_PORT
export const env = {
  ...parsed.data,
  API_PORT: parsed.data.PORT ?? parsed.data.API_PORT,
};
