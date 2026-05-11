import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Sembrando datos iniciales de SANSUR...');

  const adminPassword = await bcrypt.hash('admin123', 10);
  const vendedorPassword = await bcrypt.hash('vendedor123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@sansur.pe' },
    update: {},
    create: {
      email: 'admin@sansur.pe',
      passwordHash: adminPassword,
      fullName: 'Administrador SANSUR',
      role: Role.ADMIN,
    },
  });

  const vendedor = await prisma.user.upsert({
    where: { email: 'vendedor@sansur.pe' },
    update: {},
    create: {
      email: 'vendedor@sansur.pe',
      passwordHash: vendedorPassword,
      fullName: 'Vendedor de Tienda',
      role: Role.VENDEDOR,
    },
  });

  console.log('Usuarios creados:', { admin: admin.email, vendedor: vendedor.email });

  const supplier1 = await prisma.supplier.upsert({
    where: { ruc: '20512345678' },
    update: {},
    create: {
      name: 'Importaciones Miray S.A.C.',
      ruc: '20512345678',
      phone: '+51 987654321',
      email: 'ventas@miray.pe',
    },
  });

  const supplier2 = await prisma.supplier.upsert({
    where: { ruc: '20598765432' },
    update: {},
    create: {
      name: 'Electrodomesticos Oster Peru',
      ruc: '20598765432',
      phone: '+51 999888777',
      email: 'b2b@oster.pe',
    },
  });

  const products = [
    {
      sku: 'VEN-MIR-001',
      name: 'Ventilador de pie Miray VP-20',
      brand: 'Miray',
      category: 'pie',
      power: 55,
      price: 89.9,
      stock: 25,
      minStock: 5,
      description: 'Ventilador de pie 20 pulgadas 3 velocidades',
    },
    {
      sku: 'VEN-MIR-002',
      name: 'Ventilador de mesa Miray VM-12',
      brand: 'Miray',
      category: 'mesa',
      power: 35,
      price: 49.9,
      stock: 40,
      minStock: 10,
      description: 'Ventilador de mesa 12 pulgadas portatil',
    },
    {
      sku: 'VEN-OST-001',
      name: 'Ventilador de techo Oster OT-52',
      brand: 'Oster',
      category: 'techo',
      power: 60,
      price: 189.0,
      stock: 8,
      minStock: 5,
      description: 'Ventilador de techo 52 pulgadas con luz LED',
    },
    {
      sku: 'VEN-OST-002',
      name: 'Ventilador de pared Oster OP-16',
      brand: 'Oster',
      category: 'pared',
      power: 50,
      price: 129.9,
      stock: 3,
      minStock: 5,
      description: 'Ventilador de pared 16 pulgadas con control remoto',
    },
    {
      sku: 'VEN-IMA-001',
      name: 'Ventilador torre Imaco IT-90',
      brand: 'Imaco',
      category: 'torre',
      power: 45,
      price: 159.0,
      stock: 12,
      minStock: 4,
      description: 'Ventilador torre silencioso 90cm',
    },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: p,
    });
  }

  console.log(`${products.length} productos creados`);
  console.log('Seed completado.');
  console.log('\nCredenciales:');
  console.log('  Admin    -> admin@sansur.pe / admin123');
  console.log('  Vendedor -> vendedor@sansur.pe / vendedor123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
