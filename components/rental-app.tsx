'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft, ArrowRight, CalendarDays, CarFront, Check, ChevronLeft, ChevronRight,
  CircleDollarSign, ClipboardList, Database, Download, FileBarChart, Gauge, LayoutDashboard,
  Menu, Pencil, Plus, Search, ShieldCheck, Sparkles, Star, Table2, Trash2,
  Users, X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import { Chatbot } from '@/components/chatbot';
import { rentalExtras, vehicleRating, type Booking, type Vehicle } from '@/lib/store';
import { CHECKOUT_KEY, readAuthUser, signOutUser, type AuthUser } from '@/lib/auth';

type Section = 'Dashboard' | 'Vehicles' | 'Brands' | 'Categories' | 'Features' | 'Customers' | 'Bookings' | 'Payments' | 'Reports' | 'Database';
type DbTable = { name: string; rows: number; fields: string[] };

const features = ['Bluetooth', 'GPS', 'Air conditioning', 'Reverse camera', 'Cruise control', 'Apple CarPlay'];
const cities = ['Kimberley', 'Upington', 'Bloemfontein', 'Johannesburg', 'Cape Town'];
const menu: { label: Section; icon: typeof LayoutDashboard }[] = [
  { label: 'Dashboard', icon: LayoutDashboard }, { label: 'Vehicles', icon: CarFront },
  { label: 'Bookings', icon: ClipboardList }, { label: 'Customers', icon: Users },
  { label: 'Reports', icon: FileBarChart }, { label: 'Database', icon: Database },
];

const currency = (value: number) => `R${value.toLocaleString('en-ZA')}`;
const statusClass = (status: string) => status === 'Available' || status === 'Confirmed' || status === 'Completed'
  ? 'bg-emerald-50 text-emerald-700' : status === 'Pending' || status === 'Maintenance' || status === 'Reserved' || status === 'Cancellation Requested' ? 'bg-amber-50 text-amber-700' : status === 'Cancelled' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700';

export default function RentalApp({ showHero = true }: { showHero?: boolean }) {
  const [mode, setMode] = useState<'customer' | 'admin'>('customer');
  const [loadError, setLoadError] = useState('');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tables, setTables] = useState<DbTable[]>([]);
  const [section, setSection] = useState<Section>('Dashboard');
  const [sidebar, setSidebar] = useState(false);
  const [selected, setSelected] = useState<Vehicle | null>(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [vehicleFormOpen, setVehicleFormOpen] = useState(false);
  const [tableOpen, setTableOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [filters, setFilters] = useState({ brand: 'All', model: 'All', type: 'All', year: 'All', maxPrice: '4500', transmission: 'All', features: [] as string[] });

  const refresh = async () => {
    setLoadError('');
    await Promise.allSettled([
      fetch('/api/vehicles').then(async r=>{if(!r.ok)throw new Error();setVehicles(await r.json());}).catch(()=>setLoadError('The fleet could not load. Please retry.')),
      fetch('/api/bookings').then(async r=>{if(r.ok)setBookings(await r.json());}),
      fetch('/api/database').then(async r=>{if(r.ok)setTables(await r.json());}),
    ]);
  };
  useEffect(() => { refresh(); const updateUser = () => { const next = readAuthUser(); setUser(next); setMode(next?.role === 'admin' ? 'admin' : 'customer'); }; updateUser(); window.addEventListener('drift-auth-change', updateUser); window.addEventListener('storage', updateUser); return () => { window.removeEventListener('drift-auth-change', updateUser); window.removeEventListener('storage', updateUser); }; }, []);
  useEffect(() => { if (!toast) return; const timeout = setTimeout(() => setToast(''), 2800); return () => clearTimeout(timeout); }, [toast]);
  useEffect(() => { const id = Number(new URLSearchParams(window.location.search).get('book')); if (!id || !vehicles.length) return; const vehicle = vehicles.find((item) => item.id === id); if (vehicle) { setSelected(vehicle); setBookingOpen(true); } }, [vehicles]);

  const brands = [...new Set(vehicles.map((v) => v.brand))];
  const years = [...new Set(vehicles.map((v) => v.year))].sort((a, b) => b - a).map(String);
  const models = vehicles.filter((v) => filters.brand === 'All' || v.brand === filters.brand).map((v) => v.model);
  const filtered = vehicles.filter((v) =>
    (filters.brand === 'All' || v.brand === filters.brand) &&
    (filters.model === 'All' || v.model === filters.model) &&
    (filters.type === 'All' || v.type === filters.type) &&
    (filters.year === 'All' || String(v.year) === filters.year) &&
    (filters.transmission === 'All' || v.transmission === filters.transmission) &&
    v.dailyRate <= Number(filters.maxPrice) && filters.features.every((f) => v.features.includes(f))
  );
  const openBooking = (vehicle: Vehicle) => { setSelected(vehicle); setBookingOpen(true); };

  if (mode === 'admin' && user?.role === 'admin') {
    return <AdminApp {...{ vehicles, bookings, tables, section, setSection, sidebar, setSidebar, setMode, refresh, setToast, vehicleFormOpen, setVehicleFormOpen, tableOpen, setTableOpen }} />;
  }

  return (
    <main className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      <Header user={user} onSignOut={() => { signOutUser(); setToast('Signed out.'); }} onAdmin={() => setMode('admin')} />
      {showHero && (
        <section className="mx-auto max-w-[1920px] px-5 pb-12 pt-8 lg:px-8 lg:pt-12">
          <div className="relative min-h-[520px] overflow-hidden rounded-[36px] bg-[#dfe8ef] shadow-[0_24px_80px_rgba(0,0,0,.12)]">
          <img src="/og.png" alt="Two premium Drift rental vehicles" className="hero-drift absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/45 to-transparent" />
          <div className="relative z-10 flex min-h-[520px] max-w-2xl flex-col justify-end p-7 sm:p-12 lg:p-16">
            <p className="mb-3 text-xs font-semibold tracking-[.18em] text-[#0071e3]">EFFORTLESS CAR RENTAL</p>
            <h1 className="max-w-xl text-5xl font-semibold leading-[.96] tracking-[-.055em] sm:text-6xl">Find your next drive.</h1>
            <p className="mt-5 max-w-lg text-lg leading-7 text-black/60">Choose the right car, see the full price and book in minutes. No queues. No surprises.</p>
            <div className="mt-7 flex flex-wrap gap-3"><a href="#browse" className="inline-flex w-fit items-center gap-2 rounded-full bg-[#0071e3] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#0077ed]">Browse vehicles <ArrowRight className="size-4" /></a><a href="#browse" className="inline-flex w-fit items-center gap-2 rounded-full border border-black/10 bg-white/70 px-6 py-3 text-sm font-medium text-black backdrop-blur transition hover:bg-white"><Sparkles className="size-4"/>Explore the fleet</a></div>
          </div>
          </div>
        </section>
      )}

      <section id="browse" className="mx-auto max-w-[1920px] scroll-mt-24 px-5 pb-28 lg:px-8">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-medium text-[#0071e3]">Our fleet</p><h2 className="mt-1 text-3xl font-semibold tracking-[-.04em] sm:text-4xl">Choose your drive.</h2></div><p className="text-sm text-black/45">{filtered.length} vehicles match</p></div>
        <div className="rounded-[28px] border border-black/[.06] bg-white p-4 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            <FilterSelect label="Brand" value={filters.brand} values={['All', ...brands]} onChange={(brand) => setFilters({ ...filters, brand, model: 'All' })} />
            <FilterSelect label="Model" value={filters.model} values={['All', ...models]} onChange={(model) => setFilters({ ...filters, model })} />
            <FilterSelect label="Vehicle type" value={filters.type} values={['All', 'Hatchback', 'Sedan', 'SUV', 'Bakkie', 'Van']} onChange={(type) => setFilters({ ...filters, type })} />
            <FilterSelect label="Year" value={filters.year} values={['All', ...years]} onChange={(year) => setFilters({ ...filters, year })} />
            <FilterSelect label="Transmission" value={filters.transmission} values={['All', 'Automatic', 'Manual']} onChange={(transmission) => setFilters({ ...filters, transmission })} />
            <label className="rounded-2xl bg-[#f5f5f7] px-4 py-3"><span className="block text-[11px] text-black/45">Maximum daily rate</span><span className="mt-1 block text-sm font-medium">{currency(Number(filters.maxPrice))}</span><input className="mt-2 w-full accent-[#0071e3]" type="range" min="300" max="4500" step="50" value={filters.maxPrice} onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })} /></label>
            <Button variant="secondary" className="h-auto min-h-16 rounded-2xl" onClick={() => setFilters({ brand: 'All', model: 'All', type: 'All', year: 'All', maxPrice: '4500', transmission: 'All', features: [] })}><X /> Clear filters</Button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 border-t border-black/[.05] pt-3">
            <span className="mr-1 flex items-center text-xs text-black/45">Extras</span>
            {features.map((feature) => { const active = filters.features.includes(feature); return <label key={feature} className={`flex cursor-pointer items-center gap-2 rounded-full px-3 py-2 text-xs transition ${active ? 'bg-blue-50 text-blue-700' : 'bg-[#f5f5f7] text-black/60'}`}><input type="checkbox" className="size-4 accent-[#0071e3]" checked={active} onChange={() => setFilters({ ...filters, features: active ? filters.features.filter((f) => f !== feature) : [...filters.features, feature] })} />{feature}</label>; })}
          </div>
          <p className="mt-3 text-[11px] leading-4 text-black/40">Indicative South African market-aligned rates shown from per day. Dates, branch, rental duration, cover, mileage and availability affect a final real-world quote.</p>
        </div>

        {loadError && <div role="alert" className="mt-5 rounded-2xl bg-white p-5">{loadError} <Button onClick={refresh}>Retry</Button></div>}{filtered.length ? <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">{filtered.map((vehicle) => <VehicleCard key={vehicle.id} vehicle={vehicle} onView={() => setSelected(vehicle)} onBook={() => openBooking(vehicle)} />)}</div> : <div className="mt-6 rounded-[28px] bg-white p-16 text-center"><Search className="mx-auto size-8 text-black/25" /><h3 className="mt-4 font-semibold">No vehicles found</h3><p className="mt-1 text-sm text-black/45">Try widening your search filters.</p></div>}
      </section>

      <HomepageSections vehicles={vehicles} />

      <VehicleDialog vehicle={selected} open={!!selected && !bookingOpen} onOpenChange={(open) => !open && setSelected(null)} onBook={() => selected && openBooking(selected)} />
      <BookingDialog vehicle={selected} user={user} open={bookingOpen} onOpenChange={setBookingOpen} />
      <Chatbot vehicles={vehicles} />
      {toast && <Toast message={toast} />}
    </main>
  );
}

function HomepageSections({ vehicles }: { vehicles: Vehicle[] }) {
  const rated = vehicles.slice().sort((a,b) => vehicleRating(b.id) - vehicleRating(a.id)).slice(0,3);
  const faqs = [
    ['Can I return the car in another city?', 'Yes. Choose your preferred pick-up and return branches during booking.'],
    ['How is availability checked?', 'Drift checks the vehicle status and rejects overlapping booking dates before confirming a reservation.'],
    ['Can I add extras?', 'Yes. Cover, an additional driver, child seat, GPS, unlimited mileage and vehicle delivery can be added in the booking form.'],
  ];
  return <div className="mx-auto max-w-[1920px] px-5 pb-24 lg:px-8">
    <section id="how-it-works" className="rounded-[32px] bg-black px-6 py-10 text-white sm:px-10 sm:py-12"><div className="max-w-2xl"><p className="text-xs font-semibold tracking-[.18em] text-white/45">HOW DRIFT WORKS</p><h2 className="mt-3 text-3xl font-semibold tracking-[-.04em] sm:text-4xl">Three steps. Zero counter chaos.</h2></div><div className="mt-8 grid gap-3 md:grid-cols-3">{[['01','Choose','Compare the fleet and open any vehicle for full details.'],['02','Book','Select dates, branches and only the extras you need.'],['03','Drive','Receive your booking reference and manage it from My Drift.']].map(([n,title,copy]) => <div key={n} className="rounded-[24px] bg-white/[.07] p-5"><p className="text-xs text-white/35">{n}</p><h3 className="mt-8 text-lg font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-white/50">{copy}</p></div>)}</div></section>

    <section className="py-16"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-medium text-[#0071e3]">HIGHLY RATED</p><h2 className="mt-1 text-3xl font-semibold tracking-[-.04em]">Fleet favourites.</h2></div><p className="max-w-md text-sm leading-6 text-black/45">Clean comfort for everyday trips, with premium options when the occasion calls for more.</p></div><div className="mt-7 grid gap-4 md:grid-cols-3">{rated.map((vehicle) => <a key={vehicle.id} href={`/vehicles/${vehicle.id}`} className="group rounded-[26px] bg-white p-4 shadow-sm"><img src={vehicle.image} alt={`${vehicle.brand} ${vehicle.model}`} className="aspect-[16/10] w-full rounded-[20px] object-cover transition duration-300 group-hover:scale-[1.01]"/><div className="flex items-center justify-between gap-4 px-1 pb-1 pt-4"><div><p className="font-semibold">{vehicle.brand} {vehicle.model}</p><p className="mt-1 text-xs text-black/40">from {currency(vehicle.dailyRate)}/day</p></div><span className="flex items-center gap-1 text-sm font-medium"><Star className="size-4 fill-current"/>{vehicleRating(vehicle.id).toFixed(1)}/5</span></div></a>)}</div></section>

    <section className="grid gap-5 lg:grid-cols-[1fr_1fr]"><div className="rounded-[30px] bg-white p-7 sm:p-9"><p className="text-sm font-medium text-[#0071e3]">BRANCHES</p><h2 className="mt-2 text-3xl font-semibold tracking-[-.04em]">Five cities. One simple booking.</h2><div className="mt-6 flex flex-wrap gap-2">{cities.map((city)=><span key={city} className="rounded-full bg-[#f5f5f7] px-4 py-2 text-sm">{city}</span>)}</div></div><div className="rounded-[30px] bg-white p-7 sm:p-9"><p className="text-sm font-medium text-[#0071e3]">FAQ</p><div className="mt-5 space-y-5">{faqs.map(([q,a]) => <div key={q} className="border-b border-black/[.06] pb-5 last:border-0 last:pb-0"><h3 className="font-semibold">{q}</h3><p className="mt-2 text-sm leading-6 text-black/45">{a}</p></div>)}</div></div></section>

    <footer className="mt-16 flex flex-col gap-5 border-t border-black/[.08] py-8 text-sm text-black/45 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-2 font-semibold text-black"><span className="grid size-8 place-items-center rounded-full bg-black text-white"><CarFront className="size-4"/></span>Drift Car Rental</div><div className="flex flex-wrap gap-x-5 gap-y-2"><a href="#browse">Vehicles</a><a href="/account">My Drift</a><a href="/faq">FAQ</a><a href="/contact">Contact</a><a href="/rental-terms">Rental terms</a><a href="/privacy">Privacy</a><a href="/cancellation-policy">Cancellations</a></div><p>Kimberley · South Africa</p></footer>
  </div>;
}
function Header({ user, onSignOut, onAdmin }: { user: AuthUser | null; onSignOut: () => void; onAdmin: () => void }) {
  return <header className="sticky top-0 z-40 border-b border-black/5 bg-white/78 backdrop-blur-2xl"><div className="mx-auto flex h-16 max-w-[1920px] items-center justify-between px-5 lg:px-8"><a href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight"><span className="grid size-8 place-items-center rounded-full bg-black text-white"><CarFront className="size-4" /></span>Drift</a><nav className="hidden items-center gap-8 text-sm text-black/55 md:flex"><a href="#browse" className="hover:text-black">Vehicles</a><a href="#how-it-works" className="hover:text-black">How it works</a>{user && <a href="/account" className="hover:text-black">My bookings</a>}</nav><div className="flex items-center gap-2">{user ? <><a href="/account" className="hidden rounded-full bg-[#f5f5f7] px-4 py-2 text-xs sm:block"><strong>{user.name}</strong></a><Button variant="ghost" onClick={onSignOut} className="h-9 rounded-full">Sign out</Button></> : <a className="rounded-full bg-[#0071e3] px-4 py-2 text-sm font-medium text-white" href="/login">Sign in</a>}{user?.role === 'admin' && <Button onClick={onAdmin} className="h-9 rounded-full bg-black px-4 text-white hover:bg-black/80 sm:px-5">Admin</Button>}</div></div></header>;
}
function FilterSelect({ label, value, values, onChange }: { label: string; value: string; values: string[]; onChange: (value: string) => void }) {
  return <label className="rounded-2xl bg-[#f5f5f7] px-3 py-3"><span className="mb-1 block px-1 text-[11px] text-black/45">{label}</span><NativeSelect className="w-full" value={value} onChange={(e) => onChange(e.target.value)}>{values.map((item) => <NativeSelectOption key={item}>{item}</NativeSelectOption>)}</NativeSelect></label>;
}

function VehicleCard({ vehicle, onView, onBook }: { vehicle: Vehicle; onView: () => void; onBook: () => void }) {
  const rating = vehicleRating(vehicle.id).toFixed(1);
  return <article className="group overflow-hidden rounded-[28px] bg-white shadow-[0_1px_0_rgba(0,0,0,.04),0_16px_40px_rgba(0,0,0,.05)]"><button onClick={onView} className="relative block aspect-[4/2.65] w-full overflow-hidden bg-black/5 text-left"><img loading="lazy" decoding="async" src={vehicle.image} alt={`${vehicle.brand} ${vehicle.model}`} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" /><Badge className={`absolute left-4 top-4 border-0 ${statusClass(vehicle.status)}`}>{vehicle.status}</Badge><Badge className={`absolute right-4 top-4 border-0 ${vehicle.dailyRate >= 1500 ? 'bg-black/80 text-white backdrop-blur' : 'bg-white/90 text-black/65 backdrop-blur'}`}>{vehicle.dailyRate >= 1500 ? 'Premium' : vehicle.dailyRate < 600 ? 'Value' : 'Comfort'}</Badge></button><div className="p-6"><div className="flex items-start justify-between gap-4"><div><h3 className="text-lg font-semibold tracking-tight">{vehicle.brand} {vehicle.model}</h3><p className="mt-1 text-sm text-black/45">{vehicle.year} · {vehicle.type} · {vehicle.transmission}</p><p className="mt-2 flex items-center gap-1.5 text-xs text-black/55"><Star className="size-3.5 fill-current" /> {rating}/5</p></div><p className="text-right text-xs text-black/45"><span className="block">from</span><strong className="block text-xl text-black">{currency(vehicle.dailyRate)}</strong>per day</p></div><div className="mt-5 flex gap-2"><a href={`/vehicles/${vehicle.id}`} className="inline-flex h-10 flex-1 items-center justify-center rounded-full bg-secondary text-sm font-medium text-secondary-foreground">Details</a><Button onClick={onBook} disabled={vehicle.status !== 'Available'} className="h-10 flex-1 rounded-full bg-[#0071e3] text-white hover:bg-[#0077ed]">Book now</Button></div></div></article>;
}
function VehicleDialog({ vehicle, open, onOpenChange, onBook }: { vehicle: Vehicle | null; open: boolean; onOpenChange: (open: boolean) => void; onBook: () => void }) {
  if (!vehicle) return null;
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[92vh] overflow-y-auto rounded-[28px] p-0 sm:max-w-3xl"><VehicleGallery vehicle={vehicle} /><div className="p-7 sm:p-8"><DialogHeader><div className="flex flex-wrap items-start justify-between gap-4"><div><DialogTitle className="text-3xl font-semibold tracking-[-.04em]">{vehicle.brand} {vehicle.model}</DialogTitle><DialogDescription className="mt-2">{vehicle.description}</DialogDescription></div><div className="text-right"><span className="block text-xs text-black/45">from</span><strong className="text-2xl">{currency(vehicle.dailyRate)}</strong><span className="block text-xs text-black/45">per day</span></div></div></DialogHeader><div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">{[['Year', vehicle.year], ['Type', vehicle.type], ['Transmission', vehicle.transmission], ['Doors', vehicle.doors]].map(([k, v]) => <div key={k} className="rounded-2xl bg-[#f5f5f7] p-4"><p className="text-xs text-black/45">{k}</p><p className="mt-1 font-medium">{v}</p></div>)}</div><div className="mt-7"><h4 className="font-medium">Included features</h4><div className="mt-3 flex flex-wrap gap-2">{vehicle.features.map((item) => <span key={item} className="flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-2 text-xs text-blue-700"><Check className="size-3" />{item}</span>)}</div></div><Button onClick={onBook} disabled={vehicle.status !== 'Available'} className="mt-8 h-12 w-full rounded-full bg-[#0071e3] text-white hover:bg-[#0077ed]">Book this vehicle <ArrowRight /></Button></div></DialogContent></Dialog>;
}

function VehicleGallery({ vehicle }: { vehicle: Vehicle }) {
  const [active, setActive] = useState(0);
  useEffect(() => setActive(0), [vehicle.id]);
  const external = vehicle.image.startsWith('http');
  const slug = vehicle.image.split('/').at(-1)?.replace(/\.[^.]+$/, '') ?? '';
  const images = external ? [vehicle.image] : [vehicle.image, ...[1, 2, 3].map((index) => `/vehicles/gallery/${slug}/${index}.jpg`)];
  return <div className="bg-[#f5f5f7] p-3"><img src={images[active]} alt={`${vehicle.brand} ${vehicle.model} view ${active + 1}`} className="aspect-[16/7] w-full rounded-[22px] object-cover" />{images.length > 1 && <div className="mt-3 grid grid-cols-4 gap-2">{images.map((image, index) => <button key={image} onClick={() => setActive(index)} className={`overflow-hidden rounded-xl border-2 transition ${active === index ? 'border-[#0071e3]' : 'border-transparent opacity-70 hover:opacity-100'}`} aria-label={`View image ${index + 1}`}><img src={image} alt="" className="aspect-[16/10] w-full object-cover" /></button>)}</div>}</div>;
}

function BookingDialog({ vehicle, user, open, onOpenChange }: { vehicle: Vehicle | null; user: AuthUser | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [form, setForm] = useState({ startDate: '', endDate: '', pickupCity: 'Kimberley', returnCity: 'Kimberley', customer: '', email: '', extras: [] as string[] });
  if (!vehicle) return null;
  const days = form.startDate && form.endDate ? Math.max(1, Math.ceil((new Date(form.endDate).getTime() - new Date(form.startDate).getTime()) / 86400000)) : 0;
  const extrasCost = rentalExtras.filter((extra) => form.extras.includes(extra.id)).reduce((sum, extra) => sum + (extra.pricing === 'daily' ? extra.price * days : extra.price), 0);
  const total = days * vehicle.dailyRate + extrasCost;
  const toggleExtra = (id:string) => setForm({...form, extras: form.extras.includes(id) ? form.extras.filter((item) => item !== id) : [...form.extras,id]});
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const selectedExtras = rentalExtras.filter((extra) => form.extras.includes(extra.id));
    localStorage.setItem(CHECKOUT_KEY, JSON.stringify({
      ...form,
      customer: user?.name || form.customer,
      email: user?.email || form.email,
      vehicle: { id: vehicle.id, brand: vehicle.brand, model: vehicle.model, image: vehicle.image, dailyRate: vehicle.dailyRate },
      days,
      extras: form.extras,
      extrasLabels: selectedExtras.map((extra) => extra.label),
      extrasCost,
      totalCost: total,
    }));
    window.location.href = '/checkout';
  };
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[92vh] overflow-y-auto rounded-[28px] p-0 sm:max-w-xl"><form onSubmit={submit}><div className="p-7 sm:p-8"><DialogHeader><DialogTitle className="text-2xl font-semibold tracking-tight">Complete your booking</DialogTitle><DialogDescription>{vehicle.brand} {vehicle.model} · {currency(vehicle.dailyRate)} per day</DialogDescription></DialogHeader><div className="mt-7 grid gap-4 sm:grid-cols-2"><FormField label="Full name"><Input required autoComplete="name" value={user?.name || form.customer} onChange={e => setForm({...form, customer:e.target.value})} readOnly={!!user}/></FormField><FormField label="Email"><Input required type="email" autoComplete="email" value={user?.email || form.email} onChange={e => setForm({...form, email:e.target.value})} readOnly={!!user}/></FormField><FormField label="Pick-up date"><Input required type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></FormField><FormField label="Return date"><Input required type="date" min={form.startDate} value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></FormField><FormField label="Pick-up city"><NativeSelect className="w-full" value={form.pickupCity} onChange={(e) => setForm({ ...form, pickupCity: e.target.value })}>{cities.map((city) => <NativeSelectOption key={city}>{city}</NativeSelectOption>)}</NativeSelect></FormField><FormField label="Return city"><NativeSelect className="w-full" value={form.returnCity} onChange={(e) => setForm({ ...form, returnCity: e.target.value })}>{cities.map((city) => <NativeSelectOption key={city}>{city}</NativeSelectOption>)}</NativeSelect></FormField></div>
    <div className="mt-7"><div className="flex items-end justify-between gap-4"><div><p className="text-sm font-semibold">Optional extras</p><p className="mt-1 text-xs text-black/40">Add only what you need.</p></div>{extrasCost > 0 && <span className="text-sm font-medium text-[#0071e3]">+{currency(extrasCost)}</span>}</div><div className="mt-3 grid gap-2 sm:grid-cols-2">{rentalExtras.map((extra) => { const checked=form.extras.includes(extra.id); return <label key={extra.id} className={`flex cursor-pointer items-center justify-between gap-3 rounded-2xl border p-3.5 transition ${checked?'border-[#0071e3] bg-blue-50':'border-black/[.07] bg-white hover:border-black/20'}`}><span className="flex items-center gap-3"><input type="checkbox" checked={checked} onChange={() => toggleExtra(extra.id)} className="size-4 accent-[#0071e3]"/><span className="text-sm font-medium">{extra.label}</span></span><span className="text-xs text-black/45">{currency(extra.price)}{extra.pricing==='daily'?'/day':''}</span></label>; })}</div></div>
    <div className="mt-6 rounded-2xl bg-[#f5f5f7] p-5"><div className="flex justify-between text-sm text-black/55"><span>{days} days × {currency(vehicle.dailyRate)}</span><span>{currency(days * vehicle.dailyRate)}</span></div>{extrasCost > 0 && <div className="mt-2 flex justify-between text-sm text-black/55"><span>Extras</span><span>{currency(extrasCost)}</span></div>}<div className="my-4 h-px bg-black/[.07]" /><div className="flex items-end justify-between"><span className="font-medium">Total cost</span><strong className="text-2xl">{currency(total)}</strong></div></div><div className="mt-5 flex items-center gap-2 text-xs text-black/45"><ShieldCheck className="size-4 text-emerald-600" /> Availability and pricing are checked again when you confirm.</div></div><DialogFooter className="rounded-b-[28px] px-7"><Button type="submit" disabled={!days || vehicle.status !== 'Available'} className="h-11 rounded-full bg-[#0071e3] px-6 text-white hover:bg-[#0077ed]">Continue to checkout <ArrowRight /></Button></DialogFooter></form></DialogContent></Dialog>;
}
function FormField({ label, children }: { label: string; children: React.ReactNode }) { return <label><span className="mb-2 block text-xs font-medium text-black/55">{label}</span>{children}</label>; }

type AdminProps = {
  vehicles: Vehicle[]; bookings: Booking[]; tables: DbTable[]; section: Section; setSection: (s: Section) => void;
  sidebar: boolean; setSidebar: (b: boolean) => void; setMode: (m: 'customer' | 'admin') => void; refresh: () => Promise<void>; setToast: (s: string) => void;
  vehicleFormOpen: boolean; setVehicleFormOpen: (b: boolean) => void; tableOpen: boolean; setTableOpen: (b: boolean) => void;
};

function AdminApp(props: AdminProps) {
  const { vehicles, bookings, tables, section, setSection, sidebar, setSidebar, setMode, refresh, setToast, vehicleFormOpen, setVehicleFormOpen, tableOpen, setTableOpen } = props;
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const navigate = (s: Section) => { setSection(s); setSidebar(false); };
  const removeVehicle = async (id: number) => { await fetch('/api/vehicles', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) }); await refresh(); setToast('Vehicle removed.'); };
  return <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]"><aside className={`fixed inset-y-0 left-0 z-50 w-[270px] border-r border-black/[.06] bg-white p-4 transition lg:translate-x-0 ${sidebar ? 'translate-x-0' : '-translate-x-full'}`}><div className="flex h-12 items-center justify-between px-2"><div className="flex items-center gap-2 text-lg font-semibold"><span className="grid size-8 place-items-center rounded-full bg-black text-white"><CarFront className="size-4" /></span>Drift <Badge variant="secondary">Admin</Badge></div><Button size="icon" variant="ghost" className="lg:hidden" onClick={() => setSidebar(false)}><X /></Button></div><nav className="mt-7 space-y-1">{menu.map(({ label, icon: Icon }) => <button key={label} onClick={() => navigate(label)} className={`flex h-11 w-full items-center gap-3 rounded-xl px-3 text-sm transition ${section === label ? 'bg-black text-white' : 'text-black/55 hover:bg-black/[.04] hover:text-black'}`}><Icon className="size-4" />{label}{label === 'Database' && <Badge className="ml-auto bg-blue-50 text-blue-700">Setup</Badge>}</button>)}</nav><div className="absolute inset-x-4 bottom-4 rounded-2xl bg-[#f5f5f7] p-4"><p className="text-xs font-medium">Storage status</p><p className="mt-1 text-[11px] leading-4 text-black/45">Persistent storage is not connected yet. Current server data can reset on restart.</p></div></aside><div className="lg:pl-[270px]"><header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-black/[.06] bg-white/80 px-5 backdrop-blur-2xl lg:px-8"><div className="flex items-center gap-3"><Button size="icon" variant="ghost" className="lg:hidden" onClick={() => setSidebar(true)}><Menu /></Button><div><p className="font-semibold">{section}</p><p className="hidden text-xs text-black/40 sm:block">Rental operations at a glance</p></div></div><Button variant="outline" className="rounded-full" onClick={() => setMode('customer')}><ArrowLeft /> Customer site</Button></header><main className="p-5 lg:p-8"><AdminContent section={section} vehicles={vehicles} bookings={bookings} tables={tables} onAddVehicle={() => { setEditing(null); setVehicleFormOpen(true); }} onEditVehicle={(v) => { setEditing(v); setVehicleFormOpen(true); }} onDeleteVehicle={removeVehicle} onAddTable={() => setTableOpen(true)} onRefresh={refresh} setToast={setToast} /></main></div><VehicleFormDialog open={vehicleFormOpen} onOpenChange={setVehicleFormOpen} vehicle={editing} onSaved={async () => { setVehicleFormOpen(false); await refresh(); setToast(editing ? 'Vehicle updated successfully.' : 'Vehicle added successfully.'); }} /><TableDialog open={tableOpen} onOpenChange={setTableOpen} onSaved={async () => { setTableOpen(false); await refresh(); setToast('New table added to the in-memory schema.'); }} /></div>;
}

function AdminContent({ section, vehicles, bookings, tables, onAddVehicle, onEditVehicle, onDeleteVehicle, onAddTable, onRefresh, setToast }: { section: Section; vehicles: Vehicle[]; bookings: Booking[]; tables: DbTable[]; onAddVehicle: () => void; onEditVehicle: (v: Vehicle) => void; onDeleteVehicle: (id: number) => void; onAddTable: () => void; onRefresh: () => Promise<void>; setToast: (s: string) => void }) {
  if (section === 'Dashboard') return <Dashboard vehicles={vehicles} bookings={bookings} onRefresh={onRefresh} setToast={setToast} />;
  if (section === 'Vehicles') return <VehiclesAdmin vehicles={vehicles} onAdd={onAddVehicle} onEdit={onEditVehicle} onDelete={onDeleteVehicle} />;
  if (section === 'Bookings') return <BookingsTable bookings={bookings} onRefresh={onRefresh} setToast={setToast} />;
  if (section === 'Customers') return <CustomersTable bookings={bookings} />;
  if (section === 'Payments') return <PaymentsTable bookings={bookings} />;
  if (section === 'Reports') return <Reports bookings={bookings} vehicles={vehicles} setToast={setToast} />;
  if (section === 'Database') return <DatabaseManager tables={tables} onAdd={onAddTable} onRefresh={onRefresh} setToast={setToast} />;
  const values = section === 'Brands' ? [...new Set(vehicles.map((v) => v.brand))] : section === 'Categories' ? [...new Set(vehicles.map((v) => v.type))] : features;
  return <SimpleList title={section} values={values} setToast={setToast} />;
}

function Dashboard({ vehicles, bookings, onRefresh, setToast }: { vehicles: Vehicle[]; bookings: Booking[]; onRefresh: () => Promise<void>; setToast: (s:string) => void }) {
  const revenue = bookings.reduce((sum, b) => sum + b.totalCost, 0);
  const cancellationRequests = bookings.filter((b) => b.status === 'Cancellation Requested');
  const updateStatus = async (id:string,status:Booking['status']) => {
    const response = await fetch('/api/bookings',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,status})});
    if (response.ok) { await onRefresh(); setToast(status === 'Cancelled' ? `Cancellation approved for ${id}.` : `Cancellation request cleared for ${id}.`); }
  };
  const cards = [
    { label: 'Total vehicles', value: vehicles.length, note: `${vehicles.filter((v) => v.status === 'Available').length} available`, icon: CarFront, colour: 'bg-blue-50 text-blue-700' },
    { label: 'Active bookings', value: bookings.filter((b) => ['Confirmed', 'Pending', 'Cancellation Requested'].includes(b.status)).length, note: `${bookings.filter((b) => b.status === 'Pending').length} pending`, icon: CalendarDays, colour: 'bg-violet-50 text-violet-700' },
    { label: 'Cancellation requests', value: cancellationRequests.length, note: cancellationRequests.length ? 'Needs admin review' : 'Nothing waiting', icon: ClipboardList, colour: 'bg-red-50 text-red-700' },
    { label: 'Fleet utilisation', value: `${Math.round((vehicles.filter((v) => v.status !== 'Available').length / Math.max(vehicles.length, 1)) * 100)}%`, note: 'Reserved, rented or in service', icon: Gauge, colour: 'bg-amber-50 text-amber-700' },
  ];
  return <div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(({ label, value, note, icon: Icon, colour }) => <div key={label} className="rounded-[24px] border border-black/[.05] bg-white p-6 shadow-sm"><span className={`grid size-10 place-items-center rounded-xl ${colour}`}><Icon className="size-5" /></span><p className="mt-7 text-sm text-black/45">{label}</p><p className="mt-1 text-3xl font-semibold tracking-[-.04em]">{value}</p><p className="mt-2 text-xs text-black/40">{note}</p></div>)}</div>
    {cancellationRequests.length > 0 && <div className="mt-5 rounded-[24px] border border-amber-200 bg-amber-50/70 p-6"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold tracking-[.12em] text-amber-700">ACTION NEEDED</p><h2 className="mt-1 text-xl font-semibold">Cancellation requests</h2></div><span className="text-sm text-amber-800">{cancellationRequests.length} waiting</span></div><div className="mt-5 space-y-3">{cancellationRequests.map((booking) => <div key={booking.id} className="flex flex-col gap-4 rounded-2xl bg-white p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium">{booking.vehicle}</p><p className="mt-1 text-xs text-black/45">{booking.customer} · {booking.id} · {booking.startDate} → {booking.endDate}</p></div><div className="flex gap-2"><Button variant="outline" className="rounded-full" onClick={() => updateStatus(booking.id,'Confirmed')}>Keep booking</Button><Button className="rounded-full bg-red-600 text-white hover:bg-red-700" onClick={() => updateStatus(booking.id,'Cancelled')}>Approve cancellation</Button></div></div>)}</div></div>}
    <div className="mt-5 grid gap-5 xl:grid-cols-[1.5fr_1fr]"><div className="rounded-[24px] border border-black/[.05] bg-white p-6"><div className="flex items-center justify-between"><div><h2 className="font-semibold">Booking value</h2><p className="mt-1 text-xs text-black/40">Submitted booking total</p></div></div><p className="mt-10 text-4xl font-semibold">{currency(revenue)}</p><p className="mt-3 text-sm text-black/45">{bookings.length ? `${bookings.length} submitted bookings` : 'No bookings yet'}</p></div><div className="rounded-[24px] border border-black/[.05] bg-white p-6"><h2 className="font-semibold">Recent bookings</h2><div className="mt-5 space-y-4">{bookings.slice(0, 4).map((b) => <div key={b.id} className="flex items-center justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-medium">{b.customer}</p><p className="truncate text-xs text-black/40">{b.vehicle}</p></div><Badge className={`border-0 ${statusClass(b.status)}`}>{b.status}</Badge></div>)}</div></div></div></div>;
}
function VehiclesAdmin({ vehicles, onAdd, onEdit, onDelete }: { vehicles: Vehicle[]; onAdd: () => void; onEdit: (v: Vehicle) => void; onDelete: (id: number) => void }) {
  return <div><AdminHeading title="Fleet vehicles" subtitle="Add, update and remove vehicle records." action={<Button onClick={onAdd} className="rounded-full bg-[#0071e3] px-5 text-white"><Plus /> Add vehicle</Button>} /><div className="mt-6 overflow-hidden rounded-[24px] border border-black/[.05] bg-white"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-[#fafafa] text-xs text-black/40"><tr>{['Vehicle','Registration','Daily rate','Transmission','Status',''].map((h) => <th key={h} className="px-5 py-4 font-medium">{h}</th>)}</tr></thead><tbody>{vehicles.map((v) => <tr key={v.id} className="border-t border-black/[.05]"><td className="px-5 py-4"><div className="flex items-center gap-3"><img src={v.image} alt="" className="size-11 rounded-xl object-cover" /><div><p className="font-medium">{v.brand} {v.model}</p><p className="text-xs text-black/40">{v.year} · {v.type}</p></div></div></td><td className="px-5 py-4 text-black/55">{v.registration}</td><td className="px-5 py-4 font-medium">{currency(v.dailyRate)}</td><td className="px-5 py-4 text-black/55">{v.transmission}</td><td className="px-5 py-4"><Badge className={`border-0 ${statusClass(v.status)}`}>{v.status}</Badge></td><td className="px-5 py-4"><div className="flex justify-end gap-1"><Button size="icon-sm" variant="ghost" aria-label="Edit vehicle" onClick={() => onEdit(v)}><Pencil /></Button><Button size="icon-sm" variant="destructive" aria-label="Delete vehicle" onClick={() => onDelete(v.id)}><Trash2 /></Button></div></td></tr>)}</tbody></table></div></div></div>;
}

function BookingsTable({ bookings, onRefresh, setToast }: { bookings: Booking[]; onRefresh: () => Promise<void>; setToast: (s:string) => void }) {
  const [view,setView] = useState<'calendar'|'table'>('calendar');
  const [month,setMonth] = useState(() => { const seed = bookings[0]?.startDate ? new Date(bookings[0].startDate + 'T12:00:00') : new Date(); return new Date(seed.getFullYear(),seed.getMonth(),1); });
  const updateStatus = async (id:string,status:Booking['status']) => {
    const response = await fetch('/api/bookings',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,status})});
    if (response.ok) { await onRefresh(); setToast(`Booking ${id} updated to ${status}.`); } else setToast('Booking status could not be updated.');
  };
  const allowed: Booking['status'][] = ['Confirmed','Pending','Cancellation Requested','Completed','Cancelled'];
  const daysInMonth = new Date(month.getFullYear(),month.getMonth()+1,0).getDate();
  const firstDay = new Date(month.getFullYear(),month.getMonth(),1).getDay();
  const cells = Array.from({length:firstDay + daysInMonth},(_,index) => index < firstDay ? null : index-firstDay+1);
  const monthLabel = month.toLocaleDateString('en-ZA',{month:'long',year:'numeric'});
  return <div><AdminHeading title="Bookings" subtitle="Review bookings in a calendar or table and update only the operational status." action={<div className="flex rounded-full bg-white p-1 shadow-sm"><Button size="sm" variant={view==='calendar'?'default':'ghost'} className="rounded-full" onClick={() => setView('calendar')}><CalendarDays/> Calendar</Button><Button size="sm" variant={view==='table'?'default':'ghost'} className="rounded-full" onClick={() => setView('table')}><Table2/> Table</Button></div>} />
    {view==='calendar' ? <div className="mt-6 rounded-[24px] border border-black/[.05] bg-white p-4 sm:p-6"><div className="flex items-center justify-between"><Button size="icon" variant="ghost" aria-label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(),month.getMonth()-1,1))}><ChevronLeft/></Button><h2 className="font-semibold">{monthLabel}</h2><Button size="icon" variant="ghost" aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(),month.getMonth()+1,1))}><ChevronRight/></Button></div><div className="mt-5 grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-black/35">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((day)=><div key={day} className="py-2">{day}</div>)}</div><div className="grid grid-cols-7 gap-1">{cells.map((day,index) => { if(!day) return <div key={`blank-${index}`} className="min-h-24 rounded-xl bg-black/[.015]"/>; const date = `${month.getFullYear()}-${String(month.getMonth()+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`; const items = bookings.filter((booking) => booking.startDate <= date && booking.endDate >= date && booking.status !== 'Cancelled'); return <div key={date} className="min-h-24 rounded-xl border border-black/[.05] p-2"><p className="text-xs font-medium text-black/45">{day}</p><div className="mt-2 space-y-1">{items.slice(0,3).map((booking)=><div key={booking.id} title={`${booking.vehicle} · ${booking.customer}`} className={`truncate rounded-lg px-2 py-1 text-[10px] ${statusClass(booking.status)}`}>{booking.vehicle}</div>)}{items.length>3 && <p className="text-[10px] text-black/35">+{items.length-3} more</p>}</div></div>; })}</div></div> : <DataTable headers={['Reference','Customer','Vehicle','Dates','Route','Total','Status']} rows={bookings.map((b) => [b.id, b.customer, b.vehicle, `${b.startDate} → ${b.endDate}`, `${b.pickupCity} → ${b.returnCity}`, currency(b.totalCost), <NativeSelect key={b.id} className="min-w-44" value={b.status} onChange={(event) => updateStatus(b.id,event.target.value as Booking['status'])}>{allowed.map((status)=><NativeSelectOption key={status}>{status}</NativeSelectOption>)}</NativeSelect>])} />}
  </div>;
}
function CustomersTable({bookings}:{bookings:Booking[]}) { const customers = [...new Map(bookings.map(b => [b.email,b])).values()]; return <div><AdminHeading title="Customers" subtitle="Customers from submitted bookings."/><DataTable headers={['Name','Email','Bookings']} rows={customers.map(c=>[c.customer,c.email,bookings.filter(b=>b.email===c.email).length])}/></div>; }
function PaymentsTable({bookings}:{bookings:Booking[]}) { return <div><AdminHeading title="Payments" subtitle="Payment records will sync here once a payment provider is connected."/><DataTable headers={['Booking','Customer','Amount','Status']} rows={bookings.map(b=>[b.id,b.customer,currency(b.totalCost),'Pending'])}/></div>; }

function Reports({ bookings, vehicles, setToast }: { bookings: Booking[]; vehicles: Vehicle[]; setToast: (s: string) => void }) {
  const total = bookings.reduce((sum, b) => sum + b.totalCost, 0);
  const reports = [
    { title: 'Revenue report', desc: 'Booking value by month and payment status.', value: currency(total), icon: CircleDollarSign, colour: 'bg-emerald-50 text-emerald-700' },
    { title: 'Fleet utilisation', desc: 'Availability, rentals and maintenance status.', value: `${vehicles.filter((v) => v.status === 'Available').length}/${vehicles.length} available`, icon: Gauge, colour: 'bg-blue-50 text-blue-700' },
    { title: 'Booking status', desc: 'Confirmed, pending and completed bookings.', value: `${bookings.length} records`, icon: ClipboardList, colour: 'bg-violet-50 text-violet-700' },
    { title: 'Top vehicles', desc: 'Most booked vehicles and revenue contribution.', value: bookings.length ? [...bookings].sort((a,b)=>bookings.filter(x=>x.vehicleId===b.vehicleId).length-bookings.filter(x=>x.vehicleId===a.vehicleId).length)[0].vehicle : 'No bookings yet', icon: CarFront, colour: 'bg-amber-50 text-amber-700' },
  ];
  const download = (title: string) => { const content = `Drift Car Rental - ${title}\nGenerated: ${new Date().toLocaleDateString('en-ZA')}\nCurrent application data\n\nTotal bookings: ${bookings.length}\nTotal booking value: ${currency(total)}\nFleet size: ${vehicles.length}`; const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([content], { type: 'text/plain' })); link.download = `${title.toLowerCase().replaceAll(' ', '-')}.txt`; link.click(); setToast(`${title} downloaded.`); };
  return <div><AdminHeading title="Reports" subtitle="Operational reports generated from current booking and fleet data." /><div className="mt-6 grid gap-5 md:grid-cols-2">{reports.map(({ title, desc, value, icon: Icon, colour }) => <div key={title} className="rounded-[24px] border border-black/[.05] bg-white p-6"><div className="flex items-start justify-between"><span className={`grid size-11 place-items-center rounded-2xl ${colour}`}><Icon className="size-5" /></span><Button variant="ghost" size="icon" aria-label={`Download ${title}`} onClick={() => download(title)}><Download /></Button></div><h3 className="mt-7 text-lg font-semibold">{title}</h3><p className="mt-1 text-sm text-black/45">{desc}</p><p className="mt-5 text-2xl font-semibold tracking-tight">{value}</p></div>)}</div></div>;
}

function DatabaseManager({ tables, onAdd, onRefresh, setToast }: { tables: DbTable[]; onAdd: () => void; onRefresh: () => Promise<void>; setToast: (s: string) => void }) {
  const [active, setActive] = useState<DbTable | null>(null);
  const remove = async (name: string) => { await fetch('/api/database', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) }); await onRefresh(); if (active?.name === name) setActive(null); setToast(`Table ${name} removed.`); };
  return <div><AdminHeading title="Database management" subtitle="Prepare the data structure for the persistent database connection." action={<Button onClick={onAdd} className="rounded-full bg-[#0071e3] px-5 text-white"><Plus /> Create table</Button>} /><div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800"><strong>Storage not connected:</strong> these changes currently live in server memory and can reset when the app restarts.</div><div className="mt-6 grid gap-5 xl:grid-cols-[1fr_1.25fr]"><div className="space-y-3">{tables.map((table) => <button key={table.name} onClick={() => setActive(table)} className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition ${active?.name === table.name ? 'border-[#0071e3] bg-blue-50' : 'border-black/[.05] bg-white hover:border-black/15'}`}><span className="grid size-10 place-items-center rounded-xl bg-[#f5f5f7]"><Table2 className="size-4" /></span><span className="min-w-0 flex-1"><strong className="block text-sm">{table.name}</strong><span className="text-xs text-black/40">{table.rows} records · {table.fields.length} fields</span></span><ChevronRight className="size-4 text-black/30" /></button>)}</div><div className="min-h-80 rounded-[24px] border border-black/[.05] bg-white p-6">{active ? <><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-medium text-[#0071e3]">TABLE STRUCTURE</p><h3 className="mt-1 text-2xl font-semibold">{active.name}</h3></div><Button variant="destructive" size="sm" onClick={() => remove(active.name)}><Trash2 /> Delete table</Button></div><div className="mt-6 overflow-hidden rounded-2xl border border-black/[.06]"><div className="grid grid-cols-[1fr_110px] bg-[#fafafa] px-4 py-3 text-xs text-black/40"><span>Field name</span><span>Suggested type</span></div>{active.fields.map((field, index) => <div key={field} className="grid grid-cols-[1fr_110px] border-t border-black/[.05] px-4 py-3 text-sm"><span className="font-mono text-xs">{field}</span><span className="text-xs text-black/45">{index === 0 ? 'INTEGER' : field.includes('date') ? 'DATE' : field.includes('cost') || field.includes('rate') || field === 'amount' ? 'DECIMAL' : 'VARCHAR'}</span></div>)}</div><div className="mt-5 flex flex-wrap gap-2"><Button variant="secondary" onClick={() => setToast('Record added for this session.')}><Plus /> Add record</Button><Button variant="outline" onClick={() => setToast('Record editor opened.')}><Pencil /> Update record</Button><Button variant="destructive" onClick={() => setToast('Record deleted.')}><Trash2 /> Delete record</Button></div></> : <div className="grid h-full min-h-72 place-items-center text-center"><div><Database className="mx-auto size-9 text-black/20" /><h3 className="mt-4 font-semibold">Select a table</h3><p className="mt-1 text-sm text-black/40">View its structure and manage records.</p></div></div>}</div></div></div>;
}

function SimpleList({ title, values, setToast }: { title: string; values: string[]; setToast: (s: string) => void }) { const [items, setItems] = useState(values); const [value, setValue] = useState(''); useEffect(() => setItems(values), [values]); const add = () => { if (!value.trim()) return; setItems([...items, value.trim()]); setValue(''); setToast(`${title.slice(0, -1)} added.`); }; return <div><AdminHeading title={title} subtitle={`Manage ${title.toLowerCase()} used throughout the system.`} /><div className="mt-6 grid gap-5 xl:grid-cols-[1fr_340px]"><div className="overflow-hidden rounded-[24px] border border-black/[.05] bg-white">{items.map((item, index) => <div key={item} className="flex items-center justify-between border-b border-black/[.05] px-5 py-4 last:border-0"><div><p className="font-medium">{item}</p><p className="text-xs text-black/40">ID {String(index + 1).padStart(3, '0')}</p></div><Button variant="destructive" size="icon-sm" onClick={() => setItems(items.filter((i) => i !== item))}><Trash2 /></Button></div>)}</div><div className="h-fit rounded-[24px] border border-black/[.05] bg-white p-6"><h3 className="font-semibold">Add {title.slice(0, -1).toLowerCase()}</h3><Input className="mt-4" placeholder={`New ${title.slice(0, -1).toLowerCase()} name`} value={value} onChange={(e) => setValue(e.target.value)} /><Button onClick={add} className="mt-3 w-full rounded-full bg-[#0071e3] text-white"><Plus /> Add</Button></div></div></div>; }

function VehicleFormDialog({ open, onOpenChange, vehicle, onSaved }: { open: boolean; onOpenChange: (b: boolean) => void; vehicle: Vehicle | null; onSaved: () => void }) {
  const blank = useMemo(() => ({ brand: '', model: '', year: 2025, type: 'Hatchback' as Vehicle['type'], registration: '', dailyRate: 450, transmission: 'Automatic' as Vehicle['transmission'], doors: 5, colour: '', status: 'Available' as Vehicle['status'], features: ['Bluetooth'], image: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1400&q=85', description: '' }), []);
  const [form, setForm] = useState<Omit<Vehicle, 'id'>>(blank);
  useEffect(() => { setForm(vehicle ? { ...vehicle } : blank); }, [vehicle, open, blank]);
  const submit = async (e: FormEvent) => { e.preventDefault(); await fetch('/api/vehicles', { method: vehicle ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(vehicle ? { ...form, id: vehicle.id } : form) }); onSaved(); };
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[94vh] overflow-y-auto rounded-[28px] p-0 sm:max-w-2xl"><form onSubmit={submit}><div className="p-7"><DialogHeader><DialogTitle className="text-2xl">{vehicle ? 'Edit vehicle' : 'Add vehicle'}</DialogTitle><DialogDescription>Complete the planned vehicle fields. Images use a URL until file storage is added.</DialogDescription></DialogHeader><div className="mt-6 grid gap-4 sm:grid-cols-2"><FormField label="Brand"><Input required value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} /></FormField><FormField label="Model"><Input required value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} /></FormField><FormField label="Year"><Input required type="number" value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} /></FormField><FormField label="Vehicle type"><NativeSelect className="w-full" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as Vehicle['type'] })}>{['Hatchback','Sedan','SUV','Bakkie'].map((v) => <NativeSelectOption key={v}>{v}</NativeSelectOption>)}</NativeSelect></FormField><FormField label="Registration number"><Input required value={form.registration} onChange={(e) => setForm({ ...form, registration: e.target.value })} /></FormField><FormField label="Daily rental price"><Input required type="number" value={form.dailyRate} onChange={(e) => setForm({ ...form, dailyRate: Number(e.target.value) })} /></FormField><FormField label="Transmission"><NativeSelect className="w-full" value={form.transmission} onChange={(e) => setForm({ ...form, transmission: e.target.value as Vehicle['transmission'] })}>{['Automatic','Manual'].map((v) => <NativeSelectOption key={v}>{v}</NativeSelectOption>)}</NativeSelect></FormField><FormField label="Doors"><Input required type="number" min="2" max="5" value={form.doors} onChange={(e) => setForm({ ...form, doors: Number(e.target.value) })} /></FormField><FormField label="Colour"><Input required value={form.colour} onChange={(e) => setForm({ ...form, colour: e.target.value })} /></FormField><FormField label="Status"><NativeSelect className="w-full" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Vehicle['status'] })}>{['Available','Reserved','Rented','Maintenance'].map((v) => <NativeSelectOption key={v}>{v}</NativeSelectOption>)}</NativeSelect></FormField><div className="sm:col-span-2"><FormField label="Main image URL"><Input required type="url" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} /></FormField></div><div className="sm:col-span-2"><FormField label="Description"><Textarea required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></FormField></div></div></div><DialogFooter className="rounded-b-[28px] px-7"><Button type="submit" className="rounded-full bg-[#0071e3] px-6 text-white">{vehicle ? 'Save changes' : 'Add vehicle'}</Button></DialogFooter></form></DialogContent></Dialog>;
}

function TableDialog({ open, onOpenChange, onSaved }: { open: boolean; onOpenChange: (b: boolean) => void; onSaved: () => void }) { const [name, setName] = useState(''); const [fields, setFields] = useState('id, name, created_at'); const submit = async (e: FormEvent) => { e.preventDefault(); await fetch('/api/database', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, fields: fields.split(',').map((f) => f.trim()).filter(Boolean) }) }); setName(''); onSaved(); }; return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="rounded-[28px] sm:max-w-md"><form onSubmit={submit}><DialogHeader><DialogTitle className="text-xl">Create a new table</DialogTitle><DialogDescription>Add a table definition for the current session. Persistent storage will take over when the database is connected.</DialogDescription></DialogHeader><div className="mt-5 space-y-4"><FormField label="Table name"><Input required placeholder="e.g. Insurance_Claims" value={name} onChange={(e) => setName(e.target.value)} /></FormField><FormField label="Fields (comma-separated)"><Textarea required value={fields} onChange={(e) => setFields(e.target.value)} /></FormField></div><Button type="submit" className="mt-6 w-full rounded-full bg-[#0071e3] text-white">Create table</Button></form></DialogContent></Dialog>; }

function AdminHeading({ title, subtitle, action }: { title: string; subtitle: string; action?: React.ReactNode }) { return <div className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-3xl font-semibold tracking-[-.04em]">{title}</h1><p className="mt-1 text-sm text-black/45">{subtitle}</p></div>{action}</div>; }
function DataTable({ headers, rows }: { headers: string[]; rows: React.ReactNode[][] }) { return <div className="mt-6 overflow-hidden rounded-[24px] border border-black/[.05] bg-white"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-[#fafafa] text-xs text-black/40"><tr>{headers.map((h) => <th key={h} className="whitespace-nowrap px-5 py-4 font-medium">{h}</th>)}</tr></thead><tbody>{rows.length === 0 && <tr><td colSpan={headers.length} className="p-8 text-center text-black/45">No records yet.</td></tr>}{rows.map((row, i) => <tr key={i} className="border-t border-black/[.05]">{row.map((cell, j) => <td key={j} className="whitespace-nowrap px-5 py-4 first:font-medium">{cell}</td>)}</tr>)}</tbody></table></div></div>; }
function Toast({ message }: { message: string }) { return <div className="fixed bottom-6 left-1/2 z-[100] flex -translate-x-1/2 items-center gap-2 rounded-full bg-black px-5 py-3 text-sm text-white shadow-2xl"><Check className="size-4 text-emerald-400" />{message}</div>; }
