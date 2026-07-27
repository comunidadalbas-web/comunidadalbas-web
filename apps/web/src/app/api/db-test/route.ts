export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { prisma } = await import('@/lib/db');
    await prisma.$connect();
    const count = await prisma.contactRequest.count();
    await prisma.$disconnect();
    return Response.json({ connected: true, contactRequests: count });
  } catch (err) {
    return Response.json(
      { connected: false, error: err instanceof Error ? err.message : String(err), stack: err instanceof Error ? err.stack : null },
      { status: 500 },
    );
  }
}
