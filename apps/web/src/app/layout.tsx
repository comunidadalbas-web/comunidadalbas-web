import type { Metadata } from 'next';
import './globals.css';
import SiteHeader from '@/components/site-header';

export const metadata: Metadata = {
  title: {
    default: 'Comunidad Albas',
    template: '%s | Comunidad Albas',
  },
  description: 'Portal institucional de Privada Albas — organización, transparencia y participación comunitaria.',
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <SiteHeader />
        <main className="main-content">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-section">
          <h3>Comunidad Albas</h3>
          <p>Privada Albas, Real Granada Quinta Etapa</p>
          <p>Tecámac, Estado de México, C.P. 55745</p>
        </div>
        <div className="footer-section">
          <h3>Contacto</h3>
          <p>
            <a href="mailto:contacto@comunidadalbas.com.mx">
              contacto@comunidadalbas.com.mx
            </a>
          </p>
          <p>
            Secretaría<br />
            <a href="mailto:secretaria@comunidadalbas.com.mx">secretaria@comunidadalbas.com.mx</a>
          </p>
          <p>
            <a href="https://wa.me/525663011493" target="_blank" rel="noopener noreferrer">
              WhatsApp Secretaría · 56 6301 1493
            </a>
          </p>
          <p style={{ fontSize: '0.8rem' }}>
            Información y orientación administrativa.<br />No es un canal de emergencias.
          </p>
          <p>
            <a href="/privacidad">Aviso de privacidad</a>
          </p>
        </div>
        <div className="footer-section">
          <h3>Portal</h3>
          <p>comunidadalbas.com.mx</p>
          <p>
            <a href="/comunicados">Comunicados</a>
          </p>
          <p>
            <a href="/blog">Blog</a>
          </p>
          <p>
            <a href="/campanas">Campañas</a>
          </p>
          <p>
            <a href="/calendario">Calendario</a>
          </p>
          <p>
            <a href="/pagos">Pagos en línea</a>
          </p>
          <p>
            <a href="/solicitud">Consulta tu solicitud</a>
          </p>
        </div>
      </div>
      <div className="footer-bottom">
        &copy; {new Date().getFullYear()} Comunidad Albas. Todos los derechos reservados.
      </div>
    </footer>
  );
}
