export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { prisma } = await import('@/lib/db');
    await prisma.$connect();
    const count = await prisma.contactRequest.count();
    await prisma.$disconnect();
    return Response.json({ connected: true, contactRequests: count });
  } catch (err) {
    const details: Record<string, unknown> = { connected: false, type: typeof err };
    if (err instanceof Error) {
      details.message = err.message;
      details.name = err.name;
      details.stack = err.stack?.split('\n').slice(0, 6).join('\n');
    } else {
      try { details.serialized = JSON.stringify(err); } catch { details.serialized = String(err); }
      if (typeof err === 'object' && err !== null) {
        for (const key of Object.keys(err as object)) {
          details[`err_${key}`] = String((err as Record<string, unknown>)[key]);
        }
      }
    }
    return Response.json(details, { status: 500 });
  }
}
