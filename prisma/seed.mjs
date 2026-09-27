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

  // 1. Users (Admin & Staff)
  const userData = loadJSON('admin-users.json');
  for (const user of userData.users) {
    const existing = await prisma.user.findUnique({ where: { email: user.email } });
    if (!existing) {
      await prisma.user.create({
        data: {
          email: user.email,
          username: user.username,
          password: user.password,
          name: user.username || 'User',
          role: user.role === 'ADMIN' ? 'ADMIN' : 'CASHIER',
          shiftPassword: user.shiftPassword || '123456',
        },
      });
      console.log(`  User added: ${user.email} (${user.role})`);
    } else {
      console.log(`  User exists: ${user.email}`);
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
        isDraft: p.isDraft !== undefined ? p.isDraft : false,
        stock: typeof p.stock === 'number' ? p.stock : 0,
        videoUrl: p.videoUrl || '',
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
        isDraft: p.isDraft !== undefined ? p.isDraft : false,
        stock: typeof p.stock === 'number' ? p.stock : 0,
        videoUrl: p.videoUrl || '',
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
        isDraft: gs.isDraft !== undefined ? gs.isDraft : false,
        stock: typeof gs.stock === 'number' ? gs.stock : 0,
      },
      create: {
        id: gs.id,
        name: gs.name,
        description: gs.description || '',
        price: gs.price,
        image: gs.image || '',
        productIds: gs.productIds || [],
        isDraft: gs.isDraft !== undefined ? gs.isDraft : false,
        stock: typeof gs.stock === 'number' ? gs.stock : 0,
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
      paymentDetails: {
        instapay: { title: 'InstaPay Account', number: '01092748940', note: 'Send the exact order amount to the InstaPay account above, then confirm via WhatsApp.' },
        'vodafone-cash': { title: 'Vodafone Cash Number', number: '01044415982', note: 'Send the exact order amount to the Vodafone Cash number above, then confirm via WhatsApp.' },
      },
      shippingRates: {
        Cairo: 85, Giza: 85, Qaliubiya: 70, Alexandria: 130, Suez: 130,
        Beheira: 140, Ismailia: 140, 'Port Said': 140, Damietta: 140,
        Dakahlia: 140, Gharbiya: 140, 'Kafr Al sheikh': 140, Fayoum: 140,
        'Beni Suef': 140, Menofia: 100, Sharkia: 100, Matrouh: 180,
        Minya: 160, Assiut: 160, Sohag: 160, Qena: 160, Luxor: 160,
        Aswan: 160, 'North Sinai': 200, 'South Sinai': 200, 'Red Sea': 200,
        'New Valley': 200,
      },
      whatsappNumber: '201044415982',
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
      paymentDetails: {
        instapay: { title: 'InstaPay Account', number: '01092748940', note: 'Send the exact order amount to the InstaPay account above, then confirm via WhatsApp.' },
        'vodafone-cash': { title: 'Vodafone Cash Number', number: '01044415982', note: 'Send the exact order amount to the Vodafone Cash number above, then confirm via WhatsApp.' },
      },
      shippingRates: {
        Cairo: 85, Giza: 85, Qaliubiya: 70, Alexandria: 130, Suez: 130,
        Beheira: 140, Ismailia: 140, 'Port Said': 140, Damietta: 140,
        Dakahlia: 140, Gharbiya: 140, 'Kafr Al sheikh': 140, Fayoum: 140,
        'Beni Suef': 140, Menofia: 100, Sharkia: 100, Matrouh: 180,
        Minya: 160, Assiut: 160, Sohag: 160, Qena: 160, Luxor: 160,
        Aswan: 160, 'North Sinai': 200, 'South Sinai': 200, 'Red Sea': 200,
        'New Valley': 200,
      },
      whatsappNumber: '201044415982',
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
          source: o.source || 'WEB',
        },
      });
      console.log(`  Order: ${o.orderId}`);
    } else {
      console.log(`  Order exists: ${o.orderId}`);
    }
  }

  // 8. Coupons
  const coupons = [
    { code: 'WELCOME10', discountPct: 10, maxUses: 100, active: true },
    { code: 'SAVE20', discountPct: 20, maxUses: 50, active: true },
  ];
  for (const c of coupons) {
    await prisma.coupon.upsert({
      where: { code: c.code },
      update: { discountPct: c.discountPct, maxUses: c.maxUses, active: c.active },
      create: { code: c.code, discountPct: c.discountPct, maxUses: c.maxUses, active: c.active },
    });
    console.log(`  Coupon: ${c.code} (${c.discountPct}% off)`);
  }

  console.log('\nDatabase seeded successfully!');
  console.log('  Admin: admin@cityfragrance.com / Admin@123');

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('Seed failed:', e);
  process.exit(1);
});
