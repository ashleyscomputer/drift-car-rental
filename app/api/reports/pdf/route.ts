import { rows, transaction } from '@/lib/mysql';
import { requireUser, failure, HttpError } from '@/lib/server-auth';
import {
  createReportPdf,
  reportTitles,
  type ReportKind,
  type ReportData,
} from '@/lib/report-pdf';

export async function GET(request: Request) {
  try {
    await requireUser(request, true);
    const kind = new URL(request.url).searchParams.get('kind') || 'summary';
    if (!Object.hasOwn(reportTitles, kind))
      throw new HttpError(400, 'Unknown report type.');
    const data = await transaction(async (connection): Promise<ReportData> => {
      const bookings = await rows<ReportData['bookings'][number]>(
        'SELECT status,COUNT(*) count,COALESCE(SUM(total_cost),0) value FROM Booking GROUP BY status ORDER BY status',
        [],
        connection,
      );
      const fleet = await rows<ReportData['fleet'][number]>(
        'SELECT status,COUNT(*) count FROM Vehicle WHERE is_active=1 GROUP BY status ORDER BY status',
        [],
        connection,
      );
      const [revenue] = await rows<{ total: number }>(
        "SELECT COALESCE(SUM(amount),0) total FROM Payment WHERE is_demo=0 AND status='Paid'",
        [],
        connection,
      );
      const topVehicles = await rows<ReportData['topVehicles'][number]>(
        'SELECT v.vehicle_id,v.registration_no registration,COUNT(*) count,SUM(b.total_cost) value FROM Booking b JOIN Vehicle v ON v.vehicle_id=b.vehicle_id GROUP BY v.vehicle_id,v.registration_no ORDER BY count DESC,v.vehicle_id LIMIT 10',
        [],
        connection,
      );
      return {
        generatedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
        bookings,
        fleet,
        revenue: revenue.total,
        topVehicles,
      };
    });
    const bytes = await createReportPdf(kind as ReportKind, data);
    return new Response(new Uint8Array(bytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="drift-${kind}-${new Date().toISOString().slice(0, 10)}.pdf"`,
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    return failure(error);
  }
}
