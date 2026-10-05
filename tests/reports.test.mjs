import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bookingLines, bookingsCsv, rentalDays } from '../lib/reports.ts';
const booking = {
  id: 'DR-1',
  customer: '=SUM(1,2)',
  email: 'test@example.com',
  vehicleId: 1,
  vehicle: 'Polo',
  startDate: '2026-10-05',
  endDate: '2026-10-08',
  pickupCity: 'Kimberley',
  returnCity: 'Cape Town',
  extras: ['Cover'],
  extrasCost: 360,
  totalCost: 1545,
  status: 'Confirmed',
};
test('legacy receipt reconciles recorded total without using current fleet prices', () => {
  const lines = bookingLines(booking);
  assert.equal(rentalDays(booking), 3);
  assert.equal(lines[0].unitPrice, 395);
  assert.equal(
    lines.reduce((sum, line) => sum + line.total, 0),
    1545,
  );
});
test('same-day rental is one day', () =>
  assert.equal(rentalDays({ ...booking, endDate: booking.startDate }), 1));
test('receipt uses price snapshots including flat extras', () => {
  const priceLines = [
    { label: 'Rental', quantity: 3, unitPrice: 395, total: 1185 },
    { label: 'Delivery', quantity: 1, unitPrice: 360, total: 360 },
  ];
  assert.deepEqual(bookingLines({ ...booking, priceLines }), priceLines);
});
test('CSV escapes formula input and keeps cancellation distinct from payment', () => {
  const csv = bookingsCsv([{ ...booking, status: 'Cancelled' }]);
  assert.ok(csv.includes('"\'=SUM(1,2)"'));
  assert.ok(csv.includes('"Cancelled","Not verified"'));
  assert.ok(csv.includes('"1545.00"'));
});
