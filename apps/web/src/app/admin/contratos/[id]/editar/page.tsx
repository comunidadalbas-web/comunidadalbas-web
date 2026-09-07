'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface LeaseForm {
  propertyId: string;
  unitId: string;
  tenantId: string;
  code: string;
  startDate: string;
  endDate: string;
  monthlyRent: string;
  depositAmount: string;
  paymentDay: string;
  guaranteeType: string;
  guaranteeAmount: string;
  petsAllowed: boolean;
  vehicles: string;
  notes: string;
}

export default function EditarContratoPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<Array<{ id: string; code: string; name: string }>>([]);
  const [tenants, setTenants] = useState<Array<{ id: string; firstName: string; lastName: string }>>([]);
  const [units, setUnits] = useState<Array<{ id: string; code: string; apartmentNumber: string }>>([]);

  const [form, setForm] = useState<LeaseForm>({
    propertyId: '',
    unitId: '',
    tenantId: '',
    code: '',
    startDate: '',
    endDate: '',
    monthlyRent: '',
    depositAmount: '0',
    paymentDay: '1',
    guaranteeType: '',
    guaranteeAmount: '',
    petsAllowed: false,
    vehicles: '',
    notes: '',
  });

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/propiedades').then((r) => r.json()),
      fetch('/api/admin/arrendatarios').then((r) => r.json()),
      fetch('/api/admin/units').then((r) => r.json()),
    ])
      .then(([props, tnts, unts]) => {
        setProperties(props);
        setTenants(tnts);
        setUnits(unts);
      })
      .catch(() => setError('Error al cargar datos'));

    fetch(`/api/admin/contratos/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Contrato no encontrado');
        return res.json();
      })
      .then((data) => {
        setForm({
          propertyId: data.propertyId ?? '',
          unitId: data.unitId ?? '',
          tenantId: data.tenantId ?? '',
          code: data.code ?? '',
          startDate: data.startDate ? data.startDate.slice(0, 10) : '',
          endDate: data.endDate ? data.endDate.slice(0, 10) : '',
          monthlyRent: data.monthlyRent.toString(),
          depositAmount: data.depositAmount.toString(),
          paymentDay: data.paymentDay.toString(),
          guaranteeType: data.guaranteeType ?? '',
          guaranteeAmount: data.guaranteeAmount?.toString() ?? '',
          petsAllowed: data.petsAllowed ?? false,
          vehicles: data.vehicles ?? '',
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

    // Convert types
    const submitData = {
      ...data,
      monthlyRent: Number(data.monthlyRent),
      depositAmount: Number(data.depositAmount),
      paymentDay: Number(data.paymentDay),
      guaranteeAmount: data.guaranteeAmount ? Number(data.guaranteeAmount) : undefined,
      petsAllowed: data.petsAllowed === 'on',
      startDate: new Date(data.startDate as string).toISOString(),
      endDate: new Date(data.endDate as string).toISOString(),
    };

    try {
      const res = await fetch(`/api/admin/contratos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || 'Error al actualizar');
      }

      router.push(`/admin/contratos/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <h1 className="page-title">Editar contrato</h1>
        <p className="page-subtitle">Cargando...</p>
      </div>
    );
  }

  return (
    <>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href={`/admin/contratos/${id}`} style={{ fontSize: '0.9rem' }}>&larr; Volver</Link>
      </div>

      <h1 className="page-title">Editar contrato</h1>
      <p className="page-subtitle">Actualizar datos del contrato de arrendamiento</p>

      {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      <form onSubmit={handleSubmit} className="card" style={{ padding: '1.5rem', maxWidth: '800px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label htmlFor="code">Código *</label>
            <input type="text" id="code" name="code" defaultValue={form.code} required />
          </div>
          <div>
            <label htmlFor="propertyId">Propiedad *</label>
            <select id="propertyId" name="propertyId" defaultValue={form.propertyId} required onChange={handleChange}>
              <option value="">Seleccionar propiedad</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>{p.code} · {p.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label htmlFor="tenantId">Arrendatario *</label>
            <select id="tenantId" name="tenantId" defaultValue={form.tenantId} required onChange={handleChange}>
              <option value="">Seleccionar arrendatario</option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="unitId">Unidad</label>
            <select id="unitId" name="unitId" defaultValue={form.unitId} onChange={handleChange as any}>
              <option value="">Seleccionar unidad</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>{u.code} (Depto {u.apartmentNumber})</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label htmlFor="startDate">Fecha de inicio *</label>
            <input type="date" id="startDate" name="startDate" defaultValue={form.startDate} required onChange={handleChange} />
          </div>
          <div>
            <label htmlFor="endDate">Fecha de fin *</label>
            <input type="date" id="endDate" name="endDate" defaultValue={form.endDate} required onChange={handleChange} />
          </div>
          <div>
            <label htmlFor="paymentDay">Día de pago *</label>
            <input type="number" id="paymentDay" name="paymentDay" min="1" max="28" defaultValue={form.paymentDay} required onChange={handleChange} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label htmlFor="monthlyRent">Renta mensual *</label>
            <input type="number" id="monthlyRent" name="monthlyRent" step="0.01" min="1" defaultValue={form.monthlyRent} required onChange={handleChange} />
          </div>
          <div>
            <label htmlFor="depositAmount">Depósito</label>
            <input type="number" id="depositAmount" name="depositAmount" step="0.01" min="0" defaultValue={form.depositAmount} onChange={handleChange} />
          </div>
          <div>
            <label htmlFor="guaranteeAmount">Monto garantía</label>
            <input type="number" id="guaranteeAmount" name="guaranteeAmount" step="0.01" min="0" defaultValue={form.guaranteeAmount} onChange={handleChange} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label htmlFor="guaranteeType">Tipo de garantía</label>
            <input type="text" id="guaranteeType" name="guaranteeType" defaultValue={form.guaranteeType} placeholder="Fiador, seguro, etc." onChange={handleChange} />
          </div>
          <div>
            <label htmlFor="vehicles">Vehículos</label>
            <input type="text" id="vehicles" name="vehicles" defaultValue={form.vehicles} placeholder="Placas, marca, modelo" onChange={handleChange} />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <label className="form-checkbox">
            <input type="checkbox" name="petsAllowed" defaultChecked={form.petsAllowed} onChange={handleChange} />
            <span>Mascotas permitidas</span>
          </label>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label htmlFor="notes">Notas</label>
          <textarea id="notes" name="notes" rows={3} defaultValue={form.notes} placeholder="Notas adicionales..." onChange={handleChange} />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
          <Link href={`/admin/contratos/${id}`} className="btn btn-secondary">
            Cancelar
          </Link>
        </div>
      </form>
    </>
  );
}