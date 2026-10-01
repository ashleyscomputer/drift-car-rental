import { rows, transaction } from '@/lib/mysql';
import { requireUser, failure, HttpError } from '@/lib/server-auth';
import {
  customerPdf,
  type CustomerBookingDocument,
  type CustomerExtraDocument,
} from '@/lib/customer-pdf';
export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    const reference = new URL(request.url).searchParams.get('booking');
    if (reference !== null && !/^BK-[0-9a-f-]{36}$/i.test(reference))
      throw new HttpError(400, 'Invalid booking reference.');
    const data = await transaction(async (c) => {
      const bookings = await rows<CustomerBookingDocument>(
        `SELECT b.booking_id,b.booking_reference reference,b.customer_name customer,b.customer_email email,b.vehicle_name_snapshot vehicle,b.start_date,b.end_date,b.rental_days days,b.daily_rate_applied rate,b.rental_subtotal subtotal,b.extras_total,b.total_cost total,b.status,CONCAT(pb.branch_name,' - ',pc.city_name) pickup,CONCAT(rb.branch_name,' - ',rc.city_name) return_branch,(SELECT p.status FROM Payment p WHERE p.booking_id=b.booking_id ORDER BY p.payment_id DESC LIMIT 1) payment_status,(SELECT COALESCE(SUM(p.amount),0) FROM Payment p WHERE p.booking_id=b.booking_id AND p.is_demo=0 AND p.status='Paid') collected FROM Booking b JOIN Branch pb ON pb.branch_id=b.pickup_branch_id JOIN City pc ON pc.city_id=pb.city_id JOIN Branch rb ON rb.branch_id=b.return_branch_id JOIN City rc ON rc.city_id=rb.city_id WHERE b.customer_id=? ${reference ? 'AND b.booking_reference=?' : ''} ORDER BY b.created_at DESC,b.booking_id DESC`,
        reference ? [user.customerId, reference] : [user.customerId],
        c,
      );
      if (reference && !bookings.length)
        throw new HttpError(404, 'Booking not found.');
      const extras = reference
        ? await rows<CustomerExtraDocument>(
            'SELECT booking_id,extra_name_snapshot name,quantity,charged_days,pricing_type,unit_price,line_total FROM BookingExtra WHERE booking_id=? ORDER BY booking_extra_id',
            [bookings[0].booking_id],
            c,
          )
        : [];
      return { bookings, extras };
    });
    const bytes = await customerPdf(
      user.name,
      data.bookings,
      data.extras,
      Boolean(reference),
    );
    return new Response(new Uint8Array(bytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="drift-${reference ? 'receipt-' + reference : 'my-bookings'}.pdf"`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    return failure(error);
  }
}
