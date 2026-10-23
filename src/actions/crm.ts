import prisma from '@/lib/prisma';

export interface CreateLeadInput {
  name: string;
  phone: string;
  email?: string;
  company?: string;
  source?: string;
  status?: string;
  preferredNotes?: string;
  purchaseOccasion?: string;
  estimatedBudget?: number;
  notes?: string;
}

export interface UpdateLeadStatusInput {
  id: string;
  status: string;
}

/**
 * Fetch all CRM leads ordered by creation date descending
 */
export async function getCrmLeads() {
  return await prisma.crmLead.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          phone: true,
          customerSegment: true,
        },
      },
      deals: {
        select: {
          id: true,
          title: true,
          expectedValue: true,
          stage: true,
        },
      },
    },
  });
}

/**
 * Create a new CRM lead and auto-link to existing customer if phone matches
 */
export async function createCrmLead(data: CreateLeadInput) {
  const name = data.name?.trim();
  const phone = data.phone?.trim();

  if (!name) {
    throw new Error('Contact name is required');
  }
  if (!phone) {
    throw new Error('Phone number is required');
  }

  // Check if customer with this phone number already exists
  let customerId: string | null = null;
  try {
    const existingCustomer = await prisma.crmCustomer.findUnique({
      where: { phone },
    });
    if (existingCustomer) {
      customerId = existingCustomer.id;
    }
  } catch {
    // If customer lookup fails, proceed without linking
  }

  const budget = typeof data.estimatedBudget === 'number' && !isNaN(data.estimatedBudget)
    ? data.estimatedBudget
    : (data.estimatedBudget ? parseFloat(String(data.estimatedBudget)) || null : null);

  return await prisma.crmLead.create({
    data: {
      name,
      phone,
      email: data.email?.trim() || '',
      company: data.company?.trim() || '',
      source: data.source?.trim() || 'Website',
      status: data.status?.trim() || 'New',
      preferredNotes: data.preferredNotes?.trim() || null,
      purchaseOccasion: data.purchaseOccasion?.trim() || null,
      estimatedBudget: budget,
      notes: data.notes?.trim() || '',
      customerId,
    },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          phone: true,
          customerSegment: true,
        },
      },
    },
  });
}

/**
 * Update the status of an existing lead
 */
export async function updateCrmLeadStatus(id: string, status: string) {
  if (!id) throw new Error('Lead ID is required');
  if (!status) throw new Error('Status is required');

  return await prisma.crmLead.update({
    where: { id },
    data: { status },
  });
}
