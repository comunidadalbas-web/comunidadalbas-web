export default function HomePage() {
  return (
    <>
      <section className="hero">
        <h1>Comunidad Albas</h1>
        <p>
          Estamos construyendo un espacio más organizado, transparente y conectado para todos.
        </p>
        <p style={{ fontSize: '1.1rem', color: 'var(--color-text-light)', marginBottom: '2rem' }}>
          Administración de privada Albas — pagos, documentos y comunicación en un solo lugar.
        </p>
        <p style={{ marginBottom: '2rem' }}>
          <a href="/pagos" className="btn btn-primary" style={{ fontSize: '1.05rem', padding: '0.75rem 1.5rem' }}>
            Pagar mi cuota en línea
          </a>
        </p>
        <div className="hero-tagline">
          <span>Organización</span>
          <span>Transparencia</span>
          <span>Participación comunitaria</span>
        </div>
      </section>

      <section className="info-section">
        <h2>Nuestro propósito</h2>
        <div className="card-grid">
          <div className="card">
            <h3>Organización</h3>
            <p>
              Administración ordenada y eficiente de los espacios y recursos comunes de Privada Albas.
            </p>
          </div>
          <div className="card">
            <h3>Transparencia</h3>
            <p>
              Información clara y accesible sobre la gestión, finanzas y decisiones de la comunidad.
            </p>
          </div>
          <div className="card">
            <h3>Participación</h3>
            <p>
              Canales de comunicación y colaboración abiertos para todas las personas que habitan la privada.
            </p>
          </div>
        </div>
      </section>

      <section className="info-section">
        <div className="alert alert-info">
          <strong>Pagos en línea activos.</strong> Ahora puedes pagar tu cuota condominal o una
          aportación extraordinaria mediante transferencia SPEI a través de Mercado Pago.
        </div>
        <p>
          <a href="/pagos" className="btn btn-primary">
            Ir a pagos en línea
          </a>
          <a href="/contacto" className="btn btn-secondary" style={{ marginLeft: '0.75rem' }}>
            Contáctanos
          </a>
        </p>
      </section>
    </>
  );
}
