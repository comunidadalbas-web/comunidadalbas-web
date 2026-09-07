'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface TenantData {
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

export default function EditarArrendatarioPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [tenant, setTenant] = useState<TenantData>({
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
    fetch(`/api/admin/arrendatarios/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Arrendatario no encontrado');
        return res.json();
      })
      .then((data) => {
        setTenant({
          firstName: data.firstName ?? '',
          lastName: data.lastName ?? '',
          email: data.email ?? '',
          phone: data.phone ?? '',
          altPhone: data.altPhone ?? '',
          idType: data.idType ?? '',
          idNumber: data.idNumber ?? '',
          emergencyName: data.emergencyName ?? '',
          emergencyPhone: data.emergencyPhone ?? '',
          notes: data.notes ?? '',
        });
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const form = new FormData(e.currentTarget);
    const data = Object.fromEntries(form.entries());

    try {
      const res = await fetch(`/api/admin/arrendatarios/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || 'Error al actualizar');
      }

      router.push(`/admin/arrendatarios/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <h1 className="page-title">Editar arrendatario</h1>
        <p className="page-subtitle">Cargando...</p>
      </div>
    );
  }

  return (
    <>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href={`/admin/arrendatarios/${id}`} style={{ fontSize: '0.9rem' }}>&larr; Volver</Link>
      </div>

      <h1 className="page-title">Editar arrendatario</h1>
      <p className="page-subtitle">Actualizar datos del arrendatario</p>

      {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      <form onSubmit={handleSubmit} className="card" style={{ padding: '1.5rem', maxWidth: '700px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label htmlFor="firstName">Nombre *</label>
            <input type="text" id="firstName" name="firstName" defaultValue={tenant.firstName} required />
          </div>
          <div>
            <label htmlFor="lastName">Apellido *</label>
            <input type="text" id="lastName" name="lastName" defaultValue={tenant.lastName} required />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label htmlFor="email">Email</label>
            <input type="email" id="email" name="email" defaultValue={tenant.email} />
          </div>
          <div>
            <label htmlFor="phone">Teléfono</label>
            <input type="tel" id="phone" name="phone" defaultValue={tenant.phone} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label htmlFor="altPhone">Teléfono alternativo</label>
            <input type="tel" id="altPhone" name="altPhone" defaultValue={tenant.altPhone} />
          </div>
          <div>
            <label htmlFor="idType">Tipo de identificación</label>
            <input type="text" id="idType" name="idType" defaultValue={tenant.idType} placeholder="INE, Pasaporte, etc." />
          </div>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="idNumber">Número de identificación</label>
          <input type="text" id="idNumber" name="idNumber" defaultValue={tenant.idNumber} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label htmlFor="emergencyName">Contacto de emergencia</label>
            <input type="text" id="emergencyName" name="emergencyName" defaultValue={tenant.emergencyName} />
          </div>
          <div>
            <label htmlFor="emergencyPhone">Teléfono de emergencia</label>
            <input type="tel" id="emergencyPhone" name="emergencyPhone" defaultValue={tenant.emergencyPhone} />
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label htmlFor="notes">Notas</label>
          <textarea id="notes" name="notes" rows={3} defaultValue={tenant.notes} placeholder="Notas adicionales..." />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
          <Link href={`/admin/arrendatarios/${id}`} className="btn btn-secondary">
            Cancelar
          </Link>
        </div>
      </form>
    </>
  );
}