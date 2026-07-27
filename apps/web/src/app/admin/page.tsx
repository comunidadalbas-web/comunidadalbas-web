import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Administración',
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <>
      <h1 className="page-title">Administración</h1>
      <div className="alert alert-warning">
        <strong>Acceso restringido.</strong> Esta sección es exclusiva para personal autorizado de
        Comunidad Albas. El módulo de autenticación se encuentra en desarrollo.
      </div>
      <section className="info-section">
        <p>
          Una vez implementado el sistema de autenticación y control de acceso basado en roles
          (RBAC), aquí se gestionarán:
        </p>
        <ul style={{ marginLeft: '1.5rem', marginTop: '0.75rem' }}>
          <li>Edificios y departamentos</li>
          <li>Cuotas y cargos</li>
          <li>Pagos y conciliación</li>
          <li>Egresos y autorizaciones</li>
          <li>Documentos y publicaciones</li>
          <li>Usuarios y roles</li>
          <li>Bitácora de auditoría</li>
        </ul>
      </section>
    </>
  );
}
