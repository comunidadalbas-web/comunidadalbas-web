import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Aviso de Privacidad',
};

export default function PrivacidadPage() {
  return (
    <>
      <h1 className="page-title">Aviso de Privacidad</h1>
      <p className="page-subtitle">
        Versión de prueba — sujeta a revisión y actualización
      </p>

      <div className="alert alert-warning">
        <strong>Aviso preliminar.</strong> Este documento es una versión inicial y será revisada
        y complementada conforme se consolide la estructura jurídica de la comunidad. No
        constituye una versión definitiva ni vinculante.
      </div>

      <section className="info-section">
        <h2>Responsable de los datos</h2>
        <p>
          Comunidad Albas, con domicilio en Privada Albas, Real Granada Quinta Etapa, Tecámac,
          Estado de México, C.P. 55745, es responsable del tratamiento de sus datos personales.
        </p>
      </section>

      <section className="info-section">
        <h2>Datos recabados</h2>
        <p>Para los fines del portal, podemos recabar los siguientes datos:</p>
        <ul style={{ marginLeft: '1.5rem', marginTop: '0.75rem' }}>
          <li>Nombre completo</li>
          <li>Correo electrónico</li>
          <li>Teléfono de contacto</li>
          <li>Edificio y departamento (cuando aplique)</li>
        </ul>
      </section>

      <section className="info-section">
        <h2>Finalidad</h2>
        <p>
          Sus datos serán utilizados exclusivamente para la comunicación institucional, atención
          de solicitudes y notificaciones relacionadas con la administración de Privada Albas.
        </p>
      </section>

      <section className="info-section">
        <h2>Protección</h2>
        <p>
          Implementamos medidas de seguridad técnicas y organizativas para proteger sus datos
          contra acceso no autorizado, pérdida o alteración.
        </p>
      </section>

      <section className="info-section">
        <h2>Contacto</h2>
        <p>
          Para cualquier duda sobre el tratamiento de sus datos, puede escribir a:
          <br />
          <a href="mailto:contacto@comunidadalbas.com.mx">contacto@comunidadalbas.com.mx</a>
        </p>
      </section>

      <section className="info-section">
        <div className="alert alert-info">
          Este aviso se actualizará una vez que la Asociación Comunitaria Privada Albas, A.C.
          esté formalmente constituida y se designe al responsable oficial del tratamiento de
          datos personales.
        </div>
      </section>
    </>
  );
}
