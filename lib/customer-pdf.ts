import { pdfLayout, pdfMoney as money } from './pdf-layout';
export type CustomerBookingDocument = {
  booking_id: number;
  reference: string;
  customer: string;
  email: string;
  vehicle: string;
  start_date: string;
  end_date: string;
  days: number;
  rate: number;
  subtotal: number;
  extras_total: number;
  total: number;
  status: string;
  pickup: string;
  return_branch: string;
  payment_status: string | null;
  collected: number;
};
export type CustomerExtraDocument = {
  booking_id: number;
  name: string;
  quantity: number;
  charged_days: number;
  pricing_type: string;
  unit_price: number;
  line_total: number;
};
export async function customerPdf(
  name: string,
  bookings: CustomerBookingDocument[],
  extras: CustomerExtraDocument[],
  receipt: boolean,
) {
  const title = receipt ? 'Booking receipt' : 'My booking report';
  const { line, space, ensureRoom, save } = await pdfLayout(title);
  line('DRIFT / CUSTOMER DOCUMENTS', 10, true);
  space(14);
  line(title, 26, true);
  line(
    'Generated: ' +
      new Date().toISOString().replace('T', ' ').slice(0, 19) +
      ' UTC',
    9,
  );
  line('Account: ' + name);
  space(8);
  if (!receipt) {
    line(`Reservations: ${bookings.length}`, 13, true);
    line(
      'All-time booking value: ' +
        money(bookings.reduce((n, b) => n + Number(b.total), 0)),
    );
    line(
      'Includes completed and cancelled reservations. This is not collected revenue.',
      9,
    );
  }
  if (!bookings.length) line('No bookings recorded yet.');
  for (const b of bookings) {
    ensureRoom(230);
    space(14);
    line(b.vehicle, 16, true);
    line('Booking reference: ' + b.reference, 10);
    line('Booking status: ' + b.status);
    if (receipt) {
      line('Customer: ' + b.customer);
      line('Email: ' + b.email);
    }
    line(`Rental dates: ${b.start_date} to ${b.end_date}`);
    line('Pickup: ' + b.pickup);
    line('Return: ' + b.return_branch);
    if (receipt) {
      line(
        `Rental: ${b.days} day(s) x ${money(b.rate)} = ${money(b.subtotal)}`,
      );
      const selected = extras.filter((e) => e.booking_id === b.booking_id);
      if (selected.length) {
        line('Extras', 12, true);
        for (const e of selected)
          line(
            `${e.name}: ${e.quantity} x ${money(e.unit_price)}${e.pricing_type === 'daily' ? ` x ${e.charged_days} day(s)` : ''} = ${money(e.line_total)}`,
            10,
          );
      } else line('Extras: None');
    }
    line('Booking total: ' + money(b.total), 13, true);
    line(
      'Payment status: ' +
        (b.payment_status === 'DemoApproved'
          ? 'Approved - no charge'
          : b.payment_status || 'No payment recorded'),
    );
    line('Collected payments: ' + money(b.collected));
    if (b.payment_status === 'DemoApproved')
      line('Automatically approved. No money was charged.', 10);
  }
  space(10);
  line('This document records your reservation and its current status.', 9);
  line(
    'Automatic approval is not proof of payment. Cancelled bookings do not permit collection of a vehicle.',
    9,
  );
  return save();
}
