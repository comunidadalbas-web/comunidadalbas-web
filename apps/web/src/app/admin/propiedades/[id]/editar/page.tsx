'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface PropertyForm {
  code: string;
  name: string;
  type: string;
  state: string;
  municipality: string;
  development: string;
  privateArea: string;
  unitNumber: string;
  areaM2: string;
  parkingSpace: string;
  use: string;
  status: string;
  notes: string;
}

export default function EditarPropiedadPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState<PropertyForm>({
    code: '',
    name: '',
    type: 'Departamento',
    state: '',
    municipality: '',
    development: '',
    privateArea: '',
    unitNumber: '',
    areaM2: '',
    parkingSpace: '',
    use: 'Habitacional',
    status: 'ACTIVE',
    notes: '',
  });

  useEffect(() => {
    fetch(`/api/admin/propiedades/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Propiedad no encontrada');
        return res.json();
      })
      .then((data) => {
        setForm({
          code: data.code ?? '',
          name: data.name ?? '',
          type: data.type ?? 'Departamento',
          state: data.state ?? '',
          municipality: data.municipality ?? '',
          development: data.development ?? '',
          privateArea: data.privateArea ?? '',
          unitNumber: data.unitNumber ?? '',
          areaM2: data.areaM2?.toString() ?? '',
          parkingSpace: data.parkingSpace ?? '',
          use: data.use ?? 'Habitacional',
          status: data.status ?? 'ACTIVE',
          notes: data.notes ?? '',
        });
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    const submitData = {
      ...data,
      areaM2: data.areaM2 ? Number(data.areaM2) : undefined,
    };

    try {
      const res = await fetch(`/api/admin/propiedades/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || 'Error al actualizar');
      }

      router.push(`/admin/propiedades/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <h1 className="page-title">Editar propiedad</h1>
        <p className="page-subtitle">Cargando...</p>
      </div>
    );
  }

  return (
    <>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href={`/admin/propiedades/${id}`} style={{ fontSize: '0.9rem' }}>&larr; Volver</Link>
      </div>

      <h1 className="page-title">Editar propiedad</h1>
      <p className="page-subtitle">Actualizar datos del activo inmobiliario</p>

      {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      <form onSubmit={handleSubmit} className="card" style={{ padding: '1.5rem', maxWidth: '700px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label htmlFor="code">Código *</label>
            <input type="text" id="code" name="code" defaultValue={form.code} required />
          </div>
          <div>
            <label htmlFor="name">Nombre *</label>
            <input type="text" id="name" name="name" defaultValue={form.name} required />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label htmlFor="type">Tipo</label>
            <select id="type" name="type" defaultValue={form.type}>
              <option value="Departamento">Departamento</option>
              <option value="Casa">Casa</option>
              <option value="Local">Local comercial</option>
              <option value="Oficina">Oficina</option>
              <option value="Terreno">Terreno</option>
            </select>
          </div>
          <div>
            <label htmlFor="use">Uso</label>
            <select id="use" name="use" defaultValue={form.use}>
              <option value="Habitacional">Habitacional</option>
              <option value="Comercial">Comercial</option>
              <option value="Mixto">Mixto</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label htmlFor="state">Estado</label>
            <input type="text" id="state" name="state" defaultValue={form.state} placeholder="Estado de México" />
          </div>
          <div>
            <label htmlFor="municipality">Municipio</label>
            <input type="text" id="municipality" name="municipality" defaultValue={form.municipality} placeholder="Tecámac" />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label htmlFor="development">Desarrollo</label>
            <input type="text" id="development" name="development" defaultValue={form.development} placeholder="Real Granada Quinta Etapa" />
          </div>
          <div>
            <label htmlFor="privateArea">Privada</label>
            <input type="text" id="privateArea" name="privateArea" defaultValue={form.privateArea} placeholder="Albas" />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label htmlFor="unitNumber">Número de unidad</label>
            <input type="text" id="unitNumber" name="unitNumber" defaultValue={form.unitNumber} placeholder="203" />
          </div>
          <div>
            <label htmlFor="parkingSpace">Estacionamiento</label>
            <input type="text" id="parkingSpace" name="parkingSpace" defaultValue={form.parkingSpace} placeholder="203" />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label htmlFor="areaM2">Área (m²)</label>
            <input type="number" id="areaM2" name="areaM2" step="0.01" defaultValue={form.areaM2} placeholder="67.04" />
          </div>
          <div>
            <label htmlFor="status">Estado</label>
            <select id="status" name="status" defaultValue={form.status}>
              <option value="ACTIVE">Activo</option>
              <option value="ARCHIVED">Archivado</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label htmlFor="notes">Notas</label>
          <textarea id="notes" name="notes" rows={3} defaultValue={form.notes} placeholder="Notas adicionales..." />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
          <Link href={`/admin/propiedades/${id}`} className="btn btn-secondary">
            Cancelar
          </Link>
        </div>
      </form>
    </>
  );
}