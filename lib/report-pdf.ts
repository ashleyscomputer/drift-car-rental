import { pdfLayout, pdfMoney as money } from './pdf-layout';

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
  const { line, space, section, ensureRoom, save } = await pdfLayout(
    reportTitles[kind],
  );
  line('DRIFT / ADMIN REPORTS', 10, true);
  space(14);
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
      ensureRoom(115);
      line(`${i + 1}. Vehicle #${v.vehicle_id} / ${v.registration}`, 11, true);
      line(`    ${v.count} reservations | Booking value ${money(v.value)}`, 10);
    }
  }
  return save();
}
