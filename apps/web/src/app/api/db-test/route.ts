export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { prisma } = await import('@/lib/db');
    const count = await prisma.contactRequest.count();
    const last = await prisma.contactRequest.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { id: true, email: true, notifiedAt: true, createdAt: true },
    });
    return Response.json({ connected: true, contactRequests: count, last });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json({ connected: false, error: msg }, { status: 500 });
  }
}
