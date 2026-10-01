import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export const reportTitles = {
  summary: 'Operations report',
  'booking-value': 'Booking value',
  'fleet-utilisation': 'Fleet status',
  'booking-status': 'Booking status',
  'top-vehicles': 'Top vehicles',
} as const;
export type ReportKind = keyof typeof reportTitles;
export type ReportData = {
  generatedAt: string;
  bookings: { status: string; count: number; value: number }[];
  fleet: { status: string; count: number }[];
  revenue: number;
  topVehicles: {
    vehicle_id: number;
    registration: string;
    count: number;
    value: number;
  }[];
};

export async function createReportPdf(kind: ReportKind, data: ReportData) {
  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  doc.setTitle(`Drift - ${reportTitles[kind]}`);
  doc.setAuthor('Drift Car Rental');
  let page = doc.addPage([595.28, 841.89]);
  let y = 785;
  const clean = (s: string) => s.replace(/[\u00a0\u202f]/g, ' ').replace(/[^\x20-\x7e]/g, '-');
  function line(text: string, size = 11, strong = false) {
    if (y < 70) {
      page = doc.addPage([595.28, 841.89]);
      y = 785;
    }
    page.drawText(clean(text), {
      x: 48,
      y,
      size,
      font: strong ? bold : regular,
      color: rgb(0.11, 0.11, 0.13),
    });
    y -= size + 10;
  }
  function section(title: string) {
    y -= 14;
    line(title, 15, true);
  }
  const money = (n: number) =>
    `R ${Number(n).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  line('DRIFT / ADMIN REPORTS', 10, true);
  y -= 14;
  line(reportTitles[kind], 28, true);
  line(`Generated: ${data.generatedAt} UTC`, 9);
  line('All-time records | Current MySQL snapshot', 10);
  const count = data.bookings.reduce((n, b) => n + Number(b.count), 0);
  const total = data.bookings.reduce((n, b) => n + Number(b.value), 0);
  if (kind === 'summary' || kind === 'booking-value') {
    section('Booking value');
    line(`Reservations: ${count}`);
    line(`Total booking value: ${money(total)}`, 13, true);
    line(`Collected payments: ${money(data.revenue)}`);
    line(
      'Booking value includes all statuses, including cancelled reservations.',
      9,
    );
    line(
      'Automatic approvals do not charge money and are excluded from collections.',
      9,
    );
  }
  if (
    kind === 'summary' ||
    kind === 'booking-status' ||
    kind === 'booking-value'
  ) {
    section('Reservations by status');
    if (!data.bookings.length) line('No bookings recorded yet.');
    for (const b of data.bookings)
      line(`${b.status}: ${b.count} reservations | ${money(b.value)}`);
  }
  if (kind === 'summary' || kind === 'fleet-utilisation') {
    section('Active fleet');
    line(
      `Total vehicles: ${data.fleet.reduce((n, f) => n + Number(f.count), 0)}`,
      13,
      true,
    );
    for (const f of data.fleet) line(`${f.status}: ${f.count}`);
    if (!data.fleet.length) line('No active vehicles recorded.');
    line(
      'Stored status snapshot; availability for rental dates is checked at booking.',
      9,
    );
  }
  if (kind === 'summary' || kind === 'top-vehicles') {
    section('Most booked vehicles');
    line('Top 10 by reservation count, including all booking statuses.', 9);
    if (!data.topVehicles.length) line('No bookings recorded yet.');
    for (const [i, v] of data.topVehicles.entries()) {
      if (y < 115) { page = doc.addPage([595.28, 841.89]); y = 785; }
      line(`${i + 1}. Vehicle #${v.vehicle_id} / ${v.registration}`, 11, true);
      line(`    ${v.count} reservations | Booking value ${money(v.value)}`, 10);
    }
  }
  const pages = doc.getPages();
  pages.forEach((p, i) => {
    p.drawLine({
      start: { x: 48, y: 45 },
      end: { x: 547, y: 45 },
      color: rgb(0.87, 0.88, 0.9),
      thickness: 0.5,
    });
    p.drawText(`Drift Car Rental | ${i + 1} / ${pages.length}`, {
      x: 48,
      y: 29,
      size: 9,
      font: regular,
      color: rgb(0.4, 0.4, 0.44),
    });
  });
  return doc.save();
}
