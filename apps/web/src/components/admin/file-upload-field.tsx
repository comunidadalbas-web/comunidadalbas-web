'use client';

import { upload } from '@vercel/blob/client';
import { useRef, useState } from 'react';

type UploadKind = 'image' | 'document';

interface UploadedFile {
  url: string;
  pathname: string;
  contentType: string;
  sha256?: string;
}

interface Props {
  kind: UploadKind;
  label: string;
  value: string;
  csrfToken: string;
  onUploaded: (file: UploadedFile) => void;
  help?: string;
}

const LIMITS: Record<UploadKind, number> = {
  image: 8 * 1024 * 1024,
  document: 25 * 1024 * 1024,
};

function safeFilename(name: string): string {
  const dot = name.lastIndexOf('.');
  const extension = dot >= 0 ? name.slice(dot).toLowerCase() : '';
  const basename = (dot >= 0 ? name.slice(0, dot) : name)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'archivo';
  return `${basename}${extension}`;
}

async function sha256(file: File): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export default function FileUploadField({ kind, label, value, csrfToken, onUploaded, help }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const accept = kind === 'image' ? 'image/jpeg,image/png,image/webp' : 'application/pdf';

  const handleUpload = async () => {
    const file = inputRef.current?.files?.[0];
    if (!file) {
      setError('Selecciona un archivo antes de cargarlo.');
      return;
    }
    if (file.size > LIMITS[kind]) {
      setError(kind === 'image' ? 'La imagen no debe superar 8 MB.' : 'El PDF no debe superar 25 MB.');
      return;
    }

    setUploading(true);
    setError('');
    try {
      const folder = kind === 'image' ? 'images' : 'documents';
      const pathname = `media/${folder}/${Date.now()}-${safeFilename(file.name)}`;
      const blob = await upload(pathname, file, {
        access: 'public',
        handleUploadUrl: '/api/admin/uploads',
        clientPayload: JSON.stringify({ kind }),
        headers: { 'x-csrf-token': csrfToken },
        contentType: file.type,
      });
      onUploaded({
        url: blob.url,
        pathname: blob.pathname,
        contentType: blob.contentType,
        ...(kind === 'document' ? { sha256: await sha256(file) } : {}),
      });
      if (inputRef.current) inputRef.current.value = '';
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo cargar el archivo.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="form-group">
      <span className="form-label">{label}</span>
      <div className="upload-field">
        <input
          ref={inputRef}
          className="form-input"
          type="file"
          accept={accept}
          aria-label={label}
          disabled={uploading}
        />
        <button className="btn btn-ghost" type="button" onClick={handleUpload} disabled={uploading}>
          {uploading ? 'Cargando…' : 'Cargar archivo'}
        </button>
      </div>
      <small className="form-help">
        {help ??
          (kind === 'image'
            ? 'JPG, PNG o WebP, máximo 8 MB. La imagen no aparece en el sitio hasta guardar y publicar.'
            : 'PDF, máximo 25 MB. La URL y la huella SHA-256 se completan automáticamente.')}
      </small>
      {error && <div className="alert alert-warning upload-error">{error}</div>}
      {kind === 'image' && value && (
        <img className="upload-preview" src={value} alt="Vista previa del archivo cargado" />
      )}
    </div>
  );
}
