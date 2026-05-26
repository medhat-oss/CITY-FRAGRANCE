import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

config({ path: '.env.local' });

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadJSON(filename) {
  const filePath = path.resolve(__dirname, '..', 'data', filename);
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

async function main() {
  console.log('Seeding database...\n');

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  const adapter = new PrismaNeon({ connectionString });
  const prisma = new PrismaClient({ adapter });

  // 1. Admin User
  const adminData = loadJSON('admin-users.json');
  for (const user of adminData.users) {
    const existing = await prisma.adminUser.findUnique({ where: { email: user.email } });
    if (!existing) {
      await prisma.adminUser.create({
        data: {
          email: user.email,
          password: user.password,
          name: user.username || 'Admin',
          role: user.role || 'ADMIN',
        },
      });
      console.log(`  Admin user: ${user.email}`);
    } else {
      console.log(`  Admin user exists: ${user.email}`);
    }
  }

  // 2. Products
  const products = loadJSON('products.json');
  for (const p of products) {
    await prisma.product.upsert({
      where: { id: p.id },
      update: {
        name: p.name,
        type: p.type || p.category || '',
        category: p.category || '',
        collection: p.collection || '',
        badge: p.badge || '',
        notes: p.notes || '',
        description: p.description || '',
        orientation: p.orientation || '',
        concentration: p.concentration || '',
        volume: p.volume || '',
        price: p.price,
        salePrice: p.salePrice || null,
        images: p.images || [],
      },
      create: {
        id: p.id,
        name: p.name,
        type: p.type || p.category || '',
        category: p.category || '',
        collection: p.collection || '',
        badge: p.badge || '',
        notes: p.notes || '',
        description: p.description || '',
        orientation: p.orientation || '',
        concentration: p.concentration || '',
        volume: p.volume || '',
        price: p.price,
        salePrice: p.salePrice || null,
        images: p.images || [],
      },
    });
    console.log(`  Product: ${p.name}`);
  }

  // 3. Gift Sets
  const giftSets = loadJSON('gift-sets.json');
  for (const gs of giftSets) {
    await prisma.giftSet.upsert({
      where: { id: gs.id },
      update: {
        name: gs.name,
        description: gs.description || '',
        price: gs.price,
        image: gs.image || '',
        productIds: gs.productIds || [],
      },
      create: {
        id: gs.id,
        name: gs.name,
        description: gs.description || '',
        price: gs.price,
        image: gs.image || '',
        productIds: gs.productIds || [],
      },
    });
    console.log(`  Gift Set: ${gs.name}`);
  }

  // 4. Subscribers
  const subscribers = loadJSON('subscribers.json');
  for (const sub of subscribers) {
    const existing = await prisma.subscriber.findUnique({ where: { email: sub.email } });
    if (!existing) {
      await prisma.subscriber.create({ data: { email: sub.email } });
      console.log(`  Subscriber: ${sub.email}`);
    }
  }

  // 5. Site Settings
  const settings = loadJSON('site-settings.json');
  await prisma.siteSetting.upsert({
    where: { id: 'default' },
    update: {
      heroTitle: settings.heroTitle || '',
      heroSubtitle: settings.heroSubtitle || '',
      announcementText: settings.announcementText || '',
      heroBgImage: settings.heroBgImage || '',
      moodTitle: settings.moodTitle || '',
      moodSubtitle: settings.moodSubtitle || '',
      moodImage: settings.moodImage || '',
    },
    create: {
      id: 'default',
      heroTitle: settings.heroTitle || '',
      heroSubtitle: settings.heroSubtitle || '',
      announcementText: settings.announcementText || '',
      heroBgImage: settings.heroBgImage || '',
      moodTitle: settings.moodTitle || '',
      moodSubtitle: settings.moodSubtitle || '',
      moodImage: settings.moodImage || '',
    },
  });
  console.log('  Site Settings');

  // 6. Collection Images
  const collectionImages = loadJSON('collection-images.json');
  for (const [slug, image] of Object.entries(collectionImages)) {
    await prisma.collectionImage.upsert({
      where: { slug },
      update: { image: String(image) },
      create: { slug, image: String(image) },
    });
    console.log(`  Collection Image: ${slug}`);
  }

  // 7. Legacy Orders (migrate from JSON to DB)
  const orders = loadJSON('orders.json');
  for (const o of orders) {
    const existing = await prisma.order.findUnique({ where: { orderId: o.orderId } });
    if (!existing) {
      await prisma.order.create({
        data: {
          orderId: o.orderId,
          customerName: o.customerName,
          phoneNumber: o.phoneNumber,
          email: o.email || '',
          address: o.address,
          apartment: o.apartment || '',
          city: o.city,
          governorate: o.governorate || '',
          items: o.items || [],
          totalPrice: o.totalPrice,
          status: o.status || 'Pending',
          date: o.date || new Date().toLocaleDateString('en-CA'),
          paymentMethod: o.paymentMethod || null,
        },
      });
      console.log(`  Order: ${o.orderId}`);
    } else {
      console.log(`  Order exists: ${o.orderId}`);
    }
  }

  console.log('\nDatabase seeded successfully!');
  console.log('  Admin: admin@cityfragrance.com / Admin@123');

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('Seed failed:', e);
  process.exit(1);
});
