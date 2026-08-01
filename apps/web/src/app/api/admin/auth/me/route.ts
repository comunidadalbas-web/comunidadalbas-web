import { NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth/session';
import { ROLES } from '@/lib/auth/guards';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSessionFromRequest();
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }
  return NextResponse.json({
    authenticated: true,
    user: {
      email: session.email,
      displayName: session.displayName,
      roles: session.roles,
      isAdmin: session.roles.includes(ROLES.ADMIN),
    },
  });
}
