import { NextResponse } from 'next/server';
import { SESSION_COOKIE, CSRF_COOKIE } from '@/lib/auth/session';

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
  response.cookies.set(CSRF_COOKIE, '', { httpOnly: false, path: '/', maxAge: 0 });
  return response;
}
