import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@comunidad-albas/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createListingSchema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(200),
  email: z.string().email('Email inválido').max(200),
  phone: z.string().max(50).optional(),
  privateArea: z.string().min(1, 'Privada requerida').max(100),
  propertyType: z.string().min(1, 'Tipo de inmueble requerido').max(100),
  monthlyRent: z.coerce.number().min(0, 'Renta inválida').max(100000),
  administrationIncluded: z.boolean().default(true),
  bedrooms: z.number().int().min(0, 'Recámaras inválidas').max(50),
  bathrooms: z.number().int().min(0, 'Baños inválidos').max(50),
  parkingSpaces: z.number().int().min(0, 'Estacionamientos inválidos').max(50),
  areaM2: z.coerce.number().min(0, 'Superficie inválida').max(1000),
  availableFrom: z.string().optional(),
  description: z.string().max(2000).optional(),
  features: z.string().max(2000).optional(),
  acceptPrivacy: z.boolean().refine(val => val === true, 'Debe aceptar'),
  acceptAuthorization: z.boolean().refine(val => val === true, 'Debe autorizar'),
});

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const parsed = createListingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
      { status: 400 },
    );
  }

  const data = {
    ...parsed.data,
    status: 'PENDING_REVIEW',
    ownerVerified: false,
    propertyId: null,
  };

  const listing = await prisma.listing.create({
    data: data as any,
  });

  return NextResponse.json({ success: true, id: listing.id }, { status: 201 });
}