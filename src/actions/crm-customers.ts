import prisma from '@/lib/prisma';

export interface CreateCustomerInput {
  name: string;
  phone: string;
  email?: string;
  city?: string;
  customerSegment?: string;
  lifetimeValue?: number;
  totalOrders?: number;
  notes?: string;
}

export const CUSTOMER_SEGMENTS = [
  'Regular',
  'VIP',
  'Wholesale',
  'Corporate',
] as const;

export type CustomerSegment = (typeof CUSTOMER_SEGMENTS)[number];

/**
 * Fetch all customers ordered by creation date descending.
 * Aggregates linked orders to ensure live lifetimeValue and totalOrders are completely accurate.
 */
export async function getCustomers() {
  const customers = await prisma.crmCustomer.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      orders: {
        select: {
          id: true,
          totalPrice: true,
          createdAt: true,
        },
      },
      _count: {
        select: {
          leads: true,
          deals: true,
          orders: true,
        },
      },
    },
  });

  // Calculate live LTV and order count if customer has linked orders
  return customers.map((c: any) => {
    const ordersCount = c.orders?.length || 0;
    const computedOrders = Math.max(c.totalOrders || 0, ordersCount);
    const orderSum = c.orders?.reduce((sum: number, o: any) => sum + (o.totalPrice || 0), 0) || 0;
    const computedLTV = orderSum > 0 ? orderSum : (c.lifetimeValue || 0);

    return {
      id: c.id,
      name: c.name,
      phone: c.phone,
      email: c.email,
      city: c.city,
      customerSegment: c.customerSegment || 'Regular',
      lifetimeValue: computedLTV,
      totalOrders: computedOrders,
      notes: c.notes,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      leadsCount: c._count?.leads || 0,
      dealsCount: c._count?.deals || 0,
    };
  });
}

/**
 * Create a new CRM customer record with phone uniqueness check
 */
export async function createCustomer(data: CreateCustomerInput) {
  const name = data.name?.trim();
  const phone = data.phone?.trim();

  if (!name) throw new Error('Customer name is required');
  if (!phone) throw new Error('Phone number is required');

  // Check if a customer with this phone number already exists
  const existing = await prisma.crmCustomer.findUnique({
    where: { phone },
  });

  if (existing) {
    throw new Error(`A customer with phone number "${phone}" already exists (${existing.name}).`);
  }

  const ltv = typeof data.lifetimeValue === 'number' && !isNaN(data.lifetimeValue)
    ? data.lifetimeValue
    : 0;

  const orders = typeof data.totalOrders === 'number' && !isNaN(data.totalOrders)
    ? data.totalOrders
    : 0;

  return await prisma.crmCustomer.create({
    data: {
      name,
      phone,
      email: data.email?.trim() || '',
      city: data.city?.trim() || '',
      customerSegment: data.customerSegment?.trim() || 'Regular',
      lifetimeValue: ltv,
      totalOrders: orders,
      notes: data.notes?.trim() || '',
    },
  });
}

/**
 * Update a customer's segment tier or profile
 */
export async function updateCustomerSegment(id: string, segment: string) {
  if (!id) throw new Error('Customer ID is required');
  if (!segment) throw new Error('Segment is required');

  return await prisma.crmCustomer.update({
    where: { id },
    data: { customerSegment: segment },
  });
}
