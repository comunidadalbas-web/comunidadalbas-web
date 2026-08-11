import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Aviso de Privacidad',
  description: 'Aviso de privacidad integral del sitio web Comunidad Albas.',
};

export default function PrivacidadPage() {
  return (
    <>
      <h1 className="page-title">Aviso de Privacidad Integral</h1>
      <p className="page-subtitle">Sitio web Comunidad Albas · última actualización: 11 de agosto de 2026</p>

      <section className="info-section">
        <h2>1. Responsable del tratamiento</h2>
        <p>
          La administración comunitaria de Privada Albas, identificada en este portal como
          <strong> Comunidad Albas</strong>, con domicilio de contacto en Privada Albas, Real
          Granada Quinta Etapa, Tecámac, Estado de México, C.P. 55745, es responsable del
          tratamiento de los datos personales recabados mediante este sitio. Esta denominación
          identifica al portal y a su operación comunitaria y no afirma la constitución de una
          asociación civil.
        </p>
        <p>
          Contacto para privacidad: <a href="mailto:privacidad@comunidadalbas.com.mx">privacidad@comunidadalbas.com.mx</a>.
        </p>
      </section>

      <section className="info-section">
        <h2>2. Datos personales que podemos tratar</h2>
        <p>Según el trámite o servicio utilizado, podremos tratar:</p>
        <ul style={{ marginLeft: '1.5rem', marginTop: '0.75rem' }}>
          <li>Datos de identificación y contacto: nombre, correo electrónico y teléfono.</li>
          <li>Datos relacionados con la vivienda: privada, edificio y departamento.</li>
          <li>Contenido de solicitudes, aclaraciones, reportes y comunicaciones.</li>
          <li>
            Datos financieros o patrimoniales necesarios para reportar, identificar y conciliar
            pagos, como importe, fecha, referencia y clave de rastreo. El portal no debe solicitar
            ni almacenar contraseñas bancarias, NIP o códigos de seguridad de tarjetas.
          </li>
          <li>
            Datos técnicos de seguridad y operación, como fecha y hora, dirección IP, registros
            de acceso, identificadores de sesión y eventos indispensables para prevenir abuso.
          </li>
          <li>
            Para personal autorizado: correo institucional, nombre mostrado, roles y bitácora de
            acciones dentro del panel administrativo.
          </li>
        </ul>
        <p>
          No solicitamos datos personales sensibles mediante los formularios ordinarios del sitio.
          Evita incluir información de salud, biométrica, ideológica o de otra naturaleza sensible
          en campos de texto libre.
        </p>
      </section>

      <section className="info-section">
        <h2>3. Finalidades necesarias</h2>
        <ul style={{ marginLeft: '1.5rem', marginTop: '0.75rem' }}>
          <li>Atender solicitudes, incidencias, aclaraciones y comunicaciones comunitarias.</li>
          <li>Identificar la vivienda relacionada con un trámite cuando resulte necesario.</li>
          <li>Registrar, verificar y conciliar aportaciones o pagos reportados.</li>
          <li>Emitir confirmaciones, folios, avisos operativos y respuestas al solicitante.</li>
          <li>Administrar accesos autorizados y conservar una bitácora de seguridad.</li>
          <li>Cumplir obligaciones legales y atender requerimientos de autoridad competente.</li>
          <li>Proteger la disponibilidad, integridad y seguridad del portal.</li>
        </ul>
        <p>
          Comunidad Albas no utiliza los datos para publicidad comercial ajena, venta de bases de
          datos ni elaboración de perfiles comerciales.
        </p>
      </section>

      <section className="info-section">
        <h2>4. Consentimiento y datos financieros</h2>
        <p>
          Al enviar un formulario después de consultar este aviso manifiestas tu consentimiento
          para las finalidades indicadas. Cuando un proceso requiera datos financieros o
          patrimoniales, el portal solicitará una acción afirmativa expresa antes de procesarlos.
          Puedes revocar tu consentimiento, cuando legalmente proceda, mediante el correo de
          privacidad indicado en este aviso.
        </p>
      </section>

      <section className="info-section">
        <h2>5. Encargados, proveedores y transferencias</h2>
        <p>
          Para operar el portal pueden intervenir proveedores de infraestructura y servicios bajo
          instrucciones de Comunidad Albas, entre ellos alojamiento web, base de datos, correo
          electrónico y procesamiento de pagos. Actualmente el sitio puede utilizar Vercel, Neon,
          Zoho y Mercado Pago de acuerdo con el servicio solicitado. Cada proveedor trata únicamente
          la información necesaria para prestar su función y conforme a sus condiciones y medidas de
          seguridad.
        </p>
        <p>
          No se realizarán transferencias distintas de las necesarias para operar el servicio, cumplir
          una relación jurídica o atender una obligación legal, salvo que se informe y, cuando sea
          exigible, se obtenga el consentimiento correspondiente.
        </p>
      </section>

      <section className="info-section">
        <h2>Suscripciones y pagos recurrentes</h2>
        <p>
          La suscripción para cubrir automáticamente la cuota mensual de mantenimiento es
          voluntaria. La autorización y los cobros recurrentes son procesados por Mercado Pago
          conforme a sus propios términos. Comunidad Albas no solicita ni almacena el NIP, CVV
          ni el número completo de la tarjeta.
        </p>
        <p>
          Para dudas sobre este tratamiento escribe a{' '}
          <a href="mailto:privacidad@comunidadalbas.com.mx">privacidad@comunidadalbas.com.mx</a>{' '}
          o <a href="mailto:secretaria@comunidadalbas.com.mx">secretaria@comunidadalbas.com.mx</a>.
        </p>
      </section>

      <section className="info-section">
        <h2>Participación y opiniones en el blog</h2>
        <p>
          Cuando una publicación habilite opiniones, trataremos el nombre o alias, correo y texto
          proporcionados para recibir, moderar y publicar la participación autorizada. El correo y
          los datos técnicos mínimos de prevención de abuso serán visibles únicamente para personal
          autorizado; no se publicarán correos, teléfonos, domicilios, direcciones IP ni otros
          identificadores técnicos.
        </p>
      </section>

      <section className="info-section">
        <h2>6. Conservación y seguridad</h2>
        <p>
          Los datos se conservarán durante el tiempo necesario para atender la finalidad que originó
          su obtención, cumplir responsabilidades administrativas, contractuales o legales y resolver
          posibles aclaraciones. Después serán bloqueados o eliminados conforme a los plazos aplicables.
          Se aplican medidas administrativas y técnicas razonables, entre ellas control de acceso,
          sesiones protegidas, validación de solicitudes y bitácoras de auditoría.
        </p>
      </section>

      <section className="info-section">
        <h2>7. Derechos ARCO y limitación del uso</h2>
        <p>
          Puedes solicitar acceso, rectificación, cancelación u oposición al tratamiento de tus datos,
          así como limitar su uso o revocar el consentimiento, enviando una solicitud a{' '}
          <a href="mailto:privacidad@comunidadalbas.com.mx">privacidad@comunidadalbas.com.mx</a>.
          Incluye tu nombre, un medio para recibir respuesta, la descripción del derecho que deseas
          ejercer, los datos relacionados y los elementos que permitan localizar tu registro. Para
          proteger tu información podremos solicitar acreditación de identidad. La respuesta se dará
          dentro de los plazos previstos por la legislación aplicable.
        </p>
      </section>

      <section className="info-section">
        <h2>8. Cookies y sesiones</h2>
        <p>
          El portal utiliza cookies técnicas indispensables para mantener sesiones administrativas,
          prevenir solicitudes fraudulentas y conservar la seguridad. No se declaran cookies de
          publicidad conductual. Puedes bloquear cookies desde tu navegador, pero las funciones de
          acceso administrativo podrían dejar de operar.
        </p>
      </section>

      <section className="info-section">
        <h2>9. Personas menores de edad</h2>
        <p>
          Los servicios del portal no están dirigidos a recabar deliberadamente datos de personas
          menores de edad. Si detectas que se proporcionaron dichos datos sin la intervención de su
          representante, solicita su revisión o eliminación mediante el correo de privacidad.
        </p>
      </section>

      <section className="info-section">
        <h2>10. Cambios al aviso</h2>
        <p>
          Las modificaciones se publicarán en esta misma dirección electrónica, indicando la fecha de
          actualización. Cuando un cambio altere de manera sustancial las finalidades del tratamiento,
          se solicitará nuevamente el consentimiento cuando corresponda.
        </p>
      </section>

      <section className="info-section">
        <div className="alert alert-info">
          Este aviso corresponde al sitio <strong>Comunidad Albas</strong> y a sus formularios en línea;
          no presenta al portal como una asociación civil ni sustituye los avisos específicos que
          pudieran requerir trámites presenciales o futuros tratamientos distintos.
        </div>
      </section>
    </>
  );
}
