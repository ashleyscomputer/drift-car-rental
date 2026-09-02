'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft, ArrowRight, CalendarDays, CarFront, Check, ChevronRight,
  CircleDollarSign, ClipboardList, Database, Download, FileBarChart, Gauge, LayoutDashboard,
  Menu, Pencil, Plus, Search, Settings2, ShieldCheck, Sparkles, Table2, Trash2,
  Users, WalletCards, X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import type { Booking, Vehicle } from '@/lib/store';

type Section = 'Dashboard' | 'Vehicles' | 'Brands' | 'Categories' | 'Features' | 'Customers' | 'Bookings' | 'Payments' | 'Reports' | 'Database';
type DbTable = { name: string; rows: number; fields: string[] };

const features = ['Bluetooth', 'GPS', 'Air conditioning', 'Reverse camera', 'Cruise control', 'Apple CarPlay'];
const cities = ['Kimberley', 'Upington', 'Bloemfontein', 'Johannesburg', 'Cape Town'];
const menu: { label: Section; icon: typeof LayoutDashboard }[] = [
  { label: 'Dashboard', icon: LayoutDashboard }, { label: 'Vehicles', icon: CarFront },
  { label: 'Brands', icon: Sparkles }, { label: 'Categories', icon: Table2 },
  { label: 'Features', icon: Settings2 }, { label: 'Customers', icon: Users },
  { label: 'Bookings', icon: ClipboardList }, { label: 'Payments', icon: WalletCards },
  { label: 'Reports', icon: FileBarChart }, { label: 'Database', icon: Database },
];
const seededCustomers = [
  { id: 'CU-201', name: 'Naledi Molefe', email: 'naledi@example.com', phone: '071 555 0134', bookings: 4 },
  { id: 'CU-202', name: 'Liam Daniels', email: 'liam@example.com', phone: '082 111 4830', bookings: 2 },
  { id: 'CU-203', name: 'Thabo Mokoena', email: 'thabo@example.com', phone: '073 820 1944', bookings: 6 },
  { id: 'CU-204', name: 'Aaliyah Jacobs', email: 'aaliyah@example.com', phone: '076 332 9931', bookings: 3 },
];
const seededPayments = [
  { id: 'PAY-8842', bookingId: 'BK-1048', amount: 3160, date: '2026-09-01', status: 'Paid' },
  { id: 'PAY-8841', bookingId: 'BK-1047', amount: 1350, date: '2026-09-01', status: 'Pending' },
  { id: 'PAY-8839', bookingId: 'BK-1046', amount: 4900, date: '2026-08-27', status: 'Paid' },
  { id: 'PAY-8836', bookingId: 'BK-1045', amount: 2500, date: '2026-08-25', status: 'Paid' },
];

const currency = (value: number) => `R${value.toLocaleString('en-ZA')}`;
const statusClass = (status: string) => status === 'Available' || status === 'Confirmed' || status === 'Paid' || status === 'Completed'
  ? 'bg-emerald-50 text-emerald-700' : status === 'Pending' || status === 'Maintenance' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700';

export default function RentalApp() {
  const [mode, setMode] = useState<'customer' | 'admin'>('customer');
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
  const [filters, setFilters] = useState({ brand: 'All', model: 'All', type: 'All', year: 'All', maxPrice: '1500', transmission: 'All', features: [] as string[] });

  const refresh = async () => {
    const [v, b, t] = await Promise.all([fetch('/api/vehicles'), fetch('/api/bookings'), fetch('/api/database')]);
    setVehicles(await v.json()); setBookings(await b.json()); setTables(await t.json());
  };
  useEffect(() => { refresh(); }, []);
  useEffect(() => { if (!toast) return; const timeout = setTimeout(() => setToast(''), 2800); return () => clearTimeout(timeout); }, [toast]);

  const brands = [...new Set(vehicles.map((v) => v.brand))];
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

  if (mode === 'admin') {
    return <AdminApp {...{ vehicles, bookings, tables, section, setSection, sidebar, setSidebar, setMode, refresh, setToast, vehicleFormOpen, setVehicleFormOpen, tableOpen, setTableOpen }} />;
  }

  return (
    <main className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      <Header onAdmin={() => setMode('admin')} />
      <section className="mx-auto max-w-7xl px-5 pb-12 pt-8 lg:px-8 lg:pt-12">
        <div className="relative min-h-[520px] overflow-hidden rounded-[36px] bg-[#dfe8ef] shadow-[0_24px_80px_rgba(0,0,0,.12)]">
          <img src="/og.png" alt="Two premium Drift rental vehicles" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/45 to-transparent" />
          <div className="relative z-10 flex min-h-[520px] max-w-2xl flex-col justify-end p-7 sm:p-12 lg:p-16">
            <p className="mb-3 text-xs font-semibold tracking-[.18em] text-[#0071e3]">EFFORTLESS CAR RENTAL</p>
            <h1 className="max-w-xl text-5xl font-semibold leading-[.96] tracking-[-.055em] sm:text-6xl">Find your next drive.</h1>
            <p className="mt-5 max-w-lg text-lg leading-7 text-black/60">Choose the right car, see the full price and book in minutes. No queues. No surprises.</p>
            <a href="#browse" className="mt-7 inline-flex w-fit items-center gap-2 rounded-full bg-[#0071e3] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#0077ed]">Browse vehicles <ArrowRight className="size-4" /></a>
          </div>
        </div>
      </section>

      <section id="browse" className="mx-auto max-w-7xl scroll-mt-24 px-5 pb-28 lg:px-8">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-medium text-[#0071e3]">Available now</p><h2 className="mt-1 text-3xl font-semibold tracking-[-.04em] sm:text-4xl">Choose your drive.</h2></div><p className="text-sm text-black/45">{filtered.length} vehicles match</p></div>
        <div className="rounded-[28px] border border-black/[.06] bg-white p-4 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            <FilterSelect label="Brand" value={filters.brand} values={['All', ...brands]} onChange={(brand) => setFilters({ ...filters, brand, model: 'All' })} />
            <FilterSelect label="Model" value={filters.model} values={['All', ...models]} onChange={(model) => setFilters({ ...filters, model })} />
            <FilterSelect label="Vehicle type" value={filters.type} values={['All', 'Hatchback', 'Sedan', 'SUV', 'Bakkie']} onChange={(type) => setFilters({ ...filters, type })} />
            <FilterSelect label="Year" value={filters.year} values={['All', '2025', '2024']} onChange={(year) => setFilters({ ...filters, year })} />
            <FilterSelect label="Transmission" value={filters.transmission} values={['All', 'Automatic', 'Manual']} onChange={(transmission) => setFilters({ ...filters, transmission })} />
            <label className="rounded-2xl bg-[#f5f5f7] px-4 py-3"><span className="block text-[11px] text-black/45">Maximum daily rate</span><span className="mt-1 block text-sm font-medium">{currency(Number(filters.maxPrice))}</span><input className="mt-2 w-full accent-[#0071e3]" type="range" min="350" max="1500" step="50" value={filters.maxPrice} onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })} /></label>
            <Button variant="secondary" className="h-auto min-h-16 rounded-2xl" onClick={() => setFilters({ brand: 'All', model: 'All', type: 'All', year: 'All', maxPrice: '1500', transmission: 'All', features: [] })}><X /> Clear filters</Button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 border-t border-black/[.05] pt-3">
            <span className="mr-1 flex items-center text-xs text-black/45">Extras</span>
            {features.map((feature) => { const active = filters.features.includes(feature); return <label key={feature} className={`flex cursor-pointer items-center gap-2 rounded-full px-3 py-2 text-xs transition ${active ? 'bg-blue-50 text-blue-700' : 'bg-[#f5f5f7] text-black/60'}`}><input type="checkbox" className="size-4 accent-[#0071e3]" checked={active} onChange={() => setFilters({ ...filters, features: active ? filters.features.filter((f) => f !== feature) : [...filters.features, feature] })} />{feature}</label>; })}
          </div>
        </div>

        {filtered.length ? <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{filtered.map((vehicle) => <VehicleCard key={vehicle.id} vehicle={vehicle} onView={() => setSelected(vehicle)} onBook={() => openBooking(vehicle)} />)}</div> : <div className="mt-6 rounded-[28px] bg-white p-16 text-center"><Search className="mx-auto size-8 text-black/25" /><h3 className="mt-4 font-semibold">No vehicles found</h3><p className="mt-1 text-sm text-black/45">Try widening your search filters.</p></div>}
      </section>

      <VehicleDialog vehicle={selected} open={!!selected && !bookingOpen} onOpenChange={(open) => !open && setSelected(null)} onBook={() => selected && openBooking(selected)} />
      <BookingDialog vehicle={selected} open={bookingOpen} onOpenChange={setBookingOpen} onBooked={() => { setBookingOpen(false); setSelected(null); setToast('Booking confirmed — your reference is ready.'); refresh(); }} />
      {toast && <Toast message={toast} />}
    </main>
  );
}

function Header({ onAdmin }: { onAdmin: () => void }) {
  return <header className="sticky top-0 z-40 border-b border-black/5 bg-white/78 backdrop-blur-2xl"><div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8"><a href="#" className="flex items-center gap-2 text-lg font-semibold tracking-tight"><span className="grid size-8 place-items-center rounded-full bg-black text-white"><CarFront className="size-4" /></span>Drift</a><nav className="hidden items-center gap-8 text-sm text-black/55 md:flex"><a href="#browse" className="hover:text-black">Vehicles</a><a href="#" className="hover:text-black">My bookings</a><a href="#" className="hover:text-black">How it works</a></nav><Button onClick={onAdmin} className="h-9 rounded-full bg-black px-5 text-white hover:bg-black/80">Admin portal</Button></div></header>;
}

function FilterSelect({ label, value, values, onChange }: { label: string; value: string; values: string[]; onChange: (value: string) => void }) {
  return <label className="rounded-2xl bg-[#f5f5f7] px-3 py-3"><span className="mb-1 block px-1 text-[11px] text-black/45">{label}</span><NativeSelect className="w-full" value={value} onChange={(e) => onChange(e.target.value)}>{values.map((item) => <NativeSelectOption key={item}>{item}</NativeSelectOption>)}</NativeSelect></label>;
}

function VehicleCard({ vehicle, onView, onBook }: { vehicle: Vehicle; onView: () => void; onBook: () => void }) {
  return <article className="group overflow-hidden rounded-[28px] bg-white shadow-[0_1px_0_rgba(0,0,0,.04),0_16px_40px_rgba(0,0,0,.05)]"><button onClick={onView} className="relative block aspect-[4/2.65] w-full overflow-hidden bg-black/5 text-left"><img src={vehicle.image} alt={`${vehicle.brand} ${vehicle.model}`} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" /><Badge className={`absolute left-4 top-4 border-0 ${statusClass(vehicle.status)}`}>{vehicle.status}</Badge></button><div className="p-6"><div className="flex items-start justify-between gap-4"><div><h3 className="text-lg font-semibold tracking-tight">{vehicle.brand} {vehicle.model}</h3><p className="mt-1 text-sm text-black/45">{vehicle.year} · {vehicle.type} · {vehicle.transmission}</p></div><p className="text-right text-xs text-black/45"><strong className="block text-xl text-black">{currency(vehicle.dailyRate)}</strong>per day</p></div><div className="mt-5 flex gap-2"><Button variant="secondary" onClick={onView} className="h-10 flex-1 rounded-full">Details</Button><Button onClick={onBook} disabled={vehicle.status !== 'Available'} className="h-10 flex-1 rounded-full bg-[#0071e3] text-white hover:bg-[#0077ed]">Book now</Button></div></div></article>;
}

function VehicleDialog({ vehicle, open, onOpenChange, onBook }: { vehicle: Vehicle | null; open: boolean; onOpenChange: (open: boolean) => void; onBook: () => void }) {
  if (!vehicle) return null;
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[92vh] overflow-y-auto rounded-[28px] p-0 sm:max-w-3xl"><img src={vehicle.image} alt={`${vehicle.brand} ${vehicle.model}`} className="aspect-[16/7] w-full rounded-t-[28px] object-cover" /><div className="p-7 sm:p-8"><DialogHeader><div className="flex flex-wrap items-start justify-between gap-4"><div><DialogTitle className="text-3xl font-semibold tracking-[-.04em]">{vehicle.brand} {vehicle.model}</DialogTitle><DialogDescription className="mt-2">{vehicle.description}</DialogDescription></div><div className="text-right"><strong className="text-2xl">{currency(vehicle.dailyRate)}</strong><span className="block text-xs text-black/45">per day</span></div></div></DialogHeader><div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">{[['Year', vehicle.year], ['Type', vehicle.type], ['Transmission', vehicle.transmission], ['Doors', vehicle.doors]].map(([k, v]) => <div key={k} className="rounded-2xl bg-[#f5f5f7] p-4"><p className="text-xs text-black/45">{k}</p><p className="mt-1 font-medium">{v}</p></div>)}</div><div className="mt-7"><h4 className="font-medium">Included features</h4><div className="mt-3 flex flex-wrap gap-2">{vehicle.features.map((item) => <span key={item} className="flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-2 text-xs text-blue-700"><Check className="size-3" />{item}</span>)}</div></div><Button onClick={onBook} disabled={vehicle.status !== 'Available'} className="mt-8 h-12 w-full rounded-full bg-[#0071e3] text-white hover:bg-[#0077ed]">Book this vehicle <ArrowRight /></Button></div></DialogContent></Dialog>;
}

function BookingDialog({ vehicle, open, onOpenChange, onBooked }: { vehicle: Vehicle | null; open: boolean; onOpenChange: (open: boolean) => void; onBooked: () => void }) {
  const [form, setForm] = useState({ startDate: '2026-09-05', endDate: '2026-09-08', pickupCity: 'Kimberley', returnCity: 'Kimberley', customer: 'Demo Customer', email: 'demo@drift.co.za' });
  if (!vehicle) return null;
  const days = Math.max(1, Math.ceil((new Date(form.endDate).getTime() - new Date(form.startDate).getTime()) / 86400000));
  const total = days * vehicle.dailyRate;
  const submit = async (e: FormEvent) => { e.preventDefault(); const response = await fetch('/api/bookings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, vehicleId: vehicle.id, vehicle: `${vehicle.brand} ${vehicle.model}`, totalCost: total }) }); if (response.ok) onBooked(); };
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[92vh] overflow-y-auto rounded-[28px] p-0 sm:max-w-xl"><form onSubmit={submit}><div className="p-7 sm:p-8"><DialogHeader><DialogTitle className="text-2xl font-semibold tracking-tight">Complete your booking</DialogTitle><DialogDescription>{vehicle.brand} {vehicle.model} · {currency(vehicle.dailyRate)} per day</DialogDescription></DialogHeader><div className="mt-7 grid gap-4 sm:grid-cols-2"><FormField label="Pick-up date"><Input required type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></FormField><FormField label="Return date"><Input required type="date" min={form.startDate} value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></FormField><FormField label="Pick-up city"><NativeSelect className="w-full" value={form.pickupCity} onChange={(e) => setForm({ ...form, pickupCity: e.target.value })}>{cities.map((city) => <NativeSelectOption key={city}>{city}</NativeSelectOption>)}</NativeSelect></FormField><FormField label="Return city"><NativeSelect className="w-full" value={form.returnCity} onChange={(e) => setForm({ ...form, returnCity: e.target.value })}>{cities.map((city) => <NativeSelectOption key={city}>{city}</NativeSelectOption>)}</NativeSelect></FormField></div><div className="mt-6 rounded-2xl bg-[#f5f5f7] p-5"><div className="flex justify-between text-sm text-black/55"><span>{days} days × {currency(vehicle.dailyRate)}</span><span>{currency(total)}</span></div><div className="my-4 h-px bg-black/[.07]" /><div className="flex items-end justify-between"><span className="font-medium">Total cost</span><strong className="text-2xl">{currency(total)}</strong></div></div><div className="mt-5 flex items-center gap-2 text-xs text-black/45"><ShieldCheck className="size-4 text-emerald-600" /> Demo booking — no payment will be processed.</div></div><DialogFooter className="rounded-b-[28px] px-7"><Button type="submit" className="h-11 rounded-full bg-[#0071e3] px-6 text-white hover:bg-[#0077ed]">Confirm booking</Button></DialogFooter></form></DialogContent></Dialog>;
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
  const removeVehicle = async (id: number) => { await fetch('/api/vehicles', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) }); await refresh(); setToast('Vehicle removed from the in-memory backend.'); };
  return <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]"><aside className={`fixed inset-y-0 left-0 z-50 w-[270px] border-r border-black/[.06] bg-white p-4 transition lg:translate-x-0 ${sidebar ? 'translate-x-0' : '-translate-x-full'}`}><div className="flex h-12 items-center justify-between px-2"><div className="flex items-center gap-2 text-lg font-semibold"><span className="grid size-8 place-items-center rounded-full bg-black text-white"><CarFront className="size-4" /></span>Drift <Badge variant="secondary">Admin</Badge></div><Button size="icon" variant="ghost" className="lg:hidden" onClick={() => setSidebar(false)}><X /></Button></div><nav className="mt-7 space-y-1">{menu.map(({ label, icon: Icon }) => <button key={label} onClick={() => navigate(label)} className={`flex h-11 w-full items-center gap-3 rounded-xl px-3 text-sm transition ${section === label ? 'bg-black text-white' : 'text-black/55 hover:bg-black/[.04] hover:text-black'}`}><Icon className="size-4" />{label}{label === 'Database' && <Badge className="ml-auto bg-blue-50 text-blue-700">Demo</Badge>}</button>)}</nav><div className="absolute inset-x-4 bottom-4 rounded-2xl bg-[#f5f5f7] p-4"><p className="text-xs font-medium">In-memory prototype</p><p className="mt-1 text-[11px] leading-4 text-black/45">Changes reset when the server restarts. A database can be connected later.</p></div></aside><div className="lg:pl-[270px]"><header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-black/[.06] bg-white/80 px-5 backdrop-blur-2xl lg:px-8"><div className="flex items-center gap-3"><Button size="icon" variant="ghost" className="lg:hidden" onClick={() => setSidebar(true)}><Menu /></Button><div><p className="font-semibold">{section}</p><p className="hidden text-xs text-black/40 sm:block">Rental operations at a glance</p></div></div><Button variant="outline" className="rounded-full" onClick={() => setMode('customer')}><ArrowLeft /> Customer site</Button></header><main className="p-5 lg:p-8"><AdminContent section={section} vehicles={vehicles} bookings={bookings} tables={tables} onAddVehicle={() => { setEditing(null); setVehicleFormOpen(true); }} onEditVehicle={(v) => { setEditing(v); setVehicleFormOpen(true); }} onDeleteVehicle={removeVehicle} onAddTable={() => setTableOpen(true)} onRefresh={refresh} setToast={setToast} /></main></div><VehicleFormDialog open={vehicleFormOpen} onOpenChange={setVehicleFormOpen} vehicle={editing} onSaved={async () => { setVehicleFormOpen(false); await refresh(); setToast(editing ? 'Vehicle updated successfully.' : 'Vehicle added successfully.'); }} /><TableDialog open={tableOpen} onOpenChange={setTableOpen} onSaved={async () => { setTableOpen(false); await refresh(); setToast('New table added to the in-memory schema.'); }} /></div>;
}

function AdminContent({ section, vehicles, bookings, tables, onAddVehicle, onEditVehicle, onDeleteVehicle, onAddTable, onRefresh, setToast }: { section: Section; vehicles: Vehicle[]; bookings: Booking[]; tables: DbTable[]; onAddVehicle: () => void; onEditVehicle: (v: Vehicle) => void; onDeleteVehicle: (id: number) => void; onAddTable: () => void; onRefresh: () => Promise<void>; setToast: (s: string) => void }) {
  if (section === 'Dashboard') return <Dashboard vehicles={vehicles} bookings={bookings} />;
  if (section === 'Vehicles') return <VehiclesAdmin vehicles={vehicles} onAdd={onAddVehicle} onEdit={onEditVehicle} onDelete={onDeleteVehicle} />;
  if (section === 'Bookings') return <BookingsTable bookings={bookings} />;
  if (section === 'Customers') return <CustomersTable />;
  if (section === 'Payments') return <PaymentsTable />;
  if (section === 'Reports') return <Reports bookings={bookings} vehicles={vehicles} setToast={setToast} />;
  if (section === 'Database') return <DatabaseManager tables={tables} onAdd={onAddTable} onRefresh={onRefresh} setToast={setToast} />;
  const values = section === 'Brands' ? [...new Set(vehicles.map((v) => v.brand))] : section === 'Categories' ? [...new Set(vehicles.map((v) => v.type))] : features;
  return <SimpleList title={section} values={values} setToast={setToast} />;
}

function Dashboard({ vehicles, bookings }: { vehicles: Vehicle[]; bookings: Booking[] }) {
  const revenue = bookings.reduce((sum, b) => sum + b.totalCost, 0);
  const cards = [
    { label: 'Total vehicles', value: vehicles.length, note: `${vehicles.filter((v) => v.status === 'Available').length} available`, icon: CarFront, colour: 'bg-blue-50 text-blue-700' },
    { label: 'Active bookings', value: bookings.filter((b) => ['Confirmed', 'Pending'].includes(b.status)).length, note: `${bookings.filter((b) => b.status === 'Pending').length} awaiting confirmation`, icon: CalendarDays, colour: 'bg-violet-50 text-violet-700' },
    { label: 'Revenue tracked', value: currency(revenue), note: 'Prototype booking value', icon: CircleDollarSign, colour: 'bg-emerald-50 text-emerald-700' },
    { label: 'Fleet utilisation', value: `${Math.round((vehicles.filter((v) => v.status !== 'Available').length / Math.max(vehicles.length, 1)) * 100)}%`, note: 'Rented or in service', icon: Gauge, colour: 'bg-amber-50 text-amber-700' },
  ];
  return <div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(({ label, value, note, icon: Icon, colour }) => <div key={label} className="rounded-[24px] border border-black/[.05] bg-white p-6 shadow-sm"><span className={`grid size-10 place-items-center rounded-xl ${colour}`}><Icon className="size-5" /></span><p className="mt-7 text-sm text-black/45">{label}</p><p className="mt-1 text-3xl font-semibold tracking-[-.04em]">{value}</p><p className="mt-2 text-xs text-black/40">{note}</p></div>)}</div><div className="mt-5 grid gap-5 xl:grid-cols-[1.5fr_1fr]"><div className="rounded-[24px] border border-black/[.05] bg-white p-6"><div className="flex items-center justify-between"><div><h2 className="font-semibold">Revenue overview</h2><p className="mt-1 text-xs text-black/40">March – August 2026</p></div><Badge className="bg-emerald-50 text-emerald-700">+18.4%</Badge></div><div className="mt-10 flex h-48 items-end gap-4">{[45, 68, 59, 88, 72, 94].map((h, i) => <div key={i} className="flex flex-1 flex-col items-center gap-2"><div className="w-full rounded-t-lg bg-gradient-to-t from-[#0071e3] to-[#68b5ff]" style={{ height: `${h}%` }} /><span className="text-[10px] text-black/35">{['Mar','Apr','May','Jun','Jul','Aug'][i]}</span></div>)}</div></div><div className="rounded-[24px] border border-black/[.05] bg-white p-6"><h2 className="font-semibold">Recent bookings</h2><div className="mt-5 space-y-4">{bookings.slice(0, 4).map((b) => <div key={b.id} className="flex items-center justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-medium">{b.customer}</p><p className="truncate text-xs text-black/40">{b.vehicle}</p></div><Badge className={`border-0 ${statusClass(b.status)}`}>{b.status}</Badge></div>)}</div></div></div></div>;
}

function VehiclesAdmin({ vehicles, onAdd, onEdit, onDelete }: { vehicles: Vehicle[]; onAdd: () => void; onEdit: (v: Vehicle) => void; onDelete: (id: number) => void }) {
  return <div><AdminHeading title="Fleet vehicles" subtitle="Add, update and remove vehicle records." action={<Button onClick={onAdd} className="rounded-full bg-[#0071e3] px-5 text-white"><Plus /> Add vehicle</Button>} /><div className="mt-6 overflow-hidden rounded-[24px] border border-black/[.05] bg-white"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-[#fafafa] text-xs text-black/40"><tr>{['Vehicle','Registration','Daily rate','Transmission','Status',''].map((h) => <th key={h} className="px-5 py-4 font-medium">{h}</th>)}</tr></thead><tbody>{vehicles.map((v) => <tr key={v.id} className="border-t border-black/[.05]"><td className="px-5 py-4"><div className="flex items-center gap-3"><img src={v.image} alt="" className="size-11 rounded-xl object-cover" /><div><p className="font-medium">{v.brand} {v.model}</p><p className="text-xs text-black/40">{v.year} · {v.type}</p></div></div></td><td className="px-5 py-4 text-black/55">{v.registration}</td><td className="px-5 py-4 font-medium">{currency(v.dailyRate)}</td><td className="px-5 py-4 text-black/55">{v.transmission}</td><td className="px-5 py-4"><Badge className={`border-0 ${statusClass(v.status)}`}>{v.status}</Badge></td><td className="px-5 py-4"><div className="flex justify-end gap-1"><Button size="icon-sm" variant="ghost" aria-label="Edit vehicle" onClick={() => onEdit(v)}><Pencil /></Button><Button size="icon-sm" variant="destructive" aria-label="Delete vehicle" onClick={() => onDelete(v.id)}><Trash2 /></Button></div></td></tr>)}</tbody></table></div></div></div>;
}

function BookingsTable({ bookings }: { bookings: Booking[] }) { return <div><AdminHeading title="Bookings" subtitle="Track reservations, dates and booking totals." /><DataTable headers={['Reference','Customer','Vehicle','Dates','Route','Total','Status']} rows={bookings.map((b) => [b.id, b.customer, b.vehicle, `${b.startDate} → ${b.endDate}`, `${b.pickupCity} → ${b.returnCity}`, currency(b.totalCost), <Badge key={b.id} className={`border-0 ${statusClass(b.status)}`}>{b.status}</Badge>])} /></div>; }
function CustomersTable() { return <div><AdminHeading title="Customers" subtitle="Customer profiles used by the booking flow." /><DataTable headers={['Customer ID','Name','Email','Phone','Bookings']} rows={seededCustomers.map((c) => [c.id, c.name, c.email, c.phone, c.bookings])} /></div>; }
function PaymentsTable() { return <div><AdminHeading title="Payments" subtitle="Prototype payment records — no gateway is connected." /><DataTable headers={['Payment ID','Booking','Amount','Date','Status']} rows={seededPayments.map((p) => [p.id, p.bookingId, currency(p.amount), p.date, <Badge key={p.id} className={`border-0 ${statusClass(p.status)}`}>{p.status}</Badge>])} /></div>; }

function Reports({ bookings, vehicles, setToast }: { bookings: Booking[]; vehicles: Vehicle[]; setToast: (s: string) => void }) {
  const total = bookings.reduce((sum, b) => sum + b.totalCost, 0);
  const reports = [
    { title: 'Revenue report', desc: 'Booking value by month and payment status.', value: currency(total), icon: CircleDollarSign, colour: 'bg-emerald-50 text-emerald-700' },
    { title: 'Fleet utilisation', desc: 'Availability, rentals and maintenance status.', value: `${vehicles.filter((v) => v.status === 'Available').length}/${vehicles.length} available`, icon: Gauge, colour: 'bg-blue-50 text-blue-700' },
    { title: 'Booking status', desc: 'Confirmed, pending and completed bookings.', value: `${bookings.length} records`, icon: ClipboardList, colour: 'bg-violet-50 text-violet-700' },
    { title: 'Top vehicles', desc: 'Most booked vehicles and revenue contribution.', value: vehicles[0] ? `${vehicles[0].brand} ${vehicles[0].model}` : 'No data', icon: CarFront, colour: 'bg-amber-50 text-amber-700' },
  ];
  const download = (title: string) => { const content = `Drift Car Rental - ${title}\nGenerated: ${new Date().toLocaleDateString('en-ZA')}\nPrototype dataset only\n\nTotal bookings: ${bookings.length}\nTotal booking value: ${currency(total)}\nFleet size: ${vehicles.length}`; const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([content], { type: 'text/plain' })); link.download = `${title.toLowerCase().replaceAll(' ', '-')}.txt`; link.click(); setToast(`${title} downloaded.`); };
  return <div><AdminHeading title="Reports" subtitle="Four assignment-ready operational reports." /><div className="mt-6 grid gap-5 md:grid-cols-2">{reports.map(({ title, desc, value, icon: Icon, colour }) => <div key={title} className="rounded-[24px] border border-black/[.05] bg-white p-6"><div className="flex items-start justify-between"><span className={`grid size-11 place-items-center rounded-2xl ${colour}`}><Icon className="size-5" /></span><Button variant="ghost" size="icon" aria-label={`Download ${title}`} onClick={() => download(title)}><Download /></Button></div><h3 className="mt-7 text-lg font-semibold">{title}</h3><p className="mt-1 text-sm text-black/45">{desc}</p><p className="mt-5 text-2xl font-semibold tracking-tight">{value}</p><div className="mt-6 flex items-end gap-2">{[36,62,48,78,57,88,70,96].map((height, i) => <span key={i} className="flex-1 rounded-t bg-[#0071e3]/80" style={{ height: height / 2 + 10 }} />)}</div></div>)}</div></div>;
}

function DatabaseManager({ tables, onAdd, onRefresh, setToast }: { tables: DbTable[]; onAdd: () => void; onRefresh: () => Promise<void>; setToast: (s: string) => void }) {
  const [active, setActive] = useState<DbTable | null>(null);
  const remove = async (name: string) => { await fetch('/api/database', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) }); await onRefresh(); if (active?.name === name) setActive(null); setToast(`Table ${name} removed from the demo schema.`); };
  return <div><AdminHeading title="Database management" subtitle="Simulate table and record management before connecting a database." action={<Button onClick={onAdd} className="rounded-full bg-[#0071e3] px-5 text-white"><Plus /> Create table</Button>} /><div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800"><strong>Prototype mode:</strong> these schema changes live only in server memory and reset when the app restarts.</div><div className="mt-6 grid gap-5 xl:grid-cols-[1fr_1.25fr]"><div className="space-y-3">{tables.map((table) => <button key={table.name} onClick={() => setActive(table)} className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition ${active?.name === table.name ? 'border-[#0071e3] bg-blue-50' : 'border-black/[.05] bg-white hover:border-black/15'}`}><span className="grid size-10 place-items-center rounded-xl bg-[#f5f5f7]"><Table2 className="size-4" /></span><span className="min-w-0 flex-1"><strong className="block text-sm">{table.name}</strong><span className="text-xs text-black/40">{table.rows} records · {table.fields.length} fields</span></span><ChevronRight className="size-4 text-black/30" /></button>)}</div><div className="min-h-80 rounded-[24px] border border-black/[.05] bg-white p-6">{active ? <><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-medium text-[#0071e3]">TABLE STRUCTURE</p><h3 className="mt-1 text-2xl font-semibold">{active.name}</h3></div><Button variant="destructive" size="sm" onClick={() => remove(active.name)}><Trash2 /> Delete table</Button></div><div className="mt-6 overflow-hidden rounded-2xl border border-black/[.06]"><div className="grid grid-cols-[1fr_110px] bg-[#fafafa] px-4 py-3 text-xs text-black/40"><span>Field name</span><span>Suggested type</span></div>{active.fields.map((field, index) => <div key={field} className="grid grid-cols-[1fr_110px] border-t border-black/[.05] px-4 py-3 text-sm"><span className="font-mono text-xs">{field}</span><span className="text-xs text-black/45">{index === 0 ? 'INTEGER' : field.includes('date') ? 'DATE' : field.includes('cost') || field.includes('rate') || field === 'amount' ? 'DECIMAL' : 'VARCHAR'}</span></div>)}</div><div className="mt-5 flex flex-wrap gap-2"><Button variant="secondary" onClick={() => setToast('Demo record added in memory.')}><Plus /> Add record</Button><Button variant="outline" onClick={() => setToast('Record editor opened in demo mode.')}><Pencil /> Update record</Button><Button variant="destructive" onClick={() => setToast('Demo record deleted.')}><Trash2 /> Delete record</Button></div></> : <div className="grid h-full min-h-72 place-items-center text-center"><div><Database className="mx-auto size-9 text-black/20" /><h3 className="mt-4 font-semibold">Select a table</h3><p className="mt-1 text-sm text-black/40">View its structure and manage demo records.</p></div></div>}</div></div></div>;
}

function SimpleList({ title, values, setToast }: { title: string; values: string[]; setToast: (s: string) => void }) { const [items, setItems] = useState(values); const [value, setValue] = useState(''); useEffect(() => setItems(values), [values]); const add = () => { if (!value.trim()) return; setItems([...items, value.trim()]); setValue(''); setToast(`${title.slice(0, -1)} added.`); }; return <div><AdminHeading title={title} subtitle={`Manage ${title.toLowerCase()} used throughout the system.`} /><div className="mt-6 grid gap-5 xl:grid-cols-[1fr_340px]"><div className="overflow-hidden rounded-[24px] border border-black/[.05] bg-white">{items.map((item, index) => <div key={item} className="flex items-center justify-between border-b border-black/[.05] px-5 py-4 last:border-0"><div><p className="font-medium">{item}</p><p className="text-xs text-black/40">ID {String(index + 1).padStart(3, '0')}</p></div><Button variant="destructive" size="icon-sm" onClick={() => setItems(items.filter((i) => i !== item))}><Trash2 /></Button></div>)}</div><div className="h-fit rounded-[24px] border border-black/[.05] bg-white p-6"><h3 className="font-semibold">Add {title.slice(0, -1).toLowerCase()}</h3><Input className="mt-4" placeholder={`New ${title.slice(0, -1).toLowerCase()} name`} value={value} onChange={(e) => setValue(e.target.value)} /><Button onClick={add} className="mt-3 w-full rounded-full bg-[#0071e3] text-white"><Plus /> Add</Button></div></div></div>; }

function VehicleFormDialog({ open, onOpenChange, vehicle, onSaved }: { open: boolean; onOpenChange: (b: boolean) => void; vehicle: Vehicle | null; onSaved: () => void }) {
  const blank = useMemo(() => ({ brand: '', model: '', year: 2025, type: 'Hatchback' as Vehicle['type'], registration: '', dailyRate: 450, transmission: 'Automatic' as Vehicle['transmission'], doors: 5, colour: '', status: 'Available' as Vehicle['status'], features: ['Bluetooth'], image: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1400&q=85', description: '' }), []);
  const [form, setForm] = useState<Omit<Vehicle, 'id'>>(blank);
  useEffect(() => { setForm(vehicle ? { ...vehicle } : blank); }, [vehicle, open, blank]);
  const submit = async (e: FormEvent) => { e.preventDefault(); await fetch('/api/vehicles', { method: vehicle ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(vehicle ? { ...form, id: vehicle.id } : form) }); onSaved(); };
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[94vh] overflow-y-auto rounded-[28px] p-0 sm:max-w-2xl"><form onSubmit={submit}><div className="p-7"><DialogHeader><DialogTitle className="text-2xl">{vehicle ? 'Edit vehicle' : 'Add vehicle'}</DialogTitle><DialogDescription>Complete the planned vehicle fields. Images use a URL until file storage is added.</DialogDescription></DialogHeader><div className="mt-6 grid gap-4 sm:grid-cols-2"><FormField label="Brand"><Input required value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} /></FormField><FormField label="Model"><Input required value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} /></FormField><FormField label="Year"><Input required type="number" value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} /></FormField><FormField label="Vehicle type"><NativeSelect className="w-full" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as Vehicle['type'] })}>{['Hatchback','Sedan','SUV','Bakkie'].map((v) => <NativeSelectOption key={v}>{v}</NativeSelectOption>)}</NativeSelect></FormField><FormField label="Registration number"><Input required value={form.registration} onChange={(e) => setForm({ ...form, registration: e.target.value })} /></FormField><FormField label="Daily rental price"><Input required type="number" value={form.dailyRate} onChange={(e) => setForm({ ...form, dailyRate: Number(e.target.value) })} /></FormField><FormField label="Transmission"><NativeSelect className="w-full" value={form.transmission} onChange={(e) => setForm({ ...form, transmission: e.target.value as Vehicle['transmission'] })}>{['Automatic','Manual'].map((v) => <NativeSelectOption key={v}>{v}</NativeSelectOption>)}</NativeSelect></FormField><FormField label="Doors"><Input required type="number" min="2" max="5" value={form.doors} onChange={(e) => setForm({ ...form, doors: Number(e.target.value) })} /></FormField><FormField label="Colour"><Input required value={form.colour} onChange={(e) => setForm({ ...form, colour: e.target.value })} /></FormField><FormField label="Status"><NativeSelect className="w-full" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Vehicle['status'] })}>{['Available','Rented','Maintenance'].map((v) => <NativeSelectOption key={v}>{v}</NativeSelectOption>)}</NativeSelect></FormField><div className="sm:col-span-2"><FormField label="Main image URL"><Input required type="url" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} /></FormField></div><div className="sm:col-span-2"><FormField label="Description"><Textarea required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></FormField></div></div></div><DialogFooter className="rounded-b-[28px] px-7"><Button type="submit" className="rounded-full bg-[#0071e3] px-6 text-white">{vehicle ? 'Save changes' : 'Add vehicle'}</Button></DialogFooter></form></DialogContent></Dialog>;
}

function TableDialog({ open, onOpenChange, onSaved }: { open: boolean; onOpenChange: (b: boolean) => void; onSaved: () => void }) { const [name, setName] = useState(''); const [fields, setFields] = useState('id, name, created_at'); const submit = async (e: FormEvent) => { e.preventDefault(); await fetch('/api/database', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, fields: fields.split(',').map((f) => f.trim()).filter(Boolean) }) }); setName(''); onSaved(); }; return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="rounded-[28px] sm:max-w-md"><form onSubmit={submit}><DialogHeader><DialogTitle className="text-xl">Create a new table</DialogTitle><DialogDescription>Add a table to the prototype schema. This operation is stored in memory only.</DialogDescription></DialogHeader><div className="mt-5 space-y-4"><FormField label="Table name"><Input required placeholder="e.g. Insurance_Claims" value={name} onChange={(e) => setName(e.target.value)} /></FormField><FormField label="Fields (comma-separated)"><Textarea required value={fields} onChange={(e) => setFields(e.target.value)} /></FormField></div><Button type="submit" className="mt-6 w-full rounded-full bg-[#0071e3] text-white">Create table</Button></form></DialogContent></Dialog>; }

function AdminHeading({ title, subtitle, action }: { title: string; subtitle: string; action?: React.ReactNode }) { return <div className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-3xl font-semibold tracking-[-.04em]">{title}</h1><p className="mt-1 text-sm text-black/45">{subtitle}</p></div>{action}</div>; }
function DataTable({ headers, rows }: { headers: string[]; rows: React.ReactNode[][] }) { return <div className="mt-6 overflow-hidden rounded-[24px] border border-black/[.05] bg-white"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-[#fafafa] text-xs text-black/40"><tr>{headers.map((h) => <th key={h} className="whitespace-nowrap px-5 py-4 font-medium">{h}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr key={i} className="border-t border-black/[.05]">{row.map((cell, j) => <td key={j} className="whitespace-nowrap px-5 py-4 first:font-medium">{cell}</td>)}</tr>)}</tbody></table></div></div>; }
function Toast({ message }: { message: string }) { return <div className="fixed bottom-6 left-1/2 z-[100] flex -translate-x-1/2 items-center gap-2 rounded-full bg-black px-5 py-3 text-sm text-white shadow-2xl"><Check className="size-4 text-emerald-400" />{message}</div>; }
