export const dynamic = 'force-dynamic';
import { ArrowLeft, ArrowRight, CarFront, Check, Star } from 'lucide-react';
import { listVehicles } from '@/lib/repository';

export default async function VehiclePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const vehicle = (await listVehicles()).find((item) => item.id === Number(id));
  if (!vehicle) return <main className="grid min-h-screen place-items-center bg-[#f5f5f7] p-5"><section className="rounded-[32px] bg-white p-10 text-center"><CarFront className="mx-auto size-9 text-black/20"/><h1 className="mt-5 text-3xl font-semibold">Vehicle not found</h1><a href="/#browse" className="mt-6 inline-flex items-center gap-2 rounded-full bg-black px-5 py-3 text-sm text-white"><ArrowLeft className="size-4"/>Back to fleet</a></section></main>;

  const rating=vehicle.rating==null?'No reviews':vehicle.rating.toFixed(1)+'/5';
  const gallery=vehicle.images?.length?vehicle.images:[vehicle.image || '/favicon.svg'];
  return <main className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
    <header className="border-b border-black/[.06] bg-white/85 backdrop-blur-2xl"><div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5"><a href="/" className="flex items-center gap-2 font-semibold"><span className="grid size-8 place-items-center rounded-full bg-black text-white"><CarFront className="size-4"/></span>Drift</a><a href="/#browse" className="flex items-center gap-2 text-sm text-black/50"><ArrowLeft className="size-4"/>Fleet</a></div></header>
    <div className="mx-auto max-w-6xl px-5 py-8 sm:py-12">
      <div className="grid gap-3 sm:grid-cols-2">{gallery.map((image,index)=><img key={image} src={image} alt={vehicle.brand+' '+vehicle.model+' view '+(index+1)} className="aspect-[16/10] w-full rounded-[28px] object-cover"/>)}</div>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_.8fr]">
        <section><div className="flex flex-wrap items-center gap-3"><span className="rounded-full bg-white px-3 py-1.5 text-xs font-medium">{vehicle.status}</span><span className="flex items-center gap-1.5 text-sm"><Star className="size-4 fill-current"/>{rating}</span></div><h1 className="mt-4 text-4xl font-semibold tracking-[-.05em] sm:text-5xl">{vehicle.brand} {vehicle.model}</h1><p className="mt-4 max-w-3xl text-base leading-7 text-black/55">{vehicle.description}</p><div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">{[['Year',vehicle.year],['Type',vehicle.type],['Transmission',vehicle.transmission],['Doors',vehicle.doors]].map(([label,value]) => <div key={String(label)} className="rounded-2xl bg-white p-4"><p className="text-xs text-black/40">{label}</p><p className="mt-1 font-medium">{value}</p></div>)}</div><div className="mt-8"><h2 className="font-semibold">Included features</h2><div className="mt-3 flex flex-wrap gap-2">{vehicle.features.map((feature)=><span key={feature} className="flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-2 text-xs text-blue-700"><Check className="size-3"/>{feature}</span>)}</div></div></section>
        <aside className="h-fit rounded-[28px] bg-white p-6 shadow-sm sm:p-7"><p className="text-sm text-black/45">From</p><p className="mt-1 text-4xl font-semibold">R{vehicle.dailyRate.toLocaleString('en-ZA')}</p><p className="text-sm text-black/40">per day</p><div className="my-6 h-px bg-black/[.06]"/><div className="space-y-3 text-sm"><div className="flex justify-between"><span className="text-black/45">Colour</span><strong>{vehicle.colour}</strong></div><div className="flex justify-between"><span className="text-black/45">Transmission</span><strong>{vehicle.transmission}</strong></div><div className="flex justify-between"><span className="text-black/45">Pick-up branch</span><strong>{vehicle.branchName}</strong></div></div><a href={`/?book=${vehicle.id}#browse`} className={`mt-7 flex h-12 items-center justify-center gap-2 rounded-full text-sm font-medium ${vehicle.status==='Available'?'bg-[#0071e3] text-white':'pointer-events-none bg-black/10 text-black/35'}`}>Book this vehicle <ArrowRight className="size-4"/></a></aside>
      </div>
    </div>
  </main>;
}