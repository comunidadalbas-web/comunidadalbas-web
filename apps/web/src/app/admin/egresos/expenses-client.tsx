'use client';

import { useState } from 'react';
import { EXPENSE_STATUSES } from '@/lib/finance/validation';

type ExpenseStatus = (typeof EXPENSE_STATUSES)[number];
interface Expense {
  id: string;
  spentAt: string;
  category: string;
  provider: string;
  description: string;
  amount: number;
  fund: string;
  status: ExpenseStatus;
  evidenceUrl: string;
}
interface Props {
  items: Expense[];
  csrfToken: string;
}
const labels: Record<ExpenseStatus, string> = {
  REQUESTED: 'Solicitado',
  AUTHORIZED: 'Autorizado',
  PAID: 'Pagado',
  VERIFIED: 'Verificado',
  RECONCILED: 'Conciliado',
  REJECTED: 'Rechazado',
};
const transitions: Record<ExpenseStatus, ExpenseStatus[]> = {
  REQUESTED: ['AUTHORIZED', 'REJECTED'],
  AUTHORIZED: ['PAID', 'REJECTED'],
  PAID: ['VERIFIED'],
  VERIFIED: ['RECONCILED'],
  RECONCILED: [],
  REJECTED: [],
};
const blank = {
  spentAt: '',
  category: '',
  provider: '',
  description: '',
  amount: '',
  fund: 'Fondo general',
  status: 'REQUESTED' as ExpenseStatus,
  evidenceUrl: '',
};
const money = (value: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);

export default function ExpensesClient({ items, csrfToken }: Props) {
  const [rows, setRows] = useState(items);
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const reset = () => {
    setForm(blank);
    setEditing(null);
    setOpen(false);
    setError('');
  };
  const edit = (item: Expense) => {
    setEditing(item);
    setForm({ ...item, amount: String(item.amount) });
    setOpen(true);
    setError('');
  };
  const save = async () => {
    setError('');
    const response = await fetch(
      editing ? `/api/admin/expenses/${editing.id}` : '/api/admin/expenses',
      {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
        body: JSON.stringify({ ...form, amount: Number(form.amount) }),
      },
    );
    const data = await response.json();
    if (!response.ok) {
      setError((Object.values(data.fieldErrors ?? {}).flat()[0] as string) || data.error);
      return;
    }
    const item: Expense = {
      ...data.item,
      amount: Number(data.item.amount),
      spentAt: data.item.spentAt?.slice(0, 10) ?? '',
      provider: data.item.provider ?? '',
      evidenceUrl: data.item.evidenceUrl ?? '',
    };
    setRows((current) =>
      editing ? current.map((row) => (row.id === item.id ? item : row)) : [item, ...current],
    );
    reset();
  };
  const remove = async (item: Expense) => {
    if (!confirm(`¿Eliminar el egreso "${item.description}"?`)) return;
    const response = await fetch(`/api/admin/expenses/${item.id}`, {
      method: 'DELETE',
      headers: { 'x-csrf-token': csrfToken },
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error);
      return;
    }
    setRows((current) => current.filter((row) => row.id !== item.id));
  };
  return (
    <>
      {error && (
        <div className="alert alert-warning">
          <strong>Error:</strong> {error}
        </div>
      )}
      <button
        className="btn btn-primary"
        onClick={() => {
          reset();
          setOpen(true);
        }}
      >
        + Nuevo egreso
      </button>
      {open && (
        <div className="card" style={{ margin: '1rem 0' }}>
          <h2>{editing ? 'Editar egreso' : 'Registrar solicitud de egreso'}</h2>
          <div className="form-grid">
            <label className="form-group">
              <span className="form-label">Fecha</span>
              <input
                className="form-input"
                type="date"
                value={form.spentAt}
                onChange={(e) => setForm({ ...form, spentAt: e.target.value })}
              />
            </label>
            <label className="form-group">
              <span className="form-label">Categoría *</span>
              <input
                className="form-input"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
            </label>
            <label className="form-group">
              <span className="form-label">Proveedor</span>
              <input
                className="form-input"
                value={form.provider}
                onChange={(e) => setForm({ ...form, provider: e.target.value })}
              />
            </label>
            <label className="form-group">
              <span className="form-label">Monto *</span>
              <input
                className="form-input"
                type="number"
                min="0.01"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </label>
            <label className="form-group">
              <span className="form-label">Fondo *</span>
              <input
                className="form-input"
                value={form.fund}
                onChange={(e) => setForm({ ...form, fund: e.target.value })}
              />
            </label>
            {editing && (
              <label className="form-group">
                <span className="form-label">Estado</span>
                <select
                  className="form-select"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as ExpenseStatus })}
                >
                  <option value={editing.status}>{labels[editing.status]}</option>
                  {transitions[editing.status].map((status) => (
                    <option key={status} value={status}>
                      {labels[status]}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
          <label className="form-group">
            <span className="form-label">Concepto *</span>
            <textarea
              className="form-input"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </label>
          <label className="form-group">
            <span className="form-label">Comprobante HTTPS</span>
            <input
              className="form-input"
              type="url"
              value={form.evidenceUrl}
              onChange={(e) => setForm({ ...form, evidenceUrl: e.target.value })}
            />
          </label>
          <button className="btn btn-primary" onClick={save}>
            Guardar
          </button>{' '}
          <button className="btn btn-ghost" onClick={reset}>
            Cancelar
          </button>
        </div>
      )}
      {rows.length === 0 ? (
        <div className="alert alert-info" style={{ marginTop: '1rem' }}>
          No hay egresos registrados.
        </div>
      ) : (
        <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
          <table className="table-admin">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Concepto</th>
                <th>Proveedor</th>
                <th>Fondo</th>
                <th>Monto</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr key={item.id}>
                  <td>{item.spentAt || '—'}</td>
                  <td>
                    <strong>{item.description}</strong>
                    <br />
                    <small>{item.category}</small>
                  </td>
                  <td>{item.provider || '—'}</td>
                  <td>{item.fund}</td>
                  <td>{money(item.amount)}</td>
                  <td>
                    <span className="badge badge-review">{labels[item.status]}</span>
                  </td>
                  <td>
                    <button className="btn btn-ghost" onClick={() => edit(item)}>
                      Editar
                    </button>
                    {['REQUESTED', 'REJECTED'].includes(item.status) && (
                      <button className="btn btn-ghost" onClick={() => remove(item)}>
                        Eliminar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
