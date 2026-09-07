import type { Metadata } from 'next';
import './globals.css';
import SiteHeader from '@/components/site-header';

export const metadata: Metadata = {
  title: {
    default: 'PATRIMONIO',
    template: '%s | PATRIMONIO',
  },
  description: 'Plataforma profesional de administración patrimonial e inmobiliaria.',
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
          <h3>PATRIMONIO</h3>
          <p>Administración patrimonial e inmobiliaria.</p>
        </div>
        <div className="footer-section">
          <h3>Contacto</h3>
          <p>
            <a href="mailto:contacto@comunidadalbas.com.mx">
              contacto@comunidadalbas.com.mx
            </a>
          </p>
        </div>
        <div className="footer-section">
          <h3>Plataforma</h3>
          <p>comunidadalbas.com.mx</p>
        </div>
      </div>
      <div className="footer-bottom">
        &copy; {new Date().getFullYear()} PATRIMONIO. Todos los derechos reservados.
      </div>
    </footer>
  );
}
