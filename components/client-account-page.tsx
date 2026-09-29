'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CalendarDays, CarFront, CheckCircle2, CircleUserRound, MapPin, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { readAuthUser, signOutUser, type AuthUser } from '@/lib/auth';
import type { Booking } from '@/lib/store';

const money = (value:number) => 'R' + value.toLocaleString('en-ZA');
const badgeClass = (status: Booking['status']) => status === 'Completed' ? 'bg-emerald-50 text-emerald-700' : status === 'Cancelled' ? 'bg-red-50 text-red-700' : status === 'Pending' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700';

export function ClientAccountPage() {
  const [user,setUser] = useState<AuthUser|null>(null);
  const [bookings,setBookings] = useState<Booking[]>([]);
  const [loading,setLoading] = useState(true);

  const load = async (email:string) => {
    const response = await fetch('/api/bookings?email=' + encodeURIComponent(email));
    setBookings(response.ok ? await response.json() : []);
    setLoading(false);
  };

  useEffect(() => {
    const current = readAuthUser();
    setUser(current);
    if (current) load(current.email); else setLoading(false);
  }, []);

  const now = new Date();
  const upcoming = useMemo(() => bookings.filter((booking) => booking.status !== 'Cancelled' && booking.status !== 'Completed' && new Date(booking.endDate + 'T23:59:59') >= now), [bookings]);
  const history = useMemo(() => bookings.filter((booking) => booking.status === 'Cancelled' || booking.status === 'Completed' || new Date(booking.endDate + 'T23:59:59') < now), [bookings]);

  const cancelBooking = async (id:string) => {
    const response = await fetch('/api/bookings',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,status:'Cancelled'})});
    if (response.ok && user) await load(user.email);
  };

  if (loading) return <main className="grid min-h-screen place-items-center bg-[#f5f5f7]">Loading your account…</main>;
  if (!user) return <main className="grid min-h-screen place-items-center bg-[#f5f5f7] p-5"><section className="w-full max-w-md rounded-[32px] bg-white p-9 text-center shadow-sm"><CircleUserRound className="mx-auto size-10 text-black/25"/><h1 className="mt-5 text-3xl font-semibold">Sign in to view your account.</h1><p className="mt-3 text-sm text-black/45">Your bookings and profile will appear here.</p><a href="/login?returnTo=/account" className="mt-7 inline-flex h-11 items-center rounded-full bg-black px-6 text-sm text-white">Sign in</a></section></main>;

  return <main className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
    <header className="sticky top-0 z-40 border-b border-black/[.06] bg-white/85 backdrop-blur-2xl"><div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5"><a href="/" className="flex items-center gap-2 font-semibold"><span className="grid size-8 place-items-center rounded-full bg-black text-white"><CarFront className="size-4"/></span>Drift</a><div className="flex items-center gap-2"><a href="/" className="hidden items-center gap-2 text-sm text-black/50 sm:flex"><ArrowLeft className="size-4"/>Fleet</a><Button variant="ghost" className="rounded-full" onClick={() => { signOutUser(); window.location.href='/'; }}>Sign out</Button></div></div></header>
    <div className="mx-auto max-w-6xl px-5 py-10 sm:py-14">
      <section className="grid gap-5 lg:grid-cols-[1.6fr_.8fr]">
        <div><p className="text-sm font-medium text-[#0071e3]">MY DRIFT</p><h1 className="mt-2 text-4xl font-semibold tracking-[-.05em] sm:text-5xl">Your bookings, minus the paperwork pile.</h1><p className="mt-4 max-w-2xl text-base leading-7 text-black/50">View upcoming rentals, booking references and payment status in one place.</p></div>
        <div className="rounded-[28px] bg-white p-6 shadow-sm"><div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-full bg-[#f5f5f7]"><CircleUserRound className="size-5"/></span><div><p className="font-semibold">{user.name}</p><p className="text-sm text-black/45">{user.email}</p></div></div><div className="mt-5 flex items-center justify-between border-t border-black/[.06] pt-4 text-sm"><span className="text-black/45">Account type</span><strong className="capitalize">{user.role}</strong></div></div>
      </section>

      <section className="mt-10"><div className="flex items-end justify-between gap-4"><div><p className="text-sm font-medium text-[#0071e3]">UPCOMING</p><h2 className="mt-1 text-2xl font-semibold">Current bookings</h2></div><span className="text-sm text-black/40">{upcoming.length} active</span></div><div className="mt-5 space-y-4">{upcoming.length ? upcoming.map((booking) => <BookingCard key={booking.id} booking={booking} onCancel={() => cancelBooking(booking.id)} />) : <EmptyState title="No upcoming bookings" copy="Choose a vehicle from the fleet when you’re ready for your next drive."/>}</div></section>

      <section className="mt-12"><div><p className="text-sm font-medium text-black/40">HISTORY</p><h2 className="mt-1 text-2xl font-semibold">Past and cancelled</h2></div><div className="mt-5 space-y-4">{history.length ? history.map((booking) => <BookingCard key={booking.id} booking={booking} />) : <EmptyState title="No booking history yet" copy="Completed and cancelled bookings will stay organised here."/>}</div></section>
    </div>
  </main>;
}

function BookingCard({booking,onCancel}:{booking:Booking;onCancel?:()=>void}) {
  return <article className="rounded-[28px] bg-white p-6 shadow-sm sm:p-7"><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex flex-wrap items-center gap-2"><h3 className="text-xl font-semibold">{booking.vehicle}</h3><Badge className={'border-0 ' + badgeClass(booking.status)}>{booking.status}</Badge></div><p className="mt-1 text-xs text-black/40">{booking.id}</p></div><div className="text-right"><p className="text-xs text-black/40">Total</p><strong className="text-xl">{money(booking.totalCost)}</strong><p className="mt-1 text-xs text-amber-700">Payment pending</p></div></div><div className="mt-6 grid gap-3 sm:grid-cols-3"><Info icon={<CalendarDays className="size-4"/>} label="Dates" value={booking.startDate + ' → ' + booking.endDate}/><Info icon={<MapPin className="size-4"/>} label="Route" value={booking.pickupCity + ' → ' + booking.returnCity}/><Info icon={<CheckCircle2 className="size-4"/>} label="Extras" value={booking.extras?.length ? booking.extras.join(', ') : 'None'}/></div>{onCancel && <div className="mt-6 flex justify-end border-t border-black/[.06] pt-5"><Button variant="outline" className="rounded-full text-red-600" onClick={onCancel}><XCircle/> Cancel booking</Button></div>}</article>;
}

function Info({icon,label,value}:{icon:React.ReactNode;label:string;value:string}) { return <div className="rounded-2xl bg-[#f5f5f7] p-4"><div className="flex items-center gap-2 text-xs text-black/40">{icon}{label}</div><p className="mt-2 text-sm font-medium">{value}</p></div>; }
function EmptyState({title,copy}:{title:string;copy:string}) { return <div className="rounded-[28px] border border-dashed border-black/10 bg-white/60 p-9 text-center"><h3 className="font-semibold">{title}</h3><p className="mt-2 text-sm text-black/45">{copy}</p><a href="/#browse" className="mt-5 inline-flex rounded-full bg-black px-5 py-2.5 text-sm text-white">Browse vehicles</a></div>; }