import { getReportSnapshot } from '@/lib/mysql-store';
import { reportPdf } from '@/lib/simple-pdf';
import { requireAdmin } from '@/lib/server-auth';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  if (!(await requireAdmin(request))) return Response.json({ error: 'Admin sign-in required.' }, { status: 401 });
  try {
    const type = new URL(request.url).searchParams.get('type') || 'summary';
    const pdf = reportPdf(await getReportSnapshot(), type);
    return new Response(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="drift-${type.replace(/[^a-z0-9-]/gi, '-').toLowerCase()}-report.pdf"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Unable to generate PDF.' }, { status: 503 });
  }
}
