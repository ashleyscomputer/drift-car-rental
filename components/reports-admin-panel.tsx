'use client';

import { useEffect, useState } from 'react';
import { CalendarDays, CarFront, CircleDollarSign, Download, FileBarChart, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Booking, Vehicle } from '@/lib/store';

type Report = {
  generatedAt: string;
  revenue: { total: number; monthly: Record<string, number> };
  fleet: { total: number; available: number; utilisation: number };
  bookingStatus: Record<string, number>;
  topVehicles: { name: string; bookings: number }[];
  bookingCount: number;
  activeBookings: number;
};

const money = (value: number) => `R${value.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}`;

export function ReportsAdminPanel({ bookings, vehicles }: { bookings: Booking[]; vehicles: Vehicle[] }) {
  const fallback: Report = {
    generatedAt: new Date().toISOString(),
    revenue: { total: bookings.filter((b) => b.status !== 'Cancelled').reduce((sum, b) => sum + b.totalCost, 0), monthly: {} },
    fleet: { total: vehicles.length, available: vehicles.filter((v) => v.status === 'Available').length, utilisation: Math.round((vehicles.filter((v) => v.status !== 'Available').length / Math.max(vehicles.length, 1)) * 100) },
    bookingStatus: bookings.reduce<Record<string, number>>((acc, booking) => ({ ...acc, [booking.status]: (acc[booking.status] || 0) + 1 }), {}),
    topVehicles: [],
    bookingCount: bookings.length,
    activeBookings: bookings.filter((b) => ['Confirmed', 'Pending', 'Cancellation Requested'].includes(b.status)).length,
  };
  const [data, setData] = useState<Report>(fallback);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/reports', { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Reports could not load.');
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reports could not load.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const cards = [
    { key: 'revenue', title: 'Revenue report', desc: 'Booking value excluding cancelled reservations.', value: money(data.revenue.total), icon: CircleDollarSign },
    { key: 'fleet', title: 'Fleet utilisation', desc: 'Availability and operational fleet usage.', value: `${data.fleet.utilisation}%`, icon: CarFront },
    { key: 'booking-status', title: 'Booking status', desc: 'Confirmed, pending, cancellation and completed activity.', value: `${data.bookingCount} bookings`, icon: CalendarDays },
    { key: 'vehicle-performance', title: 'Vehicle performance', desc: 'Most frequently booked vehicles.', value: data.topVehicles[0]?.name || 'No bookings yet', icon: FileBarChart },
  ];

  return <div>
    <div className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-3xl font-semibold tracking-[-.04em]">Reports</h1><p className="mt-1 text-sm text-black/45">Live operational reporting from the Drift booking and fleet data.</p></div><div className="flex gap-2"><Button variant="outline" onClick={load} disabled={loading}>{loading ? <LoaderCircle className="animate-spin"/> : <FileBarChart/>} Refresh</Button><a href="/api/reports/pdf?type=summary" className="inline-flex h-9 items-center gap-2 rounded-full bg-black px-4 text-sm font-medium text-white"><Download className="size-4"/> Full PDF</a></div></div>
    {error && <div className="mt-5 rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</div>}
    <div className="mt-6 grid gap-5 md:grid-cols-2">{cards.map(({ key, title, desc, value, icon: Icon }) => <div key={key} className="rounded-[24px] border border-black/[.05] bg-white p-6 shadow-sm"><div className="flex items-start justify-between"><span className="grid size-11 place-items-center rounded-2xl bg-[#f5f5f7]"><Icon className="size-5" /></span><a href={`/api/reports/pdf?type=${key}`} aria-label={`Download ${title}`} className="grid size-9 place-items-center rounded-full hover:bg-black/[.05]"><Download className="size-4" /></a></div><h3 className="mt-7 text-lg font-semibold">{title}</h3><p className="mt-1 text-sm text-black/45">{desc}</p><p className="mt-5 text-2xl font-semibold tracking-tight">{value}</p></div>)}</div>
    <div className="mt-6 grid gap-5 xl:grid-cols-2">
      <section className="rounded-[24px] border border-black/[.05] bg-white p-6"><h2 className="font-semibold">Monthly booking value</h2><div className="mt-5 space-y-3">{Object.entries(data.revenue.monthly).sort(([a],[b])=>b.localeCompare(a)).slice(0,8).map(([month,value]) => <div key={month} className="flex items-center justify-between rounded-xl bg-[#f5f5f7] px-4 py-3 text-sm"><span>{month}</span><strong>{money(value)}</strong></div>)}{Object.keys(data.revenue.monthly).length === 0 && <p className="text-sm text-black/40">No booking revenue recorded yet.</p>}</div></section>
      <section className="rounded-[24px] border border-black/[.05] bg-white p-6"><h2 className="font-semibold">Booking status</h2><div className="mt-5 space-y-3">{Object.entries(data.bookingStatus).map(([status,count]) => <div key={status} className="flex items-center justify-between rounded-xl bg-[#f5f5f7] px-4 py-3 text-sm"><span>{status}</span><strong>{count}</strong></div>)}{Object.keys(data.bookingStatus).length === 0 && <p className="text-sm text-black/40">No bookings recorded yet.</p>}</div></section>
    </div>
    <p className="mt-4 text-xs text-black/35">Last generated {new Date(data.generatedAt).toLocaleString('en-ZA')}.</p>
  </div>;
}
