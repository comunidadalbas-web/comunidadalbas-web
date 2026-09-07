'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NuevaPropiedadPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const form = new FormData(e.currentTarget);
    const data = Object.fromEntries(form.entries());

    try {
      const res = await fetch('/api/admin/propiedades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || 'Error al crear propiedad');
      }

      const { id } = await res.json();
      router.push(`/admin/propiedades/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href="/admin/propiedades" style={{ fontSize: '0.9rem' }}>&larr; Volver a propiedades</Link>
      </div>

      <h1 className="page-title">Nueva propiedad</h1>
      <p className="page-subtitle">Registrar un nuevo activo inmobiliario</p>

      {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      <form onSubmit={handleSubmit} className="card" style={{ padding: '1.5rem', maxWidth: '600px' }}>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="code">Código *</label>
          <input type="text" id="code" name="code" required placeholder="P-001" />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="name">Nombre *</label>
          <input type="text" id="name" name="name" required placeholder="Real Granada — Albas 203" />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="type">Tipo</label>
          <select id="type" name="type">
            <option value="Departamento">Departamento</option>
            <option value="Casa">Casa</option>
            <option value="Local">Local comercial</option>
            <option value="Oficina">Oficina</option>
            <option value="Terreno">Terreno</option>
          </select>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="use">Uso</label>
          <select id="use" name="use">
            <option value="Habitacional">Habitacional</option>
            <option value="Comercial">Comercial</option>
            <option value="Mixto">Mixto</option>
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label htmlFor="state">Estado</label>
            <input type="text" id="state" name="state" placeholder="Estado de México" />
          </div>
          <div>
            <label htmlFor="municipality">Municipio</label>
            <input type="text" id="municipality" name="municipality" placeholder="Tecámac" />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label htmlFor="development">Desarrollo</label>
            <input type="text" id="development" name="development" placeholder="Real Granada Quinta Etapa" />
          </div>
          <div>
            <label htmlFor="privateArea">Privada</label>
            <input type="text" id="privateArea" name="privateArea" placeholder="Albas" />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label htmlFor="unitNumber">Número de unidad</label>
            <input type="text" id="unitNumber" name="unitNumber" placeholder="203" />
          </div>
          <div>
            <label htmlFor="parkingSpace">Estacionamiento</label>
            <input type="text" id="parkingSpace" name="parkingSpace" placeholder="203" />
          </div>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="areaM2">Área (m²)</label>
          <input type="number" id="areaM2" name="areaM2" step="0.01" placeholder="67.04" />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label htmlFor="notes">Notas</label>
          <textarea id="notes" name="notes" rows={3} placeholder="Notas adicionales..." />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Guardando...' : 'Crear propiedad'}
          </button>
          <Link href="/admin/propiedades" className="btn btn-secondary">
            Cancelar
          </Link>
        </div>
      </form>
    </>
  );
}
