import type { Metadata } from 'next';
import { prisma } from '@comunidad-albas/db';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Administración',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const [contactNew, contactOpen, units, buildings, feeConcepts, paymentsPending, expensesPending] = await Promise.all([
    prisma.contactRequest.count({ where: { status: 'NEW' } }),
    prisma.contactRequest.count({ where: { status: { in: ['NEW', 'IN_REVIEW'] } } }),
    prisma.unit.count(),
    prisma.building.count(),
    prisma.feeConcept.count(),
    prisma.payment.count({ where: { status: 'REPORTED' } }),
    prisma.expense.count({ where: { status: 'REQUESTED' } }),
  ]);

  const stats = [
    { label: 'Solicitudes nuevas', value: contactNew, href: '/admin/solicitudes' },
    { label: 'En atención', value: contactOpen, href: '/admin/solicitudes' },
    { label: 'Departamentos', value: units, href: '/admin/unidades' },
    { label: 'Edificios', value: buildings, href: '/admin/unidades' },
    { label: 'Conceptos de cuota', value: feeConcepts, href: '/admin/conceptos' },
    { label: 'Pagos por confirmar', value: paymentsPending, href: '/admin/pagos' },
    { label: 'Egresos por autorizar', value: expensesPending, href: '/admin/egresos' },
  ];

  return (
    <>
      <h1 className="page-title">Panel de administración</h1>
      <p className="page-subtitle">Resumen operativo de Privada Albas</p>

      <div className="stat-grid">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="stat-card" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </Link>
        ))}
      </div>

      <section className="info-section">
        <h2>Módulos del portal</h2>
        <ul style={{ marginLeft: '1.5rem', marginTop: '0.75rem' }}>
          <li>Edificios y departamentos (catálogo)</li>
          <li>Cuotas y cargos</li>
          <li>Pagos en línea y conciliación</li>
          <li>Egresos y autorizaciones</li>
          <li>Documentos y publicaciones</li>
          <li>Usuarios y roles</li>
          <li>Bitácora de auditoría</li>
        </ul>
      </section>
    </>
  );
}
