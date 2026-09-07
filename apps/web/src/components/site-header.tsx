'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link href="/" className="site-logo" onClick={close}>PATRIMONIO</Link>
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
          <Link href="/contacto" onClick={close}>Contacto</Link>
          <Link href="/login" onClick={close}>Acceso</Link>
        </nav>
      </div>
    </header>
  );
}
