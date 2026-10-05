import { rows } from '@/lib/mysql';
import { requireUser, failure } from '@/lib/server-auth';
export async function GET(request: Request) {
  try {
    await requireUser(request, true);
    const [revenue] = await rows<{ total: number }>(
      "SELECT COALESCE(SUM(amount),0) total FROM Payment WHERE is_demo=0 AND status='Paid'",
    );
    const monthly = await rows<{ month: string; total: number }>(
      "SELECT DATE_FORMAT(paid_at,'%Y-%m') month,SUM(amount) total FROM Payment WHERE is_demo=0 AND status='Paid' GROUP BY month",
    );
    return Response.json(
      {
        revenue: {
          total: revenue.total,
          monthly: Object.fromEntries(monthly.map((m) => [m.month, m.total])),
        },
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (e) {
    return failure(e);
  }
}
