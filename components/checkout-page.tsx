'use client';

import { FormEvent, useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, CarFront, Check, LoaderCircle, LockKeyhole, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CHECKOUT_KEY, ORDERS_KEY, readAuthUser, type AuthUser } from '@/lib/auth';

type Draft = { vehicle: { id:number; brand:string; model:string; image:string; dailyRate:number }; startDate:string; endDate:string; pickupCity:string; returnCity:string; customer:string; email:string; days:number; extras:string[]; extrasCost:number; totalCost:number };
const money = (value:number) => 'R' + value.toLocaleString('en-ZA');

export function CheckoutPage() {
  const [draft,setDraft] = useState<Draft|null>(null);
  const [user,setUser] = useState<AuthUser|null>(null);
  const [stage,setStage] = useState<'ready'|'processing'|'success'>('ready');
  const [reference,setReference] = useState('');
  const [error,setError] = useState('');
  const [emailSent,setEmailSent] = useState(false);
  const [loaded,setLoaded] = useState(false);

  useEffect(() => {
    setUser(readAuthUser());
    try { setDraft(JSON.parse(localStorage.getItem(CHECKOUT_KEY) || 'null')); } catch {}
    setLoaded(true);
  }, []);

  const confirmBooking = async (event:FormEvent) => {
    event.preventDefault();
    if (!draft || stage !== 'ready') return;
    setError('');
    setStage('processing');
    try {
      const response = await fetch('/api/bookings', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          customer:user?.name || draft.customer,
          email:user?.email || draft.email,
          vehicleId:draft.vehicle.id,
          startDate:draft.startDate,
          endDate:draft.endDate,
          pickupCity:draft.pickupCity,
          returnCity:draft.returnCity,
          extras:draft.extras || [],
        }),
      });
      const booking = await response.json() as {id:string; totalCost:number; vehicle:string; extras?:string[]; extrasCost?:number; emailSent?:boolean; error?:string};
      if (!response.ok || !booking.id) throw new Error(booking.error || 'Your booking could not be confirmed. Please try again.');
      setReference(booking.id);
      setEmailSent(Boolean(booking.emailSent));
      setDraft({...draft,totalCost:booking.totalCost,extras:booking.extras || draft.extras,extrasCost:booking.extrasCost ?? draft.extrasCost});
      try {
        const saved = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
        const orders = Array.isArray(saved) ? saved : [];
        localStorage.setItem(ORDERS_KEY, JSON.stringify([{reference:booking.id,vehicle:booking.vehicle,amount:booking.totalCost,date:new Date().toISOString(),paymentStatus:'Pending'},...orders]));
        localStorage.removeItem(CHECKOUT_KEY);
      } catch {}
      setStage('success');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Please try again.');
      setStage('ready');
    }
  };

  if (!loaded) return <main className="grid min-h-screen place-items-center" aria-busy="true">Loading checkout…</main>;
  if (!draft) return <Empty title="Your checkout is empty" copy="Choose a vehicle and rental dates to begin a new booking." href="/#browse" action="Browse vehicles" />;

  if (stage === 'success') return <main className="grid min-h-screen place-items-center bg-[#f5f5f7] p-5"><section className="page-enter w-full max-w-xl rounded-[36px] bg-white p-8 text-center shadow-[0_30px_90px_rgba(0,0,0,.1)] sm:p-14"><div className="success-pop mx-auto grid size-20 place-items-center rounded-full bg-emerald-500 text-white"><Check className="size-10" /></div><p className="mt-8 text-sm font-semibold text-emerald-600">BOOKING CONFIRMED</p><h1 className="mt-2 text-4xl font-semibold tracking-[-.05em]">You’re ready for the next step.</h1><p className="mt-4 text-black/50">Your reservation for the {draft.vehicle.brand} {draft.vehicle.model} has been created.</p>{emailSent && <p className="mt-3 text-sm text-black/45">A confirmation email was sent to {user?.email || draft.email}.</p>}<div className="mt-8 rounded-3xl bg-[#f5f5f7] p-6"><p className="text-xs text-black/40">BOOKING REFERENCE</p><p className="mt-1 text-2xl font-semibold">{reference}</p><div className="my-5 h-px bg-black/[.07]"/><div className="flex justify-between text-sm"><span className="text-black/45">Total due</span><strong>{money(draft.totalCost)}</strong></div>{draft.extras?.length > 0 && <div className="mt-3 flex justify-between gap-4 text-sm"><span className="text-black/45">Extras</span><strong className="text-right">{draft.extras.join(', ')}</strong></div>}<div className="mt-3 flex justify-between text-sm"><span className="text-black/45">Payment status</span><strong>Pending</strong></div></div><div className="mt-8 flex flex-wrap justify-center gap-3"><a href="/account" className="inline-flex h-12 items-center gap-2 rounded-full bg-[#0071e3] px-7 text-sm font-medium text-white">My bookings <ArrowRight className="size-4"/></a><a href="/#browse" className="inline-flex h-12 items-center gap-2 rounded-full bg-black px-7 text-sm font-medium text-white">Explore more cars</a></div></section></main>;

  return <main className="page-enter min-h-screen bg-[#f5f5f7] text-[#1d1d1f]"><header className="border-b border-black/5 bg-white/80 backdrop-blur-2xl"><div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5"><a href="/" className="flex items-center gap-2 font-semibold"><span className="grid size-8 place-items-center rounded-full bg-black text-white"><CarFront className="size-4"/></span>Drift</a><span className="flex items-center gap-2 text-xs text-black/45"><LockKeyhole className="size-4"/>Secure checkout</span></div></header><div className="mx-auto max-w-6xl px-5 py-8 sm:py-14"><a href="/" className="inline-flex items-center gap-2 text-sm text-black/45"><ArrowLeft className="size-4"/>Back to catalogue</a><div className="mt-7 grid gap-7 lg:grid-cols-[.88fr_1.12fr]">
    <section className="h-fit overflow-hidden rounded-[32px] bg-black text-white shadow-2xl"><div className="relative aspect-[16/10] overflow-hidden"><img src={draft.vehicle.image} alt={draft.vehicle.brand + ' ' + draft.vehicle.model} className="hero-drift h-full w-full object-cover"/><div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"/><div className="absolute bottom-6 left-6"><p className="text-sm text-white/55">Your drive</p><h1 className="text-3xl font-semibold tracking-tight">{draft.vehicle.brand} {draft.vehicle.model}</h1></div></div><div className="p-7"><div className="grid grid-cols-2 gap-5 text-sm"><Summary label="Pick-up" value={draft.startDate + ' · ' + draft.pickupCity}/><Summary label="Return" value={draft.endDate + ' · ' + draft.returnCity}/><Summary label="Rental length" value={draft.days + ' days'}/><Summary label="Daily rate" value={money(draft.vehicle.dailyRate)}/></div><div className="my-6 h-px bg-white/10"/>{draft.extras?.length > 0 && <div className="mb-5"><p className="text-xs text-white/40">Extras</p><p className="mt-1 text-sm text-white/80">{draft.extras.join(', ')}</p></div>}<div className="flex items-end justify-between"><span className="text-white/55">Total</span><strong className="text-3xl">{money(draft.totalCost)}</strong></div></div></section>
    <form onSubmit={confirmBooking} className="rounded-[32px] bg-white p-6 shadow-sm sm:p-9"><p className="text-sm font-semibold text-[#0071e3]">BOOKING</p><h2 className="mt-2 text-3xl font-semibold tracking-[-.04em]">Review and confirm.</h2><p className="mt-3 text-sm leading-6 text-black/50">Confirm the booking details below. Pricing is recalculated by the server before the reservation is created.</p><div className="mt-6 rounded-2xl bg-[#f5f5f7] p-5"><div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 size-5 text-[#0071e3]"/><div><p className="text-sm font-medium">Payment integration ready</p><p className="mt-1 text-xs leading-5 text-black/45">No card details are collected yet. The booking is created with payment marked as pending until a payment provider is connected.</p></div></div></div>
      <div className="mt-6 rounded-2xl border border-black/[.06] p-5 text-sm"><div className="flex justify-between gap-4"><span className="text-black/45">Customer</span><strong className="text-right">{user?.name || draft.customer}</strong></div><div className="mt-3 flex justify-between gap-4"><span className="text-black/45">Email</span><strong className="text-right">{user?.email || draft.email}</strong></div></div>
      {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <Button type="submit" disabled={stage==='processing'} className="mt-7 h-13 w-full rounded-full bg-[#0071e3] text-white hover:bg-[#0077ed]">{stage==='processing'?<><LoaderCircle className="animate-spin"/>Confirming booking…</>:<>Confirm booking · {money(draft.totalCost)} <LockKeyhole/></>}</Button>
    </form></div></div></main>;
}

function Summary({label,value}:{label:string;value:string}){return <div><p className="text-xs text-white/40">{label}</p><p className="mt-1 font-medium">{value}</p></div>}
function Empty({title,copy,href,action}:{title:string;copy:string;href:string;action:string}){return <main className="grid min-h-screen place-items-center bg-[#f5f5f7] p-5"><section className="rounded-[32px] bg-white p-10 text-center shadow-sm"><CarFront className="mx-auto size-9 text-black/20"/><h1 className="mt-5 text-3xl font-semibold tracking-tight">{title}</h1><p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-black/45">{copy}</p><a href={href} className="mt-7 inline-flex h-11 items-center gap-2 rounded-full bg-black px-6 text-sm text-white">{action}<ArrowRight className="size-4"/></a></section></main>}