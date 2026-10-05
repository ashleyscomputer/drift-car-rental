import type { Booking } from './store';

export const money = (value: number) =>
  new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(
    value,
  );
export function rentalDays(booking: Booking) {
  return Math.max(
    1,
    Math.ceil(
      (Date.parse(booking.endDate) - Date.parse(booking.startDate)) / 86400000,
    ),
  );
}
export function bookingLines(booking: Booking) {
  if (booking.priceLines?.length) return booking.priceLines;
  // Older bookings retain their recorded totals; never recalculate using today's rates.
  const days = rentalDays(booking);
  return [
    {
      label: 'Vehicle rental',
      quantity: days,
      unitPrice: (booking.totalCost - booking.extrasCost) / days,
      total: booking.totalCost - booking.extrasCost,
    },
    ...(booking.extrasCost || booking.extras.length
      ? [
          {
            label: `Extras${booking.extras.length ? ': ' + booking.extras.join(', ') : ''}`,
            quantity: 1,
            unitPrice: booking.extrasCost,
            total: booking.extrasCost,
          },
        ]
      : []),
  ];
}
export function csvCell(value: string | number | null | undefined) {
  const text = String(value ?? '');
  return (
    '"' +
    (/^[\s]*[=+@-]/.test(text) ? "'" + text : text).replaceAll('"', '""') +
    '"'
  );
}
export function bookingsCsv(bookings: Booking[]) {
  return (
    '\uFEFF' +
    [
      [
        'Reference',
        'Customer',
        'Email',
        'Vehicle',
        'Pickup',
        'Return',
        'Pickup branch',
        'Return branch',
        'Days',
        'Rental (ZAR)',
        'Extras (ZAR)',
        'Total (ZAR)',
        'Booking status',
        'Payment status',
      ],
      ...bookings.map((b) => [
        b.id,
        b.customer,
        b.email,
        b.vehicle,
        b.startDate,
        b.endDate,
        b.pickupCity,
        b.returnCity,
        rentalDays(b),
        (b.totalCost - b.extrasCost).toFixed(2),
        b.extrasCost.toFixed(2),
        b.totalCost.toFixed(2),
        b.status,
        'Not verified',
      ]),
    ]
      .map((row) => row.map(csvCell).join(','))
      .join('\r\n')
  );
}
