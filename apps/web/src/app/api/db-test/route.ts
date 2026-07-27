export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { prisma } = await import('@/lib/db');
    await prisma.$connect();
    const count = await prisma.contactRequest.count();
    await prisma.$disconnect();
    return Response.json({ connected: true, contactRequests: count });
  } catch (err) {
    const details: Record<string, unknown> = { connected: false };
    if (err instanceof Error) {
      details.message = err.message;
      details.name = err.name;
      details.stack = err.stack?.split('\n').slice(0, 8).join('\n');
    }
    details.type = typeof err;
    details.isError = err instanceof Error;
    details.hasStack = err instanceof Error && !!err.stack;
    try {
      const json = JSON.stringify(err, Object.getOwnPropertyNames(err));
      details.serialized = json;
    } catch { details.serialized = String(err); }
    if (typeof err === 'object' && err !== null) {
      const keys = [...Object.keys(err as object), ...Object.getOwnPropertyNames(err)];
      for (const key of [...new Set(keys)]) {
        const val = (err as Record<string, unknown>)[key];
        details[`k_${key}`] = typeof val === 'string' ? val.substring(0, 500) : JSON.stringify(val);
      }
    }
    return Response.json(details, { status: 500 });
  }
}
