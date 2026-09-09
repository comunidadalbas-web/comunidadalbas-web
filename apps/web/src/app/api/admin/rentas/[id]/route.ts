import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@comunidad-albas/db';

enum ListingStatus {
  DRAFT = 'DRAFT',
  PENDING_REVIEW = 'PENDING_REVIEW',
  PUBLISHED = 'PUBLISHED',
  RESERVED = 'RESERVED',
  RENTED = 'RENTED',
  ARCHIVED = 'ARCHIVED',
}

// Valid state transitions
const validTransitions: Record<string, string[]> = {
  [ListingStatus.DRAFT]: [ListingStatus.PENDING_REVIEW, ListingStatus.PUBLISHED],
  [ListingStatus.PENDING_REVIEW]: [ListingStatus.PUBLISHED, ListingStatus.ARCHIVED],
  [ListingStatus.PUBLISHED]: [ListingStatus.RESERVED, ListingStatus.RENTED, ListingStatus.ARCHIVED],
  [ListingStatus.RESERVED]: [ListingStatus.PUBLISHED, ListingStatus.RENTED, ListingStatus.ARCHIVED],
  [ListingStatus.RENTED]: [],
  [ListingStatus.ARCHIVED]: [],
};

type TransitionKeys = keyof typeof validTransitions;

function canTransition(from: string, to: string): boolean {
  const allowed = validTransitions[from as TransitionKeys];
  if (!allowed) return false;
  return allowed.includes(to);
}

interface StatusChangeBody {
  status: string;
}

// GET /api/admin/rentas/[id] - Get single rental detail
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const rental = await prisma.listing.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        status: true,
        property: {
          select: {
            code: true,
            name: true,
          },
        },
        monthlyRent: true,
        bedrooms: true,
        bathrooms: true,
        areaM2: true,
        description: true,
        features: true,
        availableFrom: true,
        negotiable: true,
        ownerVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!rental) {
      return NextResponse.json(
        { error: 'Listado no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ rental });
  } catch (error) {
    console.error('GET /api/admin/rentas/[id] error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST /api/admin/rentas/[id] - Update listing or change status
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { id } = await params;

    // Check if listing exists
    const existing = await prisma.listing.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Listado no encontrado' },
        { status: 404 }
      );
    }

    // If status change requested
    if (body.status) {
      const { status } = body;

      // Validate transition
      if (!canTransition(existing.status, status)) {
        return NextResponse.json(
          {
            error: `Transición inválida: ${existing.status} -> ${status}`,
            code: 'INVALID_TRANSITION',
          },
          { status: 409 }
        );
      }

      // Update status only
      const updated = await prisma.listing.update({
        where: { id },
        data: { status },
      });

      return NextResponse.json({
        success: true,
        rental: updated,
        message: `Estado actualizado a ${status}`,
      });
    }

    // Otherwise, allow general update
    const { status, ...rest } = body;

    const updated = await prisma.listing.update({
      where: { id },
      data: rest,
    });

    return NextResponse.json({
      success: true,
      rental: updated,
    });
  } catch (error) {
    console.error('POST /api/admin/rentas/[id] error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}