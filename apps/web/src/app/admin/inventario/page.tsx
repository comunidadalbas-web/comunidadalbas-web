import type { Metadata } from 'next';
import { prisma } from '@comunidad-albas/db';

export const metadata: Metadata = {
  title: 'Inventario',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function InventarioPage() {
  const items = await prisma.assetInventory.findMany({
    include: { property: true },
    orderBy: [{ property: { code: 'asc' } }, { name: 'asc' }],
  });

  const groupedByProperty = items.reduce((acc: any, item: any) => {
    const key = item.property.code;
    if (!acc[key]) acc[key] = { property: item.property, items: [] };
    acc[key].items.push(item);
    return acc;
  }, {} as Record<string, { property: typeof items[0]['property']; items: typeof items }>);

  return (
    <>
      <h1 className="page-title">Inventario</h1>
      <p className="page-subtitle">Inventario de activos por propiedad</p>

      {items.length === 0 ? (
        <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
          <p>No hay items en el inventario.</p>
        </div>
      ) : (
        Object.entries(groupedByProperty).map(([key, group]: [string, any]) => (
          <section key={key} className="info-section">
            <h2>{group.property.code} · {group.property.name}</h2>
            <div className="card-grid">
              {group.items.map((item: any) => (
                <div key={item.id} className="card">
                  <h3>{item.name}</h3>
                  {item.category && <p>Categoría: {item.category}</p>}
                  {item.quantity > 1 && <p>Cantidad: {item.quantity}</p>}
                  <p>Condición: {item.condition}</p>
                  {item.location && <p>Ubicación: {item.location}</p>}
                </div>
              ))}
            </div>
          </section>
        ))
      )}
    </>
  );
}
