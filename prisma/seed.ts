import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEMO_PASSWORD = 'demo123';

/**
 * Assets servidos de public/. As imagens ilustram o produto descrito e os STLs
 * reproduzem suas dimensões — veja src/scripts/generate-sample-stls.ts.
 */
type ProductSeed = {
  slug: string;
  title: string;
  description: string;
  category: string;
  material: string;
  price: number;
  width: number;
  height: number;
  depth: number;
  weight: number;
  print_time: number;
  makerIndex: number;
  rating: number;
  withStl?: boolean;
};

const PRODUCTS: ProductSeed[] = [
  { slug: 'vaso-geometrico', title: 'Vaso Geométrico', description: 'Vaso decorativo com padrão geométrico.', category: 'decorative', material: 'PLA', price: 45, width: 12, height: 18, depth: 12, weight: 0.2, print_time: 4, makerIndex: 0, rating: 4.5, withStl: true },
  { slug: 'escultura-abstrata', title: 'Escultura Abstrata', description: 'Peça artística para estante.', category: 'decorative', material: 'PLA', price: 89, width: 15, height: 25, depth: 10, weight: 0.35, print_time: 8, makerIndex: 0, rating: 4.8, withStl: true },
  { slug: 'luminaria-hexagonal', title: 'Luminária Hexagonal', description: 'Abajur modular hexagonal.', category: 'decorative', material: 'PETG', price: 120, width: 20, height: 22, depth: 20, weight: 0.5, print_time: 10, makerIndex: 1, rating: 4.2 },
  { slug: 'porta-retrato-3d', title: 'Porta-retrato 3D', description: 'Moldura decorativa para fotos 10x15.', category: 'decorative', material: 'PLA', price: 35, width: 18, height: 22, depth: 3, weight: 0.15, print_time: 3, makerIndex: 1, rating: 4.0 },
  { slug: 'organizador-de-mesa', title: 'Organizador de Mesa', description: 'Organizador com compartimentos para canetas.', category: 'functional', material: 'ABS', price: 55, width: 20, height: 8, depth: 15, weight: 0.25, print_time: 5, makerIndex: 2, rating: 4.6, withStl: true },
  { slug: 'suporte-de-headphone', title: 'Suporte de Headphone', description: 'Suporte ergonômico para fone de ouvido.', category: 'functional', material: 'ABS', price: 42, width: 12, height: 25, depth: 15, weight: 0.3, print_time: 4, makerIndex: 2, rating: 4.7 },
  { slug: 'clip-de-cabo-usb', title: 'Clip de Cabo USB', description: 'Organizador de cabos para mesa.', category: 'functional', material: 'TPU', price: 18, width: 5, height: 3, depth: 8, weight: 0.05, print_time: 1, makerIndex: 3, rating: 4.3 },
  { slug: 'engrenagem-educacional', title: 'Engrenagem Educacional', description: 'Kit de engrenagens para demonstração.', category: 'educational', material: 'PLA', price: 65, width: 15, height: 5, depth: 15, weight: 0.2, print_time: 6, makerIndex: 3, rating: 4.9, withStl: true },
  { slug: 'modelo-anatomico', title: 'Modelo Anatômico', description: 'Modelo simplificado de osso do braço.', category: 'educational', material: 'PLA', price: 95, width: 8, height: 30, depth: 8, weight: 0.18, print_time: 7, makerIndex: 0, rating: 4.4 },
  { slug: 'action-figure-base', title: 'Action Figure Base', description: 'Base articulada para action figures.', category: 'figure', material: 'ABS', price: 75, width: 10, height: 20, depth: 10, weight: 0.22, print_time: 6, makerIndex: 1, rating: 4.1 },
  { slug: 'miniatura-dragao', title: 'Miniatura Dragão', description: 'Miniatura detalhada para RPG.', category: 'figure', material: 'Resina', price: 150, width: 8, height: 12, depth: 8, weight: 0.1, print_time: 12, makerIndex: 2, rating: 4.9, withStl: true },
  { slug: 'prototipo-caixa-enclosure', title: 'Protótipo Caixa Enclosure', description: 'Case para projeto eletrônico Arduino.', category: 'prototype', material: 'ABS', price: 38, width: 12, height: 6, depth: 8, weight: 0.12, print_time: 3, makerIndex: 3, rating: 4.0 },
  { slug: 'capa-prototipo-smartphone', title: 'Capa Protótipo Smartphone', description: 'Case customizado para desenvolvimento.', category: 'prototype', material: 'TPU', price: 28, width: 8, height: 16, depth: 1, weight: 0.08, print_time: 2, makerIndex: 0, rating: 3.8 },
  { slug: 'vaso-suculenta', title: 'Vaso Suculenta', description: 'Vaso minimalista para suculentas.', category: 'decorative', material: 'PLA', price: 32, width: 10, height: 8, depth: 10, weight: 0.12, print_time: 2, makerIndex: 1, rating: 4.5 },
  { slug: 'suporte-tablet', title: 'Suporte Tablet', description: 'Suporte ajustável para tablet.', category: 'functional', material: 'ABS', price: 48, width: 18, height: 15, depth: 12, weight: 0.28, print_time: 5, makerIndex: 2, rating: 4.6 },
  { slug: 'quebra-cabeca-3d', title: 'Quebra-cabeça 3D', description: 'Puzzle mecânico para crianças.', category: 'educational', material: 'PLA', price: 58, width: 12, height: 12, depth: 12, weight: 0.2, print_time: 6, makerIndex: 3, rating: 4.7, withStl: true },
  { slug: 'estatua-gato', title: 'Estátua Gato', description: 'Estátua decorativa de gato.', category: 'decorative', material: 'PLA', price: 52, width: 8, height: 15, depth: 8, weight: 0.15, print_time: 4, makerIndex: 0, rating: 4.3 },
  { slug: 'suporte-de-monitor', title: 'Suporte de Monitor', description: 'Elevador para monitor com gaveta.', category: 'functional', material: 'PETG', price: 85, width: 40, height: 10, depth: 25, weight: 0.8, print_time: 12, makerIndex: 1, rating: 4.8 },
  { slug: 'peca-reposicao-impressora', title: 'Peça de Reposição Impressora', description: 'Extruder cover para Ender 3.', category: 'part', material: 'ABS', price: 22, width: 6, height: 4, depth: 6, weight: 0.05, print_time: 1, makerIndex: 2, rating: 4.2 },
  { slug: 'miniatura-robo', title: 'Miniatura Robô', description: 'Robô articulado para coleção.', category: 'figure', material: 'PLA', price: 68, width: 8, height: 14, depth: 6, weight: 0.14, print_time: 5, makerIndex: 3, rating: 4.5, withStl: true },
];

async function main() {
  console.log('🌱 Seeding database...');

  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.review.deleteMany();
  await prisma.stl_file.deleteMany();
  await prisma.image.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const makers = await Promise.all([
    prisma.user.create({ data: { name: 'Maker Alpha', email: 'maker1@demo.com', password: passwordHash, avatar_url: '/avatars/maker-alpha.jpg' } }),
    prisma.user.create({ data: { name: 'Maker Beta', email: 'maker2@demo.com', password: passwordHash, avatar_url: '/avatars/maker-beta.jpg' } }),
    prisma.user.create({ data: { name: 'Maker Gamma', email: 'maker3@demo.com', password: passwordHash, avatar_url: '/avatars/maker-gamma.jpg' } }),
    prisma.user.create({ data: { name: 'Maker Delta', email: 'maker4@demo.com', password: passwordHash, avatar_url: '/avatars/maker-delta.jpg' } }),
  ]);

  const maria = await prisma.user.create({
    data: { name: 'Maria Silva', email: 'maria@demo.com', password: passwordHash, avatar_url: '/avatars/maria-silva.jpg' },
  });

  const joao = await prisma.user.create({
    data: { name: 'João Santos', email: 'joao@demo.com', password: passwordHash, avatar_url: '/avatars/joao-santos.jpg' },
  });

  const createdProducts: { id: number }[] = [];

  for (let i = 0; i < PRODUCTS.length; i++) {
    const p = PRODUCTS[i];
    const maker = makers[p.makerIndex];

    const product = await prisma.product.create({
      data: {
        title: p.title,
        description: p.description,
        category: p.category,
        material: p.material,
        price: p.price,
        width: p.width,
        height: p.height,
        depth: p.depth,
        weight: p.weight,
        print_time: p.print_time,
        user_id: maker.id,
        images: {
          create: [{ url: `/products/${p.slug}.jpg` }],
        },
        reviews: {
          create: [{ rating: Math.round(p.rating) }],
        },
        ...(p.withStl
          ? {
              stl_file: {
                create: {
                  url: `/models/${p.slug}.stl`,
                  filename: `${p.slug}.stl`,
                },
              },
            }
          : {}),
      },
    });

    createdProducts.push(product);
  }

  // Maria comprou itens decorativos PLA (ids 0,1,3,13,16)
  const mariaProductIds = [0, 1, 3, 13, 16].map((i) => createdProducts[i].id);
  const mariaOrder = await prisma.order.create({
    data: {
      user_id: maria.id,
      order_number: 'ORD-MARIA-001',
      status: 'completed',
      items: {
        create: mariaProductIds.map((product_id) => ({ product_id, quantity: 1 })),
      },
    },
  });

  // João comprou itens funcionais/educacionais ABS/TPU (ids 4,5,6,7,14)
  const joaoProductIds = [4, 5, 6, 7, 14].map((i) => createdProducts[i].id);
  const joaoOrder = await prisma.order.create({
    data: {
      user_id: joao.id,
      order_number: 'ORD-JOAO-001',
      status: 'completed',
      items: {
        create: joaoProductIds.map((product_id) => ({ product_id, quantity: 1 })),
      },
    },
  });

  console.log(`✅ Seed complete:`);
  console.log(`   ${makers.length} makers + 2 demo buyers`);
  console.log(`   ${createdProducts.length} products`);
  console.log(`   Orders: ${mariaOrder.order_number}, ${joaoOrder.order_number}`);
  console.log('');
  console.log('🔑 Demo logins (senha: demo123):');
  console.log('   maria@demo.com  → recomendações decorativas/PLA');
  console.log('   joao@demo.com   → recomendações funcionais/ABS');
  console.log('   maker1@demo.com → perfil maker (sem histórico de compra)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
