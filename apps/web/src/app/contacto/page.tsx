'use client';

import type { Metadata } from 'next';
import { useState, useRef, FormEvent } from 'react';

// export const metadata: Metadata = {
//   title: 'Contacto',
// };
// Note: metadata export is not supported in client components.
// The layout's template will apply the title via the head.

const CATEGORIES = [
  { value: 'general', label: 'Consulta general' },
  { value: 'administration', label: 'Administración' },
  { value: 'maintenance', label: 'Mantenimiento' },
  { value: 'security', label: 'Seguridad' },
  { value: 'suggestion', label: 'Sugerencia' },
  { value: 'other', label: 'Otro' },
];

type FormErrors = Record<string, string>;

export default function ContactoPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    building: '',
    apartment: '',
    category: '',
    message: '',
    privacyAccepted: false,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [serverError, setServerError] = useState('');
  const honeypotRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e as React.ChangeEvent<HTMLInputElement>).target.checked : undefined;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const errs: FormErrors = {};
    if (!formData.name.trim()) errs.name = 'El nombre es obligatorio';
    if (!formData.email.trim()) errs.email = 'El correo es obligatorio';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errs.email = 'Correo inválido';
    if (formData.phone && !/^[\d\s\-+()]{7,20}$/.test(formData.phone)) errs.phone = 'Teléfono inválido';
    if (!formData.category) errs.category = 'Selecciona una categoría';
    if (!formData.message.trim()) errs.message = 'El mensaje es obligatorio';
    else if (formData.message.length > 2000) errs.message = 'El mensaje no puede exceder 2000 caracteres';
    if (!formData.privacyAccepted) errs.privacyAccepted = 'Debes aceptar el aviso de privacidad';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (honeypotRef.current?.value) return; // honeypot triggered

    if (!validate()) return;
    setStatus('sending');
    setServerError('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al enviar el mensaje');
      }
      setStatus('success');
      setFormData({
        name: '',
        email: '',
        phone: '',
        building: '',
        apartment: '',
        category: '',
        message: '',
        privacyAccepted: false,
      });
    } catch (err) {
      setStatus('error');
      setServerError(err instanceof Error ? err.message : 'Error de conexión');
    }
  };

  if (status === 'success') {
    return (
      <>
        <h1 className="page-title">Contacto</h1>
        <div className="alert alert-success">
          <strong>Mensaje enviado correctamente.</strong> Te responderemos a la brevedad.
        </div>
        <p>
          <a href="/" className="btn btn-primary">Volver al inicio</a>
        </p>
      </>
    );
  }

  return (
    <>
      <h1 className="page-title">Contacto</h1>
      <p className="page-subtitle">
        Comunícate con la administración de Privada Albas
      </p>

      {status === 'error' && (
        <div className="alert alert-warning">
          <strong>Error:</strong> {serverError || 'No se pudo enviar el mensaje. Intenta de nuevo.'}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card" style={{ maxWidth: '650px' }}>
        {/* Honeypot */}
        <div style={{ position: 'absolute', left: '-9999px' }} aria-hidden="true">
          <input ref={honeypotRef} type="text" name="website" tabIndex={-1} autoComplete="off" />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="name">Nombre completo *</label>
          <input
            id="name"
            name="name"
            className="form-input"
            value={formData.name}
            onChange={handleChange}
            maxLength={200}
            required
          />
          {errors.name && <p className="form-error">{errors.name}</p>}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="email">Correo electrónico *</label>
          <input
            id="email"
            name="email"
            type="email"
            className="form-input"
            value={formData.email}
            onChange={handleChange}
            maxLength={254}
            required
          />
          {errors.email && <p className="form-error">{errors.email}</p>}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="phone">Teléfono (opcional)</label>
          <input
            id="phone"
            name="phone"
            type="tel"
            className="form-input"
            value={formData.phone}
            onChange={handleChange}
            maxLength={20}
          />
          {errors.phone && <p className="form-error">{errors.phone}</p>}
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label" htmlFor="building">Edificio (opcional)</label>
            <input
              id="building"
              name="building"
              className="form-input"
              value={formData.building}
              onChange={handleChange}
              maxLength={50}
              placeholder="Ej: B01"
            />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label" htmlFor="apartment">Departamento (opcional)</label>
            <input
              id="apartment"
              name="apartment"
              className="form-input"
              value={formData.apartment}
              onChange={handleChange}
              maxLength={50}
              placeholder="Ej: D01"
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="category">Categoría *</label>
          <select
            id="category"
            name="category"
            className="form-select"
            value={formData.category}
            onChange={handleChange}
            required
          >
            <option value="">Selecciona una categoría</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          {errors.category && <p className="form-error">{errors.category}</p>}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="message">Mensaje *</label>
          <textarea
            id="message"
            name="message"
            className="form-textarea"
            value={formData.message}
            onChange={handleChange}
            maxLength={2000}
            required
          />
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', textAlign: 'right' }}>
            {formData.message.length}/2000
          </p>
          {errors.message && <p className="form-error">{errors.message}</p>}
        </div>

        <div className="form-group">
          <label className="form-checkbox">
            <input
              type="checkbox"
              name="privacyAccepted"
              checked={formData.privacyAccepted}
              onChange={handleChange}
              required
            />
            <span>
              He leído y acepto el{' '}
              <a href="/privacidad" target="_blank">aviso de privacidad</a> *
            </span>
          </label>
          {errors.privacyAccepted && <p className="form-error">{errors.privacyAccepted}</p>}
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          disabled={status === 'sending'}
        >
          {status === 'sending' ? 'Enviando...' : 'Enviar mensaje'}
        </button>
      </form>
    </>
  );
}
