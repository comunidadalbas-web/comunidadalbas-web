import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getSessionFromRequest } from '@/lib/auth/session';
import AdminNav from './admin-nav';

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionFromRequest();
  if (!session) redirect('/login');

  const pathname = (await headers()).get('x-pathname') ?? '';
  if (session.mustChangePassword === true && pathname !== '/admin/change-password') {
    redirect('/admin/change-password');
  }

  return (
    <div className="admin-shell">
      <AdminNav displayName={session.displayName} email={session.email} roles={session.roles} />
      <div className="admin-content">{children}</div>
    </div>
  );
}
