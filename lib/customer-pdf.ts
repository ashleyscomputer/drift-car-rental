import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
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
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica),
    bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const title = receipt ? 'Booking receipt' : 'My booking report';
  doc.setTitle(`Drift - ${title}`);
  doc.setAuthor('Drift Car Rental');
  let page = doc.addPage([595.28, 841.89]),
    y = 790;
  const clean = (s: string) =>
    s
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[\u00a0\u202f]/g, ' ')
      .replace(/[^\x20-\x7e]/g, '-');
  function line(text: string, size = 11, strong = false) {
    const font = strong ? bold : regular;
    let part = '';
    const draw = () => {
      if (y < 70) {
        page = doc.addPage([595.28, 841.89]);
        y = 790;
      }
      page.drawText(part, {
        x: 48,
        y,
        size,
        font,
        color: rgb(0.11, 0.11, 0.13),
      });
      y -= size + 9;
      part = '';
    };
    for (const char of clean(text)) {
      if (font.widthOfTextAtSize(part + char, size) > 499) draw();
      part += char;
    }
    draw();
  }
  const money = (n: number) =>
    `R ${Number(n).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  line('DRIFT / CUSTOMER DOCUMENTS', 10, true);
  y -= 14;
  line(title, 26, true);
  line(
    'Generated: ' +
      new Date().toISOString().replace('T', ' ').slice(0, 19) +
      ' UTC',
    9,
  );
  line('Account: ' + name);
  y -= 8;
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
    if (y < 230) {
      page = doc.addPage([595.28, 841.89]);
      y = 790;
    }
    y -= 14;
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
  y -= 10;
  line('This document records your reservation and its current status.', 9);
  line(
    'Automatic approval is not proof of payment. Cancelled bookings do not permit collection of a vehicle.',
    9,
  );
  doc.getPages().forEach((p, i) => {
    p.drawLine({
      start: { x: 48, y: 45 },
      end: { x: 547, y: 45 },
      color: rgb(0.87, 0.88, 0.9),
      thickness: 0.5,
    });
    p.drawText(`Drift Car Rental | ${i + 1} / ${doc.getPageCount()}`, {
      x: 48,
      y: 29,
      size: 9,
      font: regular,
    });
  });
  return doc.save();
}
