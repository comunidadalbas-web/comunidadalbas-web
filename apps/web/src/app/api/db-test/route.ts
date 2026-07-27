export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { prisma } = await import('@/lib/db');
    await prisma.$connect();
    const count = await prisma.contactRequest.count();
    await prisma.$disconnect();
    return Response.json({ connected: true, contactRequests: count });
  } catch (err) {
    const details = {
      message: err instanceof Error ? err.message : String(err),
      name: err instanceof Error ? err.name : typeof err,
      stack: err instanceof Error ? err.stack?.split('\n').slice(0, 5).join('\n') : null,
    };
    return Response.json({ connected: false, ...details }, { status: 500 });
  }
}
