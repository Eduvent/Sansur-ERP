# SANSUR ERP

Sistema ERP para **SANSUR**, empresa peruana dedicada al comercio de ventiladores. Monorepo con backend, frontend y un placeholder para el módulo de IA por Telegram.

## Arquitectura del monorepo

```
sansur-erp/
├── apps/
│   ├── api/            # Backend Express + TypeScript + Prisma
│   ├── web/            # Frontend Next.js 14 + Tailwind
│   └── telegram-bot/   # Modulo IA (NL queries via Telegram) — placeholder
├── packages/
│   ├── database/       # Schema Prisma + cliente compartido
│   └── shared/         # Tipos y esquemas Zod compartidos
├── docker-compose.yml  # Postgres local
└── package.json        # npm workspaces
```

## Funcionalidades del MVP (Sprints 1–2)

| HU      | Descripción                                | Estado |
|---------|--------------------------------------------|--------|
| US01    | Autenticación con JWT                      | ✅     |
| US02    | Roles Admin / Vendedor                     | ✅     |
| US03    | Registrar nuevo ventilador                 | ✅     |
| US04    | Editar datos del ventilador                | ✅     |
| US05    | Deshabilitar producto (soft delete)        | ✅     |
| US06    | Búsqueda de producto                       | ✅     |
| US07    | Consultar stock en tiempo real             | ✅     |
| US08    | Registrar ingreso de mercadería            | ✅     |
| US09    | Registrar venta                            | ✅     |
| US10    | Ajuste de inventario (mermas)              | ✅     |
| US11    | Dashboard con indicadores diarios          | ✅     |
| US12    | Alerta visual de stock mínimo              | ✅     |
| US13    | Kárdex (historial de movimientos)          | ✅     |
| US17    | Registrar devolución                       | ✅     |
| US18    | Búsqueda inteligente con IA (Telegram)     | 🔜 Sprint siguiente |

## Stack tecnológico

- **Backend**: Node.js, Express 4, TypeScript, Prisma ORM
- **Frontend**: Next.js 14 (App Router), React 18, Tailwind CSS
- **Base de datos**: PostgreSQL 16
- **Auth**: JWT con bcrypt
- **Validación**: Zod (compartido entre web y api)
- **Monorepo**: npm workspaces

## Setup

### Pre-requisitos
- Node.js 20+
- Docker (para Postgres)

### Instalación

```bash
# 1. Instalar dependencias del workspace
npm install

# 2. Levantar Postgres
docker compose up -d

# 3. Copiar variables de entorno
cp .env.example .env
cp apps/web/.env.local.example apps/web/.env.local

# 4. Generar cliente de Prisma y aplicar migraciones
npm run db:generate
npm run db:migrate

# 5. Sembrar datos iniciales (usuarios + productos demo)
npm run db:seed
```

### Levantar el sistema

```bash
# API + Web en paralelo
npm run dev

# O por separado:
npm run dev:api    # http://localhost:4000
npm run dev:web    # http://localhost:3000
npm run dev:bot    # (placeholder del modulo IA)
```

### Credenciales demo
- **Admin**: `admin@sansur.pe` / `admin123`
- **Vendedor**: `vendedor@sansur.pe` / `vendedor123`

## Endpoints de la API

| Método | Ruta                              | Auth | Descripción                  |
|--------|-----------------------------------|------|------------------------------|
| POST   | `/api/auth/login`                 | —    | Login con email y password   |
| GET    | `/api/auth/me`                    | ✅   | Datos del usuario actual     |
| GET    | `/api/products`                   | ✅   | Listar/buscar productos      |
| POST   | `/api/products`                   | Admin| Crear producto               |
| PUT    | `/api/products/:id`               | Admin| Editar producto              |
| DELETE | `/api/products/:id`               | Admin| Soft delete                  |
| POST   | `/api/inventory/stock-in`         | Admin| Registrar ingreso (US08)     |
| POST   | `/api/inventory/sale`             | ✅   | Registrar venta (US09)       |
| POST   | `/api/inventory/adjustment`       | Admin| Ajuste de stock (US10)       |
| POST   | `/api/inventory/return`           | Admin| Devolución (US17)            |
| GET    | `/api/kardex`                     | ✅   | Historial de movimientos     |
| GET    | `/api/kardex/product/:id`         | ✅   | Kárdex de un producto        |
| GET    | `/api/dashboard/summary`          | ✅   | Métricas del día             |
| GET    | `/api/suppliers`                  | ✅   | Listar proveedores           |
| POST   | `/api/suppliers`                  | Admin| Crear proveedor              |

## Módulo IA por Telegram (siguiente fase)

El paquete `apps/telegram-bot` es un placeholder para el módulo de IA descrito en US18 + extensión del proyecto. Permitirá consultar la base de datos en **lenguaje natural** desde Telegram:

- *"Cuantos ventiladores Miray me quedan?"*
- *"Cual fue el monto de ventas de hoy?"*
- *"Que productos estan en stock minimo?"*

**Arquitectura prevista**: el LLM hará *function calling* sobre un conjunto de herramientas tipadas (consultas Prisma predefinidas), nunca SQL crudo, para evitar inyección y respetar permisos por rol. El bot mapeará `chat_id → usuario del ERP` para que cada consulta respete el RBAC ya existente en la API.

## Notas de arquitectura

- **Monolito modular**: backend dividido por dominios (auth, products, inventory, kardex, dashboard, suppliers). Permite migrar a microservicios cuando el negocio lo amerite, sin refactor radical.
- **Transacciones**: cada movimiento de inventario (`stock-in`, `sale`, `adjustment`, `return`) usa `prisma.$transaction` para garantizar atomicidad entre la creación del movimiento y el ajuste del stock.
- **Kárdex inmutable**: las cabeceras de `Movement` y sus `MovementItem` nunca se editan ni borran. Las devoluciones generan un nuevo movimiento, no modifican la venta original.
- **Soft delete** en productos: respeta integridad referencial del histórico (cumple US05).
- **JWT con roles** en payload: middleware de autorización en cada ruta (cumple TS03 y OBJ-04).
