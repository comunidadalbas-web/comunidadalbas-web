import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@comunidad-albas/db';
import { guardAdminRequest } from '@/lib/auth/guards';
import { updateUserSchema } from '@/lib/users/validation';
import { hashPassword } from '@/lib/auth/password';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const guard = await guardAdminRequest(request, { roles: ['admin'], csrf: true });
  if (guard instanceof NextResponse) return guard;

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos inválidos', fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
  }

  if (id === guard.session.userId) {
    const { active } = parsed.data;
    if (active === false) {
      return NextResponse.json({ error: 'No puedes desactivar tu propia cuenta' }, { status: 400 });
    }
  }

  const data = parsed.data;

  if (data.password) {
    await prisma.user.update({
      where: { id },
      data: { passwordHash: hashPassword(data.password) },
    });
  }

  if (data.roles) {
    await prisma.roleAssignment.deleteMany({ where: { userId: id } });
    await Promise.all(
      data.roles.map((role) =>
        prisma.roleAssignment.create({ data: { userId: id, role } }),
      ),
    );
  }

  if (data.displayName !== undefined || data.active !== undefined) {
    await prisma.user.update({
      where: { id },
      data: {
        ...(data.displayName !== undefined && { displayName: data.displayName.trim() }),
        ...(data.active !== undefined && { active: data.active }),
      },
    });
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { id },
    select: {
      id: true,
      email: true,
      displayName: true,
      active: true,
      roles: { select: { role: true } },
    },
  });

  const { writeAuditLog, AUDIT_ACTIONS } = await import('@/lib/audit');
  await writeAuditLog({
    userId: guard.session.userId,
    action: AUDIT_ACTIONS.USER_UPDATE,
    entityType: 'User',
    entityId: id,
    before: {
      displayName: existing.displayName,
      active: existing.active,
      roles: (await prisma.roleAssignment.findMany({ where: { userId: id } })).map((r) => r.role),
    },
    after: {
      displayName: user.displayName,
      active: user.active,
      roles: user.roles.map((r) => r.role),
    },
  });

  return NextResponse.json({
    success: true,
    item: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      active: user.active,
      roles: user.roles.map((r) => r.role),
    },
  });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const guard = await guardAdminRequest(request, { roles: ['admin'], csrf: true });
  if (guard instanceof NextResponse) return guard;

  const { id } = await context.params;

  if (id === guard.session.userId) {
    return NextResponse.json({ error: 'No puedes eliminar tu propia cuenta' }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
  }

  const adminCount = await prisma.roleAssignment.count({ where: { role: 'admin' } });
  const isLastAdmin =
    (await prisma.roleAssignment.findUnique({ where: { userId_role: { userId: id, role: 'admin' } } })) !== null &&
    adminCount <= 1;
  if (isLastAdmin) {
    return NextResponse.json({ error: 'No se puede eliminar el último administrador' }, { status: 400 });
  }

  const { writeAuditLog, AUDIT_ACTIONS } = await import('@/lib/audit');
  await writeAuditLog({
    userId: guard.session.userId,
    action: AUDIT_ACTIONS.USER_DELETE,
    entityType: 'User',
    entityId: id,
    before: { email: existing.email },
  });

  await prisma.roleAssignment.deleteMany({ where: { userId: id } });
  const auditRows = await prisma.auditLog.findMany({ where: { userId: id }, select: { id: true } });
  await Promise.all(
    auditRows.map((row) =>
      prisma.auditLog.update({ where: { id: row.id }, data: { userId: null } }).catch(() => undefined),
    ),
  );
  await prisma.user.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
