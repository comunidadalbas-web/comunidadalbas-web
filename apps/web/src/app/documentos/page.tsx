import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Documentos',
};

export default function DocumentosPage() {
  return (
    <>
      <h1 className="page-title">Documentos</h1>
      <p className="page-subtitle">Biblioteca de normativa, avisos e informes</p>

      <div className="alert alert-info">
        Esta sección estará disponible próximamente. Aquí se publicarán los documentos
        institucionales, normativos y financieros de la comunidad una vez que el portal se
        encuentre en operación.
      </div>

      <section className="info-section">
        <h2>Transparencia</h2>
        <p>
          En cumplimiento con nuestro compromiso de transparencia, este espacio alojará:
        </p>
        <ul style={{ marginLeft: '1.5rem', marginTop: '0.75rem' }}>
          <li>Estatutos y reglamentos</li>
          <li>Avisos de privacidad</li>
          <li>Informes financieros trimestrales</li>
          <li>Actas de asambleas y reuniones</li>
          <li>Convocatorias oficiales</li>
        </ul>
      </section>
    </>
  );
}
