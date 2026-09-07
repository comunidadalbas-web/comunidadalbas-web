'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface TenantForm {
  propertyId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  altPhone: string;
  idType: string;
  idNumber: string;
  emergencyName: string;
  emergencyPhone: string;
  notes: string;
}

export default function NuevoArrendatarioPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [properties, setProperties] = useState<Array<{ id: string; code: string; name: string }>>([]);

  const [form, setForm] = useState<TenantForm>({
    propertyId: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    altPhone: '',
    idType: '',
    idNumber: '',
    emergencyName: '',
    emergencyPhone: '',
    notes: '',
  });

  useEffect(() => {
    fetch('/api/admin/propiedades')
      .then((res) => res.json())
      .then((data) => setProperties(data))
      .catch(() => setError('Error al cargar propiedades'));
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      const res = await fetch('/api/admin/arrendatarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || 'Error al crear arrendatario');
      }

      const { id } = await res.json();
      router.push(`/admin/arrendatarios/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href="/admin/arrendatarios" style={{ fontSize: '0.9rem' }}>&larr; Volver a arrendatarios</Link>
      </div>

      <h1 className="page-title">Nuevo arrendatario</h1>
      <p className="page-subtitle">Registrar un nuevo arrendatario</p>

      {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      <form onSubmit={handleSubmit} className="card" style={{ padding: '1.5rem', maxWidth: '700px' }}>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="propertyId">Propiedad *</label>
          <select id="propertyId" name="propertyId" required>
            <option value="">Seleccionar propiedad</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>{p.code} · {p.name}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label htmlFor="firstName">Nombre *</label>
            <input type="text" id="firstName" name="firstName" required placeholder="Juan" />
          </div>
          <div>
            <label htmlFor="lastName">Apellido *</label>
            <input type="text" id="lastName" name="lastName" required placeholder="Pérez" />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label htmlFor="email">Email</label>
            <input type="email" id="email" name="email" placeholder="juan@ejemplo.com" />
          </div>
          <div>
            <label htmlFor="phone">Teléfono</label>
            <input type="tel" id="phone" name="phone" placeholder="55 1234 5678" />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label htmlFor="altPhone">Teléfono alternativo</label>
            <input type="tel" id="altPhone" name="altPhone" placeholder="55 8765 4321" />
          </div>
          <div>
            <label htmlFor="idType">Tipo de identificación</label>
            <input type="text" id="idType" name="idType" placeholder="INE, Pasaporte, etc." />
          </div>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="idNumber">Número de identificación</label>
          <input type="text" id="idNumber" name="idNumber" placeholder="Número de identificación" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label htmlFor="emergencyName">Contacto de emergencia</label>
            <input type="text" id="emergencyName" name="emergencyName" placeholder="Nombre del contacto" />
          </div>
          <div>
            <label htmlFor="emergencyPhone">Teléfono de emergencia</label>
            <input type="tel" id="emergencyPhone" name="emergencyPhone" placeholder="55 1111 2222" />
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label htmlFor="notes">Notas</label>
          <textarea id="notes" name="notes" rows={3} placeholder="Notas adicionales..." />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Guardando...' : 'Crear arrendatario'}
          </button>
          <Link href="/admin/arrendatarios" className="btn btn-secondary">
            Cancelar
          </Link>
        </div>
      </form>
    </>
  );
}