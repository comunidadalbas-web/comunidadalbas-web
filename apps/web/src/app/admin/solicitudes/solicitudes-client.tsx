'use client';

import { useState } from 'react';

type Status = 'NEW' | 'IN_REVIEW' | 'RESOLVED' | 'ARCHIVED';

interface Solicitud {
  id: string;
  folio: string | null;
  name: string;
  email: string;
  phone: string | null;
  building: string | null;
  apartment: string | null;
  category: string;
  message: string;
  status: Status;
  createdAt: string;
}

const STATUS_LABEL: Record<Status, string> = {
  NEW: 'Nueva',
  IN_REVIEW: 'En revisión',
  RESOLVED: 'Resuelta',
  ARCHIVED: 'Archivada',
};

const CATEGORY_LABEL: Record<string, string> = {
  general: 'General',
  administration: 'Administración',
  maintenance: 'Mantenimiento',
  security: 'Seguridad',
  suggestion: 'Sugerencia',
  other: 'Otro',
};

const STATUS_CLASS: Record<Status, string> = {
  NEW: 'badge badge-new',
  IN_REVIEW: 'badge badge-review',
  RESOLVED: 'badge badge-resolved',
  ARCHIVED: 'badge badge-archived',
};

export default function SolicitudesClient({
  items,
  total,
  csrfToken,
}: {
  items: Solicitud[];
  total: number;
  csrfToken: string;
}) {
  const [rows, setRows] = useState(items);
  const [updating, setUpdating] = useState(false);

  const changeStatus = async (id: string, status: Status) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/contact-requests/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'No se pudo actualizar');
      }
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al actualizar');
    } finally {
      setUpdating(false);
    }
  };

  if (total === 0) {
    return (
      <div className="alert alert-info">
        No hay solicitudes registradas todavía.
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="table-admin">
        <thead>
          <tr>
            <th>Folio</th>
            <th>Fecha</th>
            <th>Solicitante</th>
            <th>Unidad</th>
            <th>Categoría</th>
            <th>Mensaje</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td style={{ whiteSpace: 'nowrap', fontWeight: 600 }}>{r.folio || '—'}</td>
              <td style={{ whiteSpace: 'nowrap' }}>
                {new Date(r.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
              </td>
              <td>
                <strong>{r.name}</strong>
                <br />
                <span className="text-muted">{r.email}</span>
                {r.phone && (
                  <>
                    <br />
                    <span className="text-muted">{r.phone}</span>
                  </>
                )}
              </td>
              <td>
                {r.building || '—'} {r.apartment ? `/ ${r.apartment}` : ''}
              </td>
              <td>{CATEGORY_LABEL[r.category] || r.category}</td>
              <td style={{ maxWidth: '280px' }}>
                <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {r.message}
                </span>
              </td>
              <td>
                <span className={STATUS_CLASS[r.status]}>{STATUS_LABEL[r.status]}</span>
              </td>
              <td>
                {r.status === 'NEW' && (
                  <button className="btn btn-primary" disabled={updating} onClick={() => changeStatus(r.id, 'IN_REVIEW')}>
                    Tomar
                  </button>
                )}
                {r.status === 'IN_REVIEW' && (
                  <button className="btn btn-primary" disabled={updating} onClick={() => changeStatus(r.id, 'RESOLVED')}>
                    Resolver
                  </button>
                )}
                {r.status !== 'ARCHIVED' && r.status !== 'NEW' && r.status !== 'IN_REVIEW' && (
                  <button className="btn btn-ghost" disabled={updating} onClick={() => changeStatus(r.id, 'ARCHIVED')}>
                    Archivar
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
