import type { Booking } from '@/lib/store';

const HOSTINGER_MAIL_API = 'https://api.mail.hostinger.com/api/v1';

export async function sendBookingConfirmation(booking: Booking) {
  const token = process.env.HOSTINGER_MAIL_API_TOKEN;
  const mailboxId = process.env.HOSTINGER_MAILBOX_ID;
  const fromAddress = process.env.HOSTINGER_MAIL_FROM_ADDRESS;
  if (!token || !mailboxId || fromAddress !== 'ashley@kickstreet.store') return false;

  const extras = booking.extras?.length ? booking.extras.join(', ') : 'None';
  const text = [
    `Hi ${booking.customer},`,
    '',
    `Your Drift booking ${booking.id} is confirmed.`,
    `Vehicle: ${booking.vehicle}`,
    `Dates: ${booking.startDate} to ${booking.endDate}`,
    `Route: ${booking.pickupCity} to ${booking.returnCity}`,
    `Extras: ${extras}`,
    `Total: R${booking.totalCost.toLocaleString('en-ZA')}`,
    'Payment status: Pending',
    '',
    'Thanks for choosing Drift.',
  ].join('\n');

  const response = await fetch(`${HOSTINGER_MAIL_API}/mailboxes/${mailboxId}/send`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      to: [booking.email],
      subject: `Drift booking confirmed · ${booking.id}`,
      displayName: process.env.HOSTINGER_MAIL_FROM_NAME || 'Drift Car Rental',
      text,
    }),
  });

  return response.ok;
}