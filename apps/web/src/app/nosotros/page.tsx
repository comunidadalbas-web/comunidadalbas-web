import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nosotros',
};

export default function NosotrosPage() {
  return (
    <>
      <h1 className="page-title">Nosotros</h1>
      <p className="page-subtitle">Identidad, propósito y alcance</p>

      <section className="info-section">
        <h2>Quiénes somos</h2>
        <p>
          Comunidad Albas es el proyecto de organización y administración de Privada Albas, un
          conjunto residencial ubicado en Real Granada Quinta Etapa, Tecámac, Estado de México.
        </p>
        <p style={{ marginTop: '1rem' }}>
          Actualmente nos encontramos en proceso de formalización. La figura jurídica propuesta
          es <strong>Asociación Comunitaria Privada Albas, A.C.</strong>, la cual se constituirá
          conforme a la legislación aplicable y será presentada oficialmente una vez concluido el
          proceso registral.
        </p>
      </section>

      <section className="info-section">
        <h2>Misión</h2>
        <p>
          Administrar los recursos y espacios comunes de Privada Albas con eficiencia,
          transparencia y participación de la comunidad, promoviendo una convivencia armónica
          y la conservación del patrimonio de todas y todos.
        </p>
      </section>

      <section className="info-section">
        <h2>Alcance</h2>
        <p>
          Nuestra labor abarca la coordinación de servicios, mantenimiento, finanzas,
          documentación y comunicación entre las personas que habitan la privada. No
          sustituimos ni reemplazamos a los órganos condominales establecidos por la ley,
          sino que actuamos por encomienda y coordinación con ellos.
        </p>
      </section>

      <section className="info-section">
        <div className="alert alert-warning">
          <strong>Aviso importante.</strong> La Asociación Comunitaria Privada Albas, A.C. se
          encuentra en proceso de constitución. Toda referencia a la misma es meramente
          propositiva hasta que se complete su registro formal.
        </div>
      </section>
    </>
  );
}
