'use client';

/* Native images are also cloned into the standalone printable document. */
/* eslint-disable @next/next/no-img-element */

import { useRef, useState } from 'react';
import { CarFront, FileText, Printer, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Booking, Vehicle } from '@/lib/store';
import { bookingLines, bookingsCsv, money, rentalDays } from '@/lib/reports';

function VehicleImage({ src, name }: { src?: string; name: string }) {
  const [failed, setFailed] = useState(false);
  return src && !failed ? (
    <img
      src={src}
      alt={name}
      onError={() => setFailed(true)}
      className="h-40 w-full rounded-2xl object-cover sm:h-48"
    />
  ) : (
    <div className="grid h-40 place-items-center rounded-2xl bg-slate-100 text-slate-500">
      <CarFront aria-hidden="true" />
      <span>Vehicle image unavailable</span>
    </div>
  );
}

export function ReceiptButton({
  booking,
  vehicle,
}: {
  booking: Booking;
  vehicle?: Vehicle;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const documentRef = useRef<HTMLDivElement>(null);
  const print = () => {
    const popup = window.open('', '_blank');
    if (!popup) {
      setError('Allow pop-ups to open the printable document, then try again.');
      return;
    }
    const doc = popup.document;
    doc.title = `Drift booking ${booking.id}`;
    const style = doc.createElement('style');
    style.textContent =
      'body{font:14px/1.6 system-ui;color:#17212f;max-width:800px;margin:32px auto;padding:20px}img{width:100%;max-height:240px;object-fit:cover;border-radius:16px}h2{font-size:28px;margin:8px 0}p{margin:6px 0}dl{display:grid;grid-template-columns:1fr 1fr;gap:16px}dt{font-size:12px;color:#586577}dd{margin:0;font-weight:600;overflow-wrap:anywhere}table{width:100%;border-collapse:collapse;margin:24px 0}th,td{text-align:left;padding:12px 4px;border-bottom:1px solid #ddd}th:last-child,td:last-child{text-align:right}tfoot{font-weight:700}small{color:#586577}footer{border-top:1px solid #ddd;margin-top:24px;padding-top:16px}@page{size:A4;margin:15mm}@media print{body{margin:0;padding:0}tr,img,dl,footer{break-inside:avoid}}';
    doc.head.appendChild(style);
    if (documentRef.current)
      doc.body.appendChild(documentRef.current.cloneNode(true));
    void Promise.race([
      new Promise((resolve) => setTimeout(resolve, 8000)),
      Promise.all(
        Array.from(doc.images).map((img) =>
          img.complete
            ? Promise.resolve()
            : new Promise((resolve) => {
                img.onload = resolve;
                img.onerror = resolve;
              }),
        ),
      ),
    ]).then(() => {
      if (!popup.closed) {
        popup.focus();
        popup.print();
      }
    });
  };
  return (
    <>
      <Button
        variant="outline"
        className="rounded-full"
        onClick={() => setOpen(true)}
      >
        <FileText /> View receipt
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Booking receipt</DialogTitle>
            <DialogDescription>
              Review your rental and save a copy using Print / Save PDF.
            </DialogDescription>
          </DialogHeader>
          <div ref={documentRef} className="space-y-5 break-words">
            <div>
              <p className="text-xs font-semibold tracking-widest text-blue-600">
                DRIFT CAR RENTAL
              </p>
              <h2 className="text-3xl font-semibold">
                Your rental, in detail.
              </h2>
              <p className="text-sm text-slate-500">
                Booking reference: {booking.id}
              </p>
            </div>
            <VehicleImage
              src={booking.vehicleImage || vehicle?.image}
              name={booking.vehicle}
            />
            <div>
              <h3 className="text-xl font-semibold">{booking.vehicle}</h3>
              <p className="text-sm text-slate-500">
                {booking.vehicleRegistration ||
                  vehicle?.registration ||
                  'Registration not recorded'}
              </p>
            </div>
            <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              {[
                ['Customer', booking.customer],
                ['Email', booking.email],
                ['Pick-up', `${booking.startDate} · ${booking.pickupCity}`],
                ['Return', `${booking.endDate} · ${booking.returnCity}`],
                ['Duration', `${rentalDays(booking)} day(s)`],
                ['Booking status', booking.status],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-slate-500">{label}</dt>
                  <dd className="font-medium">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b text-slate-500">
                    <th className="py-3">Description</th>
                    <th className="px-2">Qty</th>
                    <th className="px-2">Rate</th>
                    <th className="text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {bookingLines(booking).map((line, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-3">{line.label}</td>
                      <td className="px-2">{line.quantity}</td>
                      <td className="whitespace-nowrap px-2">
                        {money(line.unitPrice)}
                      </td>
                      <td className="whitespace-nowrap text-right">
                        {money(line.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <th colSpan={3} className="py-4">
                      Booking total (ZAR)
                    </th>
                    <td className="text-right text-lg font-semibold">
                      {money(booking.totalCost)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <footer className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
              <p>
                <strong>Payment not verified.</strong> This document records
                your booking, not proof of payment or a tax invoice.
              </p>
              {booking.status === 'Cancelled' && (
                <p>
                  This booking has been cancelled. The original booking value is
                  shown; no refund is confirmed by this document.
                </p>
              )}
              <p>
                For rental conditions or cancellation assistance, visit Drift’s
                rental terms and contact page.
              </p>
            </footer>
          </div>
          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}
          <Button onClick={print} className="rounded-full">
            <Printer /> Print / Save PDF
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function BookingReports({
  bookings,
  vehicles,
  admin = false,
}: {
  bookings: Booking[];
  vehicles: Vehicle[];
  admin?: boolean;
}) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('All');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const invalidRange = Boolean(from && to && from > to);
  const filtered = bookings.filter(
    (b) =>
      !invalidRange &&
      (status === 'All' || b.status === status) &&
      (!from || b.startDate >= from) &&
      (!to || b.startDate <= to) &&
      [b.id, b.customer, b.vehicle, b.email]
        .join(' ')
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const active = filtered.filter((b) => b.status !== 'Cancelled');
  const download = () => {
    const url = URL.createObjectURL(
      new Blob([bookingsCsv(filtered)], { type: 'text/csv;charset=utf-8' }),
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = 'drift-booking-report.csv';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">
            {admin ? 'Reports & receipts' : 'Your reports & receipts'}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {admin
              ? 'Review bookings, export records and open customer receipts.'
              : 'All your rental details, ready to view or save.'}
          </p>
        </div>
        <Button
          variant="outline"
          disabled={!filtered.length}
          onClick={download}
          className="rounded-full"
        >
          <Download /> Export CSV
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ['Bookings', String(filtered.length)],
          [
            'Booking value · excluding cancelled',
            money(active.reduce((sum, b) => sum + b.totalCost, 0)),
          ],
          ['Cancelled bookings', String(filtered.length - active.length)],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-3xl bg-white p-6 ring-1 ring-black/5"
          >
            <p className="text-xs text-slate-500">{label}</p>
            <p className="mt-3 text-2xl font-semibold">{value}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-3 rounded-3xl bg-white p-5 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-xs text-slate-600">
          Search
          <input
            className="mt-2 w-full rounded-xl border p-3 text-sm"
            placeholder="Reference, vehicle or name"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <label className="text-xs text-slate-600">
          Booking status
          <select
            className="mt-2 w-full rounded-xl border p-3 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {[
              'All',
              'Confirmed',
              'Pending',
              'Cancellation Requested',
              'Completed',
              'Cancelled',
            ].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="text-xs text-slate-600">
          Pick-up from
          <input
            type="date"
            className="mt-2 w-full min-w-0 rounded-xl border p-3 text-sm"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <label className="text-xs text-slate-600">
          Pick-up to
          <input
            type="date"
            className="mt-2 w-full min-w-0 rounded-xl border p-3 text-sm"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>
        <Button
          variant="ghost"
          onClick={() => {
            setQuery('');
            setStatus('All');
            setFrom('');
            setTo('');
          }}
        >
          Clear filters
        </Button>
        {invalidRange && (
          <p role="alert" className="text-sm text-red-600">
            End date must be on or after the start date.
          </p>
        )}
      </div>
      <p className="text-xs text-slate-500">
        {filtered.length} matching records · Values are recorded booking
        amounts, not collected revenue.
      </p>
      <div className="grid gap-4 lg:grid-cols-2">
        {filtered.map((b) => {
          const vehicle = vehicles.find((v) => v.id === b.vehicleId);
          return (
            <article
              key={b.id}
              className="overflow-hidden rounded-3xl border border-black/5 bg-white p-5"
            >
              <VehicleImage
                src={b.vehicleImage || vehicle?.image}
                name={b.vehicle}
              />
              <div className="mt-4 flex flex-wrap justify-between gap-3">
                <div>
                  <p className="text-xs text-slate-500">
                    {b.id} · {b.status}
                  </p>
                  <h3 className="mt-1 text-lg font-semibold">{b.vehicle}</h3>
                  <p className="text-sm text-slate-600">{b.customer}</p>
                </div>
                <strong>{money(b.totalCost)}</strong>
              </div>
              <p className="mt-3 text-sm text-slate-500">
                {b.startDate} → {b.endDate} · {rentalDays(b)} day(s)
              </p>
              <p className="mb-5 text-sm text-slate-500">
                {b.pickupCity} → {b.returnCity}
              </p>
              <ReceiptButton booking={b} vehicle={vehicle} />
            </article>
          );
        })}
      </div>
      {!filtered.length && (
        <div className="rounded-3xl border border-dashed p-10 text-center text-slate-500">
          No bookings match these filters.
        </div>
      )}
    </section>
  );
}
