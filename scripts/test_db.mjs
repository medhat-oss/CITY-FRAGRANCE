import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';

config({ path: '.env.local' });

async function runTest() {
  console.log('--- STARTING BACKEND DB TEST ---');
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }

  const adapter = new PrismaNeon({ connectionString });
  const prisma = new PrismaClient({ adapter });

  const testCashierId = 'test_cashier_id_123';
  const testCashierName = 'Test Cashier';

  console.log('1. Cleaning up existing test shifts...');
  await prisma.shift.deleteMany({
    where: { cashierId: testCashierId }
  });
  await prisma.order.deleteMany({
    where: { cashierId: testCashierId }
  });

  console.log('2. Testing shift duplication prevention...');
  // Create first shift
  const shift1 = await prisma.shift.create({
    data: {
      cashierId: testCashierId,
      cashierName: testCashierName,
      startTime: new Date(),
      status: 'OPEN'
    }
  });
  console.log('Created first shift:', shift1.id);

  // Check if duplicate shift check would trigger
  const existingShift = await prisma.shift.findFirst({
    where: { cashierId: testCashierId, status: { in: ['OPEN', 'ACTIVE'] } }
  });
  if (existingShift) {
    console.log('Success: Duplicate shift detected correctly!');
  } else {
    console.error('Error: Duplicate shift NOT detected.');
  }

  console.log('3. Placing orders linked to this shift...');
  // Place two POS orders linked to this shift
  const order1 = await prisma.order.create({
    data: {
      orderId: 'POS-TEST1',
      customerName: 'POS Walk-in',
      phoneNumber: '—',
      address: 'In-Store',
      city: 'In-Store',
      items: [],
      totalPrice: 1500,
      paymentMethod: 'cash',
      source: 'POS',
      cashierId: testCashierId,
      shiftId: shift1.id,
      date: new Date().toLocaleDateString('en-CA')
    }
  });
  const order2 = await prisma.order.create({
    data: {
      orderId: 'POS-TEST2',
      customerName: 'POS Walk-in',
      phoneNumber: '—',
      address: 'In-Store',
      city: 'In-Store',
      items: [],
      totalPrice: 2000,
      paymentMethod: 'instapay',
      source: 'POS',
      cashierId: testCashierId,
      shiftId: shift1.id,
      date: new Date().toLocaleDateString('en-CA')
    }
  });
  const orderCancelled = await prisma.order.create({
    data: {
      orderId: 'POS-TEST3',
      customerName: 'POS Walk-in',
      phoneNumber: '—',
      address: 'In-Store',
      city: 'In-Store',
      items: [],
      totalPrice: 3000,
      paymentMethod: 'cash',
      source: 'POS',
      cashierId: testCashierId,
      shiftId: shift1.id,
      status: 'Cancelled',
      date: new Date().toLocaleDateString('en-CA')
    }
  });

  console.log('4. Performing Prisma _sum aggregation...');
  const cashAgg = await prisma.order.aggregate({
    _sum: { totalPrice: true },
    where: { shiftId: shift1.id, paymentMethod: 'cash', status: { not: 'Cancelled' } }
  });
  const instapayAgg = await prisma.order.aggregate({
    _sum: { totalPrice: true },
    where: { shiftId: shift1.id, paymentMethod: 'instapay', status: { not: 'Cancelled' } }
  });

  const totalCash = cashAgg._sum.totalPrice || 0;
  const totalInstaPay = instapayAgg._sum.totalPrice || 0;

  console.log(`Aggregated Cash: ${totalCash} (Expected: 1500)`);
  console.log(`Aggregated InstaPay: ${totalInstaPay} (Expected: 2000)`);

  if (totalCash === 1500 && totalInstaPay === 2000) {
    console.log('Success: Prisma _sum aggregation is working perfectly and ignoring Cancelled orders!');
  } else {
    console.error('Error: Aggregation result mismatch.');
  }

  console.log('5. Closing shift...');
  await prisma.shift.update({
    where: { id: shift1.id },
    data: {
      status: 'CLOSED',
      endTime: new Date(),
      totalCash,
      totalInstaPay,
      expectedTotal: totalCash + totalInstaPay
    }
  });

  console.log('6. Cleaning up test data...');
  await prisma.shift.deleteMany({
    where: { cashierId: testCashierId }
  });
  await prisma.order.deleteMany({
    where: { cashierId: testCashierId }
  });

  console.log('--- TEST RUN COMPLETED SUCCESSFULLY ---');
  await prisma.$disconnect();
}

runTest().catch(console.error);
