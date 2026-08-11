'use client';

import { useRef, useState } from 'react';
import { DOCUMENT_MAX_BYTES, DOCUMENT_RECOMMENDED_BYTES, formatFileSize } from '@/lib/documents';

interface UploadedDocument {
  url: string;
  key: string;
  size: number;
  sha256: string;
  storageProvider: 'R2';
}

interface Props {
  csrfToken: string;
  onUploaded: (file: UploadedDocument) => void;
}

async function sha256(file: File) {
  const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export default function DocumentUploadField({ csrfToken, onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');

  const upload = async () => {
    const file = inputRef.current?.files?.[0];
    if (!file) return setError('Selecciona un PDF antes de cargarlo.');
    if (file.type !== 'application/pdf' || !file.name.toLowerCase().endsWith('.pdf'))
      return setError('Sólo se permiten archivos PDF.');
    if (file.size > DOCUMENT_MAX_BYTES)
      return setError(`El PDF no debe superar ${formatFileSize(DOCUMENT_MAX_BYTES)}.`);

    setUploading(true);
    setError('');
    setWarning(
      file.size > DOCUMENT_RECOMMENDED_BYTES
        ? 'El archivo supera 10 MB. Considera optimizar el escaneo antes de publicarlo.'
        : '',
    );
    try {
      const hash = await sha256(file);
      const authorize = await fetch('/api/admin/document-uploads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
        body: JSON.stringify({
          action: 'authorize',
          filename: file.name,
          size: file.size,
          contentType: file.type,
        }),
      });
      const authorization = await authorize.json();
      if (!authorize.ok) throw new Error(authorization.error);

      const put = await fetch(authorization.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/pdf' },
        body: file,
      });
      if (!put.ok)
        throw new Error('Cloudflare R2 rechazó la transferencia. Revisa el CORS del bucket.');

      const complete = await fetch('/api/admin/document-uploads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
        body: JSON.stringify({
          action: 'complete',
          key: authorization.key,
          size: file.size,
          sha256: hash,
          completionToken: authorization.completionToken,
        }),
      });
      const result = await complete.json();
      if (!complete.ok) throw new Error(result.error);
      onUploaded(result as UploadedDocument);
      if (inputRef.current) inputRef.current.value = '';
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo cargar el documento.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="form-group">
      <span className="form-label">Cargar PDF en almacenamiento documental</span>
      <div className="upload-field">
        <input
          ref={inputRef}
          className="form-input"
          type="file"
          accept="application/pdf"
          disabled={uploading}
        />
        <button className="btn btn-ghost" type="button" onClick={upload} disabled={uploading}>
          {uploading ? 'Verificando y cargando…' : 'Cargar PDF'}
        </button>
      </div>
      <small className="form-help">
        PDF, máximo 20 MB; se recomienda no exceder 10 MB. La carga calcula SHA-256 y no publica el
        registro automáticamente.
      </small>
      {warning && <div className="alert alert-info">{warning}</div>}
      {error && <div className="alert alert-warning upload-error">{error}</div>}
    </div>
  );
}
