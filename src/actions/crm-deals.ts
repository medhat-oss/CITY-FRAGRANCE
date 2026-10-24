import prisma from '@/lib/prisma';

export interface CreateDealInput {
  title: string;
  expectedValue: number;
  stage?: string;
  leadId?: string | null;
  customerId?: string | null;
  closingDate?: string | null;
  notes?: string;
}

export const PIPELINE_STAGES = [
  'Lead In',
  'Qualified',
  'Proposal Sent',
  'Closed Won',
  'Closed Lost',
] as const;

export type PipelineStage = (typeof PIPELINE_STAGES)[number];

/**
 * Fetch all CRM deals including linked lead & customer, ordered by creation date descending.
 * Also fetches list of active leads to populate association selects in the UI.
 */
export async function getPipelineDeals() {
  const [deals, leads] = await Promise.all([
    prisma.crmDeal.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        lead: {
          select: {
            id: true,
            name: true,
            phone: true,
            company: true,
            preferredNotes: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            customerSegment: true,
          },
        },
      },
    }),
    prisma.crmLead.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        phone: true,
        company: true,
        customerId: true,
      },
      take: 100,
    }),
  ]);

  return { deals, leads };
}

/**
 * Create a new deal linked to a lead and/or customer
 */
export async function createDeal(data: CreateDealInput) {
  const title = data.title?.trim();
  if (!title) {
    throw new Error('Deal title is required');
  }

  const expectedValue =
    typeof data.expectedValue === 'number' && !isNaN(data.expectedValue)
      ? data.expectedValue
      : parseFloat(String(data.expectedValue)) || 0;

  let customerId = data.customerId || null;

  // If a leadId is provided but no customerId, check if lead is linked to a customer
  if (data.leadId && !customerId) {
    try {
      const linkedLead = await prisma.crmLead.findUnique({
        where: { id: data.leadId },
        select: { customerId: true },
      });
      if (linkedLead?.customerId) {
        customerId = linkedLead.customerId;
      }
    } catch {
      // Proceed without customerId
    }
  }

  const closingDate = data.closingDate ? new Date(data.closingDate) : null;

  return await prisma.crmDeal.create({
    data: {
      title,
      expectedValue,
      stage: data.stage?.trim() || 'Lead In',
      leadId: data.leadId || null,
      customerId,
      closingDate,
      notes: data.notes?.trim() || '',
    },
    include: {
      lead: {
        select: {
          id: true,
          name: true,
          phone: true,
          company: true,
          preferredNotes: true,
        },
      },
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
 * Move / update deal stage in the pipeline
 */
export async function updateDealStage(id: string, stage: string) {
  if (!id) throw new Error('Deal ID is required');
  if (!stage) throw new Error('Target stage is required');

  return await prisma.crmDeal.update({
    where: { id },
    data: { stage },
    include: {
      lead: {
        select: {
          id: true,
          name: true,
          phone: true,
          company: true,
          preferredNotes: true,
        },
      },
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
