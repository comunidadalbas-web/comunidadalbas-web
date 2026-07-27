export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json({
    status: 'ok',
    project: 'Comunidad Albas',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
  });
}
