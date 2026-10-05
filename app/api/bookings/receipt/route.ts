import { getBookingByReference } from '@/lib/mysql-store';
import { bookingReceiptPdf } from '@/lib/simple-pdf';
import { readServerSession } from '@/lib/server-auth';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const session = await readServerSession(request);
  if (!session) return Response.json({ error: 'Sign in to download receipts.' }, { status: 401 });
  const id = new URL(request.url).searchParams.get('id') || '';
  const booking = await getBookingByReference(id);
  if (!booking) return Response.json({ error: 'Booking not found.' }, { status: 404 });
  if (session.role !== 'admin' && session.email.toLowerCase() !== booking.email.toLowerCase()) return Response.json({ error: 'You can only download your own receipt.' }, { status: 403 });
  const pdf = bookingReceiptPdf(booking);
  return new Response(pdf, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${booking.id.replace(/[^a-z0-9-]/gi, '-')}-receipt.pdf"`,
      'Cache-Control': 'no-store',
    },
  });
}
