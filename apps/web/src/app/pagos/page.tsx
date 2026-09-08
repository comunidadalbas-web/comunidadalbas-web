'use client';

import { useCallback, useEffect, useState } from 'react';

interface LeaseCharge {
  id: string;
  leaseId: string;
  concept: string;
  amount: number;
  period: string;
  dueDate?: string;
  status: string;
  payments: {
    id: string;
    amount: number;
    trackingKey: string;
    status: string;
    createdAt: string;
    originBank?: string;
    transferDate?: string;
    receiptDocumentId?: string;
  }[];
}

export default function PagosPage() {
  const [leaseCharge, setLeaseCharge] = useState<LeaseCharge | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLeaseCharge = useCallback(() => {
    void (async () => {
      try {
        const res = await fetch('/api/admin/cobranza', {
          method: 'GET',
          headers: {
            'Authorization': 'Bearer dummy-token',
          },
        });
        const data = await res.json();
        if (res.ok) {
          setLeaseCharge(data);
        } else {
          setError('Error al cargar');
        }
      } catch (e) {
        setError('Error de red');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => fetchLeaseCharge(), []);

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (!leaseCharge) {
    return <div>Sin datos de cobranza</div>;
  }

  return (
    <div>
      <h2>Cobranza: {leaseCharge.id}</h2>
      <p>Total: {leaseCharge.amount}</p>
      <p>Estados: {leaseCharge.status}</p>
    </div>
  );
}