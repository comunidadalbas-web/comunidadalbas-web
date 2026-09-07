import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@comunidad-albas/db';
import { guardAdminRequest } from '@/lib/auth/guards';
import { createUserSchema } from '@/lib/users/validation';
import { hashPassword } from '@/lib/auth/password';
import { MAX_ADMIN_USERS } from '@/lib/users/institutional-accounts';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const guard = await guardAdminRequest(request, { roles: ['admin'] });
  if (guard instanceof NextResponse) return guard;

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      email: true,
      displayName: true,
      active: true,
      mustChangePassword: true,
      lastLoginAt: true,
      createdAt: true,
      roles: { select: { role: true } },
    },
  });

  return NextResponse.json({
    items: users.map((u: any) => ({
      id: u.id,
      email: u.email,
      displayName: u.displayName,
      active: u.active,
      mustChangePassword: u.mustChangePassword,
      lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
      createdAt: u.createdAt.toISOString(),
      roles: u.roles.map((r: any) => r.role),
    })),
  });
}

export async function POST(request: NextRequest) {
  const guard = await guardAdminRequest(request, { roles: ['admin'], csrf: true });
  if (guard instanceof NextResponse) return guard;

  const body = await request.json().catch(() => ({}));
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos inválidos', fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { email, displayName, password, roles } = parsed.data;
  const normalizedEmail = email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return NextResponse.json({ error: 'Ya existe un usuario con ese correo' }, { status: 409 });
  }

  const userCount = await prisma.user.count();
  if (userCount >= MAX_ADMIN_USERS) {
    return NextResponse.json(
      { error: `El panel permite un máximo de ${MAX_ADMIN_USERS} usuarios` },
      { status: 409 },
    );
  }

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      displayName: displayName.trim(),
      passwordHash: hashPassword(password),
      mustChangePassword: true,
    },
  });
  await Promise.all(
    roles.map((role) => prisma.roleAssignment.create({ data: { userId: user.id, role } })),
  );

  const { writeAuditLog, AUDIT_ACTIONS } = await import('@/lib/audit');
  await writeAuditLog({
    userId: guard.session.userId,
    action: AUDIT_ACTIONS.USER_CREATE,
    entityType: 'User',
    entityId: user.id,
    after: { email: normalizedEmail, roles },
  });

  try {
    const { sendUserWelcome } = await import('@/lib/email/notifications');
    await sendUserWelcome({
      to: normalizedEmail,
      displayName: displayName.trim(),
      roles,
    });
  } catch {
    // Welcome email failure is non-blocking
  }

  return NextResponse.json(
    { success: true, item: { id: user.id, email: normalizedEmail, mustChangePassword: true } },
    { status: 201 },
  );
}
