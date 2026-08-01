import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { CSRF_COOKIE } from '@/lib/auth/session';
import ChangePasswordClient from './change-password-client';

export const metadata: Metadata = {
  title: 'Cambiar contraseña',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function ChangePasswordPage() {
  const csrfCookie = (await cookies()).get(CSRF_COOKIE)?.value ?? '';
  const csrf = csrfCookie.split('.')[0] ?? '';

  return <ChangePasswordClient csrfToken={csrf} />;
}
