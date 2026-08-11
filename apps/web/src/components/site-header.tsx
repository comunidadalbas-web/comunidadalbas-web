'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link href="/" className="site-logo" onClick={close}>Comunidad Albas</Link>
        <button
          type="button"
          className="nav-toggle"
          aria-label={open ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'}
          aria-expanded={open}
          aria-controls="main-navigation"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? '×' : '☰'}
        </button>
        <nav id="main-navigation" className={`main-nav${open ? ' open' : ''}`}>
          <Link href="/" onClick={close}>Inicio</Link>
          <Link href="/nosotros" onClick={close}>Nosotros</Link>
          <Link href="/comunicados" onClick={close}>Comunicados</Link>
          <Link href="/blog" onClick={close}>Blog</Link>
          <Link href="/campanas" onClick={close}>Campañas</Link>
          <Link href="/calendario" onClick={close}>Calendario</Link>
          <Link href="/documentos" onClick={close}>Documentos</Link>
          <Link href="/pagos" onClick={close}>Pagos</Link>
          <Link href="/contacto" onClick={close}>Contacto</Link>
        </nav>
      </div>
    </header>
  );
}
