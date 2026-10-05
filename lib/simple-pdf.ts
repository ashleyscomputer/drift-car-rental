import type { Booking } from '@/lib/store';

const A4_WIDTH = 595;
const A4_HEIGHT = 842;

function clean(value: unknown) {
  return String(value ?? '').normalize('NFKD').replace(/[^\x20-\x7E]/g, '').replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function money(value: number) {
  return `R${Math.round(value).toLocaleString('en-ZA')}`;
}

function text(x: number, y: number, value: unknown, size = 10, bold = false) {
  return `BT /${bold ? 'F2' : 'F1'} ${size} Tf ${x} ${y} Td (${clean(value)}) Tj ET`;
}

function line(x1: number, y1: number, x2: number, y2: number) {
  return `${x1} ${y1} m ${x2} ${y2} l S`;
}

function makePdf(content: string) {
  const objects = [
    `<< /Type /Catalog /Pages 2 0 R >>`,
    `<< /Type /Pages /Kids [3 0 R] /Count 1 >>`,
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${A4_WIDTH} ${A4_HEIGHT}] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>`,
    `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`,
    `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>`,
    `<< /Length ${Buffer.byteLength(content, 'utf8')} >>\nstream\n${content}\nendstream`,
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets[index + 1] = Buffer.byteLength(pdf, 'utf8');
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i += 1) pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new Uint8Array(Buffer.from(pdf, 'utf8'));
}

export function reportPdf(report: {
  generatedAt: string;
  revenue: { total: number; monthly: Record<string, number> };
  fleet: { total: number; available: number; utilisation: number };
  bookingStatus: Record<string, number>;
  topVehicles: { name: string; bookings: number }[];
  bookingCount: number;
  activeBookings: number;
}, type = 'summary') {
  const c: string[] = ['0.12 G', text(48, 790, 'DRIFT CAR RENTAL', 10, true), text(48, 760, `${type.replace(/-/g, ' ').toUpperCase()} REPORT`, 24, true), text(48, 738, `Generated ${new Date(report.generatedAt).toLocaleString('en-ZA')}`, 9), line(48, 722, 547, 722)];
  let y = 692;
  const row = (label: string, value: string) => { c.push(text(48, y, label, 10), text(380, y, value, 11, true)); y -= 24; };
  row('Total booking value (excludes cancelled)', money(report.revenue.total));
  row('Bookings', String(report.bookingCount));
  row('Active bookings', String(report.activeBookings));
  row('Fleet size', String(report.fleet.total));
  row('Vehicles available', String(report.fleet.available));
  row('Fleet utilisation', `${report.fleet.utilisation}%`);
  y -= 8; c.push(line(48, y, 547, y)); y -= 28;
  c.push(text(48, y, 'Monthly revenue', 13, true)); y -= 22;
  const monthly = Object.entries(report.revenue.monthly).sort(([a], [b]) => b.localeCompare(a)).slice(0, 10);
  if (!monthly.length) { c.push(text(48, y, 'No booking revenue recorded yet.', 10)); y -= 20; }
  for (const [month, value] of monthly) { c.push(text(62, y, month, 10), text(380, y, money(value), 10, true)); y -= 18; }
  y -= 10; c.push(text(48, y, 'Booking status', 13, true)); y -= 22;
  for (const [status, count] of Object.entries(report.bookingStatus)) { c.push(text(62, y, status, 10), text(380, y, count, 10, true)); y -= 18; }
  y -= 10; c.push(text(48, y, 'Top vehicles', 13, true)); y -= 22;
  if (!report.topVehicles.length) c.push(text(48, y, 'No vehicle booking activity recorded yet.', 10));
  for (const item of report.topVehicles) { c.push(text(62, y, item.name, 10), text(380, y, `${item.bookings} bookings`, 10, true)); y -= 18; }
  c.push(text(48, 36, 'Drift Car Rental | Database Systems Project 2026', 8));
  return makePdf(c.join('\n'));
}

export function bookingReceiptPdf(booking: Booking) {
  const c: string[] = ['0.12 G', text(48, 790, 'DRIFT CAR RENTAL', 10, true), text(48, 760, 'BOOKING RECEIPT', 24, true), text(48, 734, booking.id, 11, true), line(48, 716, 547, 716)];
  let y = 680;
  const row = (label: string, value: unknown) => { c.push(text(48, y, label, 10), text(220, y, value, 10, true)); y -= 26; };
  row('Customer', booking.customer);
  row('Email', booking.email);
  row('Vehicle', booking.vehicle);
  row('Pick-up', `${booking.startDate} | ${booking.pickupCity}`);
  row('Return', `${booking.endDate} | ${booking.returnCity}`);
  row('Status', booking.status);
  row('Rental extras', booking.extras.length ? booking.extras.join(', ') : 'None');
  row('Extras total', money(booking.extrasCost));
  y -= 6; c.push(line(48, y, 547, y)); y -= 32;
  c.push(text(48, y, 'TOTAL', 13, true), text(390, y, money(booking.totalCost), 18, true));
  c.push(text(48, 80, 'This receipt reflects the booking record stored by Drift.', 9));
  c.push(text(48, 60, `Generated ${new Date().toLocaleString('en-ZA')}`, 8));
  return makePdf(c.join('\n'));
}
