'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

const NAV_ITEMS = [
  { href: '/admin', label: 'Panel', roles: [] },
  { href: '/admin/solicitudes', label: 'Solicitudes', roles: ['admin', 'secretario', 'vocal'] },
  { href: '/admin/comunicados', label: 'Comunicados', roles: ['admin', 'director', 'secretario'] },
  { href: '/admin/blog', label: 'Blog', roles: ['admin', 'director', 'secretario'] },
  { href: '/admin/campanas', label: 'Campañas', roles: ['admin', 'director', 'secretario'] },
  { href: '/admin/calendario', label: 'Calendario', roles: ['admin', 'director', 'secretario'] },
  { href: '/admin/edificios', label: 'Edificios', roles: ['admin', 'director'] },
  { href: '/admin/unidades', label: 'Unidades', roles: ['admin', 'director'] },
  { href: '/admin/conceptos', label: 'Conceptos', roles: ['admin', 'director', 'tesorero'] },
  { href: '/admin/documentos', label: 'Documentos', roles: ['admin', 'director', 'secretario'] },
  { href: '/admin/pagos', label: 'Pagos', roles: ['admin', 'tesorero'] },
  { href: '/admin/egresos', label: 'Egresos', roles: ['admin', 'tesorero'] },
  { href: '/admin/informes', label: 'Informes', roles: ['admin', 'director', 'tesorero'] },
  { href: '/admin/usuarios', label: 'Usuarios', roles: ['admin'] },
  { href: '/admin/auditoria', label: 'Auditoría', roles: ['admin'] },
];

export default function AdminNav({
  displayName,
  email,
  roles,
}: {
  displayName: string;
  email: string;
  roles: string[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' });
    } finally {
      router.replace('/login');
    }
  };

  return (
    <nav className="admin-nav">
      <div className="admin-nav-brand">
        <strong>Comunidad Albas</strong>
        <span className="admin-nav-user">
          {displayName} · {email}
        </span>
      </div>
      <div className="admin-nav-links">
        {NAV_ITEMS.filter(
          (item) => item.roles.length === 0 || item.roles.some((role) => roles.includes(role)),
        ).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={pathname === item.href ? 'admin-nav-link active' : 'admin-nav-link'}
          >
            {item.label}
          </Link>
        ))}
      </div>
      <button type="button" className="btn btn-ghost" onClick={handleLogout} disabled={loggingOut}>
        {loggingOut ? 'Saliendo...' : 'Cerrar sesión'}
      </button>
    </nav>
  );
}
