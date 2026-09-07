export default function HomePage() {
  return (
    <>
      <section className="hero">
        <h1>PATRIMONIO</h1>
        <p>
          Plataforma profesional de administración patrimonial e inmobiliaria.
        </p>
        <p style={{ fontSize: '1.1rem', color: 'var(--color-text-light)', marginBottom: '2rem' }}>
          Gestión integral de propiedades, arrendamientos y finanzas.
        </p>
        <p style={{ marginBottom: '2rem' }}>
          <a href="/login" className="btn btn-primary" style={{ fontSize: '1.05rem', padding: '0.75rem 1.5rem' }}>
            Acceder al panel
          </a>
        </p>
        <div className="hero-tagline">
          <span>Propiedades</span>
          <span>Arrendamientos</span>
          <span>Finanzas</span>
        </div>
      </section>

      <section className="info-section">
        <h2>Gestión patrimonial profesional</h2>
        <div className="card-grid">
          <div className="card">
            <h3>Propiedades</h3>
            <p>
              Administración ordenada y eficiente de tus activos inmobiliarios.
            </p>
          </div>
          <div className="card">
            <h3>Arrendamientos</h3>
            <p>
              Contratos, cobranza y seguimiento de arrendatarios.
            </p>
          </div>
          <div className="card">
            <h3>Finanzas</h3>
            <p>
              Control de ingresos, gastos y flujo patrimonial.
            </p>
          </div>
        </div>
      </section>

      <section className="info-section">
        <div className="alert alert-info">
          <strong>Plataforma en preparación.</strong> Sistema de administración patrimonial
          con control de propiedades, arrendamientos y finanzas.
        </div>
        <p>
          <a href="/login" className="btn btn-primary">
            Acceder al panel
          </a>
          <a href="/contacto" className="btn btn-secondary" style={{ marginLeft: '0.75rem' }}>
            Contáctanos
          </a>
        </p>
      </section>
    </>
  );
}
