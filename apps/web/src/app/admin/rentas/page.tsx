'use client';

import { useState, useEffect } from 'react';

interface ListingItem {
  id: string;
  title: string;
  status: string;
  propertyCode: string;
  bedrooms: number;
  monthlyRent: number;
  createdAt: string;
}

function AdminRentasIndex() {
  const [listings, setListings] = useState<ListingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchListings = useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/admin/rentas', {
          credentials: 'include',
        });
        const data = await res.json();
        if (res.ok) {
          setListings(data);
        } else {
          setError(data.error || 'Error al cargar listados');
        }
      } catch (e) {
        setError('Error de red');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div>
      <h2>Administrar Listados</h2>
      <p>Total de listados: {listings.length}</p>
      {error && <div className="alert alert-error">Error: {error}</div>}
      <ul>
        {listings.map((listing) => (
          <li key={listing.id}>
            <strong>{listing.title}</strong> - {listing.propertyCode}
            <span style={{ color: 'var(--color-text-medium)' }}>
              ({listing.bedrooms} habitaciones, {listing.monthlyRent} MXN/mes)
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default AdminRentasIndex;