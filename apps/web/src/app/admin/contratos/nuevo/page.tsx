'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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

export default function NuevoContratoPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
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
  }, []);

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
      monthlyRent: Number(data.monthlyRent),
      depositAmount: Number(data.depositAmount),
      paymentDay: Number(data.paymentDay),
      guaranteeAmount: data.guaranteeAmount ? Number(data.guaranteeAmount) : undefined,
      petsAllowed: data.petsAllowed === 'on',
      startDate: new Date(data.startDate as string).toISOString(),
      endDate: new Date(data.endDate as string).toISOString(),
    };

    try {
      const res = await fetch('/api/admin/contratos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || 'Error al crear contrato');
      }

      const { id } = await res.json();
      router.push(`/admin/contratos/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href="/admin/contratos" style={{ fontSize: '0.9rem' }}>&larr; Volver a contratos</Link>
      </div>

      <h1 className="page-title">Nuevo contrato</h1>
      <p className="page-subtitle">Registrar un nuevo contrato de arrendamiento</p>

      {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

      <form onSubmit={handleSubmit} className="card" style={{ padding: '1.5rem', maxWidth: '800px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label htmlFor="code">Código *</label>
            <input type="text" id="code" name="code" required placeholder="ALBAS-203-001" />
          </div>
          <div>
            <label htmlFor="propertyId">Propiedad *</label>
            <select id="propertyId" name="propertyId" required>
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
            <select id="tenantId" name="tenantId" required>
              <option value="">Seleccionar arrendatario</option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="unitId">Unidad</label>
            <select id="unitId" name="unitId">
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
            <input type="date" id="startDate" name="startDate" required />
          </div>
          <div>
            <label htmlFor="endDate">Fecha de fin *</label>
            <input type="date" id="endDate" name="endDate" required />
          </div>
          <div>
            <label htmlFor="paymentDay">Día de pago *</label>
            <input type="number" id="paymentDay" name="paymentDay" min="1" max="28" defaultValue="1" required />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label htmlFor="monthlyRent">Renta mensual *</label>
            <input type="number" id="monthlyRent" name="monthlyRent" step="0.01" min="1" required placeholder="8500" />
          </div>
          <div>
            <label htmlFor="depositAmount">Depósito</label>
            <input type="number" id="depositAmount" name="depositAmount" step="0.01" min="0" defaultValue="0" />
          </div>
          <div>
            <label htmlFor="guaranteeAmount">Monto garantía</label>
            <input type="number" id="guaranteeAmount" name="guaranteeAmount" step="0.01" min="0" />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label htmlFor="guaranteeType">Tipo de garantía</label>
            <input type="text" id="guaranteeType" name="guaranteeType" placeholder="Fiador, seguro, etc." />
          </div>
          <div>
            <label htmlFor="vehicles">Vehículos</label>
            <input type="text" id="vehicles" name="vehicles" placeholder="Placas, marca, modelo" />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <label className="form-checkbox">
            <input type="checkbox" name="petsAllowed" />
            <span>Mascotas permitidas</span>
          </label>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label htmlFor="notes">Notas</label>
          <textarea id="notes" name="notes" rows={3} placeholder="Notas adicionales..." />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Guardando...' : 'Crear contrato'}
          </button>
          <Link href="/admin/contratos" className="btn btn-secondary">
            Cancelar
          </Link>
        </div>
      </form>
    </>
  );
}