'use client';

import { useState } from 'react';
import {
  INSTITUTIONAL_ACCOUNTS,
  MAX_ADMIN_USERS,
} from '@/lib/users/institutional-accounts';

const ROLES = ['owner', 'gestor', 'contador', 'arrendatario'] as const;
type Role = (typeof ROLES)[number];

const ROLE_LABEL: Record<Role, string> = {
  owner: 'Propietario',
  gestor: 'Gestor',
  contador: 'Contador',
  arrendatario: 'Arrendatario',
};

interface Usuario {
  id: string;
  email: string;
  displayName: string;
  active: boolean;
  mustChangePassword: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  roles: string[];
}

interface Props {
  items: Usuario[];
  currentUserId: string;
  csrfToken: string;
}

const EMPTY_FORM = {
  email: '',
  displayName: '',
  password: '',
  roles: ['resident'] as Role[],
};

export default function UsersClient({ items, currentUserId, csrfToken }: Props) {
  const [rows, setRows] = useState(items);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Usuario | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditing(null);
    setShowForm(false);
    setError('');
  };

  const openNew = () => {
    resetForm();
    const existingEmails = new Set(rows.map((row) => row.email));
    const account = INSTITUTIONAL_ACCOUNTS.find((item) => !existingEmails.has(item.email));
    if (account) {
      setForm({
        email: account.email,
        displayName: account.displayName,
        password: '',
        roles: [...account.defaultRoles] as Role[],
      });
    }
    setShowForm(true);
  };

  const selectInstitutionalAccount = (email: string) => {
    const account = INSTITUTIONAL_ACCOUNTS.find((item) => item.email === email);
    if (!account) return;
    setForm((current) => ({
      ...current,
      email: account.email,
      displayName: account.displayName,
      roles: [...account.defaultRoles] as Role[],
    }));
  };

  const openEdit = (u: Usuario) => {
    setEditing(u);
    setForm({
      email: u.email,
      displayName: u.displayName,
      password: '',
      roles: u.roles.filter((r): r is Role => ROLES.includes(r as Role)),
    });
    setShowForm(true);
    setError('');
  };

  const toggleRole = (role: Role) => {
    setForm((f) => ({
      ...f,
      roles: f.roles.includes(role)
        ? f.roles.length > 1
          ? f.roles.filter((r) => r !== role)
          : f.roles
        : [...f.roles, role],
    }));
  };

  const save = async () => {
    if (!form.displayName.trim() || !form.email.trim()) {
      setError('El nombre y el correo son obligatorios');
      return;
    }
    if (!editing && form.password.length < 12) {
      setError('La contraseña debe tener al menos 12 caracteres');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const url = editing ? `/api/admin/users/${editing.id}` : '/api/admin/users';
      const payload = editing
        ? {
            displayName: form.displayName,
            roles: form.roles,
            mustChangePassword: form.password ? true : editing.mustChangePassword,
            ...(form.password ? { password: form.password } : {}),
          }
        : { ...form, email: form.email.trim().toLowerCase() };
      const res = await fetch(url, {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        const firstField = data.fieldErrors ? Object.values(data.fieldErrors).flat()[0] : null;
        throw new Error(firstField || data.error || 'No se pudo guardar');
      }
      const item = data.item;
      const built: Usuario = editing
        ? {
            ...rows.find((r) => r.id === editing.id)!,
            displayName: form.displayName,
            roles: form.roles,
          }
        : {
            id: item.id,
            email: item.email,
            displayName: form.displayName,
            active: true,
            mustChangePassword: true,
            lastLoginAt: null,
            createdAt: new Date().toISOString(),
            roles: form.roles,
          };
      setRows((prev) =>
        editing ? prev.map((r) => (r.id === editing.id ? built : r)) : [...prev, built],
      );
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  const patch = async (id: string, body: Record<string, unknown>) => {
    setBusyId(id);
    setError('');
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'No se pudo actualizar');
      }
      const item = data.item;
      setRows((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                active: item.active,
                mustChangePassword: item.mustChangePassword,
                displayName: item.displayName,
                roles: item.roles,
              }
            : r,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      setBusyId(null);
    }
  };

  const toggleActive = async (u: Usuario) => {
    if (!confirm(u.active ? `¿Desactivar a ${u.displayName}?` : `¿Reactivar a ${u.displayName}?`))
      return;
    await patch(u.id, { active: !u.active });
  };

  const remove = async (u: Usuario) => {
    if (!confirm(`¿Eliminar al usuario ${u.displayName}?`)) return;
    setBusyId(u.id);
    setError('');
    try {
      const res = await fetch(`/api/admin/users/${u.id}`, {
        method: 'DELETE',
        headers: { 'x-csrf-token': csrfToken },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'No se pudo eliminar');
      }
      setRows((prev) => prev.filter((r) => r.id !== u.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      {error && (
        <div className="alert alert-warning" style={{ marginBottom: '1rem' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="card" style={{ marginBottom: '1rem' }}>
        <strong>
          Cuentas autorizadas: {rows.length}/{MAX_ADMIN_USERS}
        </strong>
        <p style={{ margin: '0.5rem 0' }}>
          El panel admite únicamente las cinco cuentas institucionales. Toda cuenta nueva o
          contraseña restablecida exige cambio al iniciar sesión.
        </p>
        <ul style={{ margin: '0.5rem 0', paddingLeft: '1.25rem' }}>
          {INSTITUTIONAL_ACCOUNTS.map((account) => (
            <li key={account.email}>
              <strong>{account.displayName}</strong> — {account.email}: {account.responsibility}
            </li>
          ))}
        </ul>
      </div>

      <button
        className="btn btn-primary"
        onClick={openNew}
        disabled={rows.length >= MAX_ADMIN_USERS}
        style={{ marginBottom: '1rem' }}
      >
        {rows.length >= MAX_ADMIN_USERS ? 'Límite de 5 usuarios alcanzado' : '+ Nuevo usuario'}
      </button>

      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>
            {editing ? `Editar: ${editing.displayName}` : 'Nuevo usuario'}
          </h2>
          <div className="form-group">
            <label className="form-label">Nombre completo *</label>
            <input
              className="form-input"
              value={form.displayName}
              onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
              maxLength={120}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Correo electrónico *</label>
            {editing ? (
              <input className="form-input" type="email" value={form.email} disabled />
            ) : (
              <select
                className="form-input"
                value={form.email}
                onChange={(e) => selectInstitutionalAccount(e.target.value)}
              >
                {INSTITUTIONAL_ACCOUNTS.filter(
                  (account) => !rows.some((row) => row.email === account.email),
                ).map((account) => (
                  <option key={account.email} value={account.email}>
                    {account.displayName} — {account.email}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">
              {editing ? 'Nueva contraseña (dejar vacío para no cambiarla)' : 'Contraseña *'}
            </label>
            <input
              className="form-input"
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              maxLength={200}
              placeholder="Mínimo 12 caracteres"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Roles</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {ROLES.map((role) => (
                <label key={role} className="form-checkbox">
                  <input
                    type="checkbox"
                    checked={form.roles.includes(role)}
                    onChange={() => toggleRole(role)}
                  />
                  <span>{ROLE_LABEL[role]}</span>
                </label>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-primary" onClick={save} disabled={saving}>
              {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear usuario'}
            </button>
            <button className="btn btn-ghost" onClick={resetForm}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {rows.length === 0 ? (
        <div className="alert alert-info">No hay usuarios registrados.</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="table-admin">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Correo</th>
                <th>Roles</th>
                <th>Estado</th>
                <th>Último acceso</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u.id} style={u.active ? undefined : { opacity: 0.55 }}>
                  <td>
                    <strong>{u.displayName}</strong>
                    {u.id === currentUserId && (
                      <span className="badge badge-resolved" style={{ marginLeft: '0.5rem' }}>
                        tú
                      </span>
                    )}
                  </td>
                  <td>{u.email}</td>
                  <td>
                    {u.roles.map((r) => (
                      <span
                        key={r}
                        className="badge badge-review"
                        style={{ marginRight: '0.25rem' }}
                      >
                        {ROLE_LABEL[r as Role] || r}
                      </span>
                    ))}
                  </td>
                  <td>
                    <span className={u.active ? 'badge badge-resolved' : 'badge badge-archived'}>
                      {u.active ? 'Activo' : 'Inactivo'}
                    </span>
                    {u.mustChangePassword && (
                      <span className="badge badge-review" style={{ marginLeft: '0.25rem' }}>
                        Cambio de contraseña pendiente
                      </span>
                    )}
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('es-MX') : 'Nunca'}
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button
                      className="btn btn-ghost"
                      disabled={busyId === u.id}
                      onClick={() => openEdit(u)}
                    >
                      Editar
                    </button>{' '}
                    {u.id !== currentUserId && (
                      <>
                        <button
                          className="btn btn-ghost"
                          disabled={busyId === u.id}
                          onClick={() => toggleActive(u)}
                        >
                          {u.active ? 'Desactivar' : 'Reactivar'}
                        </button>{' '}
                        <button
                          className="btn btn-ghost"
                          disabled={busyId === u.id}
                          onClick={() => remove(u)}
                        >
                          Eliminar
                        </button>
                      </>
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
