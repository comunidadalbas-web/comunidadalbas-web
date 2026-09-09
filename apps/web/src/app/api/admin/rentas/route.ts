import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@comunidad-albas/db';

export const dynamic = 'force-dynamic';

// GET /api/admin/rentas - List all rentals with pagination and filter
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as string | null;
    const propertyId = searchParams.get('propertyId') as string | null;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = {};

    if (status) {
      where.status = status;
    }
    if (propertyId) {
      where.propertyId = propertyId;
    }

    const skip = (page - 1) * limit;
    const take = limit;

    const [rentals, total] = await prisma.$transaction([
      prisma.listing.findMany({
        where,
        select: {
          id: true,
          title: true,
          status: true,
          property: {
            select: {
              code: true,
            },
          },
          bedrooms: true,
          monthlyRent: true,
          createdAt: true,
          ownerVerified: true,
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.listing.count({ where }),
    ]);

    return NextResponse.json({
      rentals,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('GET /api/admin/rentas error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST /api/admin/rentas - Create new listing (draft)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

const {
  title,
  description,
  monthlyRent,
  bedrooms,
  bathrooms,
  areaM2,
  propertyId,
  features,
  availableFrom,
  negotiable,
  parkingSpaces,
  contactEmail,
} = body;

    // Validation
    if (!title || !monthlyRent || !bedrooms || !propertyId) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios' },
        { status: 400 }
      );
    }

    const rental = await prisma.listing.create({
      data: {
        title,
        description,
        slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'listing',
        monthlyRent: monthlyRent,
        bedrooms,
        bathrooms: bathrooms || 1,
        parkingSpaces: parkingSpaces || 0,
        areaM2: areaM2 || null,
        propertyId,
        features,
        availableFrom: availableFrom || null,
        negotiable: negotiable !== false,
        contactEmail: contactEmail || 'admin@comunidadalbas.com.mx',
        status: 'DRAFT',
        ownerVerified: false,
      },
    });

    return NextResponse.json({
      success: true,
      rental,
      message: 'Listado creado como borrador',
    });
  } catch (error) {
    console.error('POST /api/admin/rentas error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}