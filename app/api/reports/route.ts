import { getReportSnapshot } from '@/lib/mysql-store';
import { requireAdmin } from '@/lib/server-auth';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  if (!(await requireAdmin(request))) return Response.json({ error: 'Admin sign-in required.' }, { status: 401 });
  try {
    return Response.json(await getReportSnapshot());
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Unable to generate reports.' }, { status: 503 });
  }
}
