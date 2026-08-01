import { redirect } from 'next/navigation';
import { getSessionFromRequest } from '@/lib/auth/session';
import { ROLES } from '@/lib/auth/guards';
import AdminNav from './admin-nav';

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionFromRequest();
  if (!session) redirect('/login');

  const canManageFinance = session.roles.includes(ROLES.ADMIN) || session.roles.includes(ROLES.TESORERO);
  const canManageContent = session.roles.includes(ROLES.ADMIN) || session.roles.includes(ROLES.DIRECTOR);

  return (
    <div className="admin-shell">
      <AdminNav displayName={session.displayName} email={session.email} />
      <div className="admin-content">{children}</div>
    </div>
  );
}
