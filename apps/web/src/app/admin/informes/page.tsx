import type { Metadata } from 'next';
import InformesClient from './informes-client';

export const metadata: Metadata = {
  title: 'Informes y estadísticas',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function InformesPage() {
  return (
    <>
      <h1 className="page-title">Informes y estadísticas</h1>
      <p className="page-subtitle">Balances, ingresos, morosidad y exportación de datos</p>
      <InformesClient />
    </>
  );
}
