import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '../prisma/client/client';

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export { PrismaClient };
export type {
  Building, Unit, FeeConcept, Charge,
  Payment, PaymentApplication, Expense,
  Document, User, RoleAssignment, AuditLog,
  ContactRequest,
} from '../prisma/client/client';
