'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

const NAV_ITEMS = [
  { href: '/admin', label: 'Panel' },
  { href: '/admin/solicitudes', label: 'Solicitudes' },
  { href: '/admin/comunicados', label: 'Comunicados' },
  { href: '/admin/blog', label: 'Blog' },
  { href: '/admin/campanas', label: 'Campañas' },
  { href: '/admin/calendario', label: 'Calendario' },
  { href: '/admin/edificios', label: 'Edificios' },
  { href: '/admin/unidades', label: 'Unidades' },
  { href: '/admin/conceptos', label: 'Conceptos' },
  { href: '/admin/documentos', label: 'Documentos' },
  { href: '/admin/pagos', label: 'Pagos' },
  { href: '/admin/egresos', label: 'Egresos' },
  { href: '/admin/informes', label: 'Informes' },
  { href: '/admin/usuarios', label: 'Usuarios' },
  { href: '/admin/auditoria', label: 'Auditoría' },
];

export default function AdminNav({
  displayName,
  email,
}: {
  displayName: string;
  email: string;
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
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={pathname === item.href ? 'admin-nav-link active' : 'admin-nav-link'}
          >
            {item.label}
          </Link>
        ))}
      </div>
      <button
        type="button"
        className="btn btn-ghost"
        onClick={handleLogout}
        disabled={loggingOut}
      >
        {loggingOut ? 'Saliendo...' : 'Cerrar sesión'}
      </button>
    </nav>
  );
}
