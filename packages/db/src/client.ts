import { PrismaClient } from '../prisma/client/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient(): PrismaClient {
  if (process.env.PRISMA_ADAPTER === 'pg') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaPg } = require('@prisma/adapter-pg') as typeof import('@prisma/adapter-pg');
    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
    return globalForPrisma.prisma ?? new PrismaClient({ adapter });
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaNeonHTTP } = require('@prisma/adapter-neon') as typeof import('@prisma/adapter-neon');
  const adapter = new PrismaNeonHTTP(process.env.DATABASE_URL!, {});
  return globalForPrisma.prisma ?? new PrismaClient({ adapter });
}

export const prisma = createClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export { PrismaClient };
export type {
  Building, Unit, FeeConcept, Charge,
  Payment, PaymentApplication, Expense,
  Document, User, RoleAssignment, AuditLog,
  ContactRequest, MercadoPagoOrder, MercadoPagoWebhookEvent,
  Announcement, Campaign, CalendarEvent, BlogPost, BlogComment, PasswordResetToken,
  Property, Tenant, Lease, LeaseOccupant, LeaseCharge,
  SecurityDeposit, AdministrationFee, PropertyExpense,
  MaintenanceTicket, AssetInventory, PropertyDocument, TaxRecord,
  RecordStatus, PaymentStatus, ExpenseStatus,
  AnnouncementStatus, CampaignStatus, CalendarEventStatus, BlogPostStatus, BlogCommentStatus,
  LeaseStatus, TicketStatus, TicketPriority, InventoryCondition,
  Prisma,
} from '../prisma/client/client';
