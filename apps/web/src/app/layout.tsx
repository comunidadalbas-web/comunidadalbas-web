import type { Metadata } from 'next';
import './globals.css';

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
        <Header />
        <main className="main-content">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

function Header() {
  return (
    <header className="site-header">
      <div className="header-inner">
        <a href="/" className="site-logo">
          Comunidad Albas
        </a>
        <button className="nav-toggle" aria-label="Menú de navegación">☰</button>
        <nav className="main-nav">
          <a href="/">Inicio</a>
          <a href="/nosotros">Nosotros</a>
          <a href="/documentos">Documentos</a>
          <a href="/contacto">Contacto</a>
        </nav>
      </div>
    </header>
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
            <a href="/privacidad">Aviso de privacidad</a>
          </p>
        </div>
        <div className="footer-section">
          <h3>Portal</h3>
          <p>comunidadalbas.com.mx</p>
          <p>En construcción</p>
        </div>
      </div>
      <div className="footer-bottom">
        &copy; {new Date().getFullYear()} Comunidad Albas. Todos los derechos reservados.
      </div>
    </footer>
  );
}
