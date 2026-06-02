import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';

config({ path: '.env.local' });

async function main() {
  console.log('Cleaning up transactional data...\n');

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  const adapter = new PrismaNeon({ connectionString });
  const prisma = new PrismaClient({ adapter });

  // 1. Delete all Order records (items are stored as JSON inside Order)
  const { count: deletedOrders } = await prisma.order.deleteMany();
  console.log(`  Orders deleted: ${deletedOrders}`);

  // 2. Delete all Shift records
  const { count: deletedShifts } = await prisma.shift.deleteMany();
  console.log(`  Shifts deleted: ${deletedShifts}`);

  // 3. Delete all ShiftLog records (table may not exist if migration is pending)
  try {
    const { count: deletedShiftLogs } = await prisma.shiftLog.deleteMany();
    console.log(`  Shift logs deleted: ${deletedShiftLogs}`);
  } catch {
    console.log('  ShiftLog table does not exist yet — skipping.');
  }

  console.log('\nCleanup complete. All transactional data has been wiped.');
  console.log('  - Admin users, staff, products, gift sets, subscribers,');
  console.log('    site settings, and collection images are preserved.');

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('Cleanup failed:', e);
  process.exit(1);
});
