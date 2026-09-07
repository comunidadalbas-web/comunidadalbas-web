'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', roles: [] },
  { href: '/admin/propiedades', label: 'Propiedades', roles: ['owner', 'gestor'] },
  { href: '/admin/arrendatarios', label: 'Arrendatarios', roles: ['owner', 'gestor'] },
  { href: '/admin/contratos', label: 'Contratos', roles: ['owner', 'gestor'] },
  { href: '/admin/cobranza', label: 'Cobranza', roles: ['owner', 'gestor', 'contador'] },
  { href: '/admin/gastos', label: 'Gastos', roles: ['owner', 'gestor', 'contador'] },
  { href: '/admin/calendario', label: 'Calendario', roles: ['owner', 'gestor'] },
  { href: '/admin/mantenimiento', label: 'Mantenimiento', roles: ['owner', 'gestor'] },
  { href: '/admin/inventario', label: 'Inventario', roles: ['owner', 'gestor'] },
  { href: '/admin/documentos', label: 'Documentos', roles: ['owner', 'gestor'] },
  { href: '/admin/comunicaciones', label: 'Comunicaciones', roles: ['owner', 'gestor'] },
  { href: '/admin/reportes', label: 'Reportes', roles: ['owner', 'gestor', 'contador'] },
  { href: '/admin/usuarios', label: 'Usuarios', roles: ['owner'] },
  { href: '/admin/auditoria', label: 'Auditoría', roles: ['owner'] },
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
        <strong>PATRIMONIO</strong>
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
