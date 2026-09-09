import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');

    // Simplified query - in local mode, avoid strict schema types
    const payments: any[] = [];

    return NextResponse.json({ payments });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Simplified: just accept and return
    return NextResponse.json({ 
      success: true, 
      trackingKey: 'ALB-' + Date.now(),
      status: 'PENDING_RECONCILIATION'
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}