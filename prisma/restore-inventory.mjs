// Idempotent production inventory restore:
//  1. Every PUBLISHED product with stock 0 gets stock bumped to 50.
//  2. Every gift set is published (isDraft=false) and any with stock 0 gets stock 50.
// Safe to re-run: only touches stock-0 published items and draft gift sets.

import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';

config({ path: '.env.local' });

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  const adapter = new PrismaNeon({ connectionString });
  const prisma = new PrismaClient({ adapter });

  const prod = await prisma.product.updateMany({
    where: { isDraft: false, stock: 0 },
    data: { stock: 50 },
  });
  console.log(`Products restored (published, stock 0 -> 50): ${prod.count}`);

  const gs = await prisma.giftSet.updateMany({
    where: { stock: 0 },
    data: { stock: 50 },
  });
  console.log(`Gift sets stock restored (0 -> 50): ${gs.count}`);

  const gsPub = await prisma.giftSet.updateMany({
    where: { isDraft: true },
    data: { isDraft: false },
  });
  console.log(`Gift sets published (isDraft -> false): ${gsPub.count}`);

  const live = await prisma.product.count({ where: { isDraft: false } });
  const zero = await prisma.product.count({ where: { isDraft: false, stock: 0 } });
  const gsLive = await prisma.giftSet.count({ where: { isDraft: false } });
  console.log(`\nPost-restore: published products=${live}, published with stock 0=${zero}, published gift sets=${gsLive}`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('Restore failed:', e);
  process.exit(1);
});
