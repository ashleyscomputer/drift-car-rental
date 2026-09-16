import { ArrowDown, ArrowRight, CarFront, Gauge, MapPin, Sparkles } from 'lucide-react';
import RentalApp from '@/components/rental-app';

const metrics = [
  { label: 'Fleet', value: '70 cars', icon: CarFront },
  { label: 'Cities', value: '5 hubs', icon: MapPin },
  { label: 'Booking', value: 'Minutes', icon: Gauge },
];

export default function Home() {
  return (
    <>
      <section id="drift-cinematic-home" className="relative isolate min-h-[100svh] overflow-hidden bg-[#050607] text-white">
        <style>{`#drift-cinematic-home + main > section:first-of-type{display:none}@keyframes driftHeroCopy{from{opacity:0;transform:translateY(32px)}to{opacity:1;transform:none}}@keyframes driftHeroSweep{0%,45%{transform:translateX(-130%)}70%,100%{transform:translateX(130%)}}.drift-hero-copy{animation:driftHeroCopy .9s cubic-bezier(.16,1,.3,1) both}.drift-hero-sweep{animation:driftHeroSweep 7s ease-in-out 1s infinite}@media(prefers-reduced-motion:reduce){.drift-hero-copy,.drift-hero-sweep,.hero-drift{animation:none!important}}`}</style>

        <div aria-hidden="true" className="absolute inset-0 -z-50 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.05)_1px,transparent_1px)] [background-size:86px_86px] [mask-image:linear-gradient(to_bottom,black,transparent_88%)]" />
        <div aria-hidden="true" className="absolute left-1/2 top-1/2 -z-40 aspect-square w-[min(74vw,1000px)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(180,207,229,.19),rgba(55,75,94,.08)_38%,transparent_70%)] blur-2xl" />
        <div aria-hidden="true" className="absolute left-1/2 top-[48%] -z-30 -translate-x-1/2 -translate-y-1/2 select-none whitespace-nowrap text-[clamp(9rem,25vw,28rem)] font-black leading-[.7] tracking-[-.09em] text-white/[.035]">DRIFT</div>

        <img src="/vehicles/bmw-x5.jpg" alt="BMW X5 from the Drift rental fleet" className="hero-drift absolute -bottom-[4%] -right-[4%] -z-20 h-[82%] w-[min(76vw,1200px)] object-cover object-center opacity-80 grayscale [filter:grayscale(.82)_saturate(.65)_contrast(1.16)_brightness(.62)] [mask-image:linear-gradient(90deg,transparent_1%,rgba(0,0,0,.45)_16%,black_42%,black_90%,transparent_100%)] max-[900px]:-right-[30%] max-[900px]:bottom-0 max-[900px]:h-[65%] max-[900px]:w-[126vw] max-[900px]:opacity-60" />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_76%_58%,transparent_0_20%,rgba(5,6,7,.18)_48%,rgba(5,6,7,.72)_80%),linear-gradient(90deg,#050607_0%,rgba(5,6,7,.95)_25%,rgba(5,6,7,.42)_56%,rgba(5,6,7,.48)_100%),linear-gradient(0deg,rgba(5,6,7,.94)_0%,transparent_34%)]" />
        <div aria-hidden="true" className="drift-hero-sweep pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(112deg,transparent_36%,rgba(255,255,255,.055)_48%,transparent_60%)]" />

        <header className="relative z-20 mx-auto grid w-[min(100%-40px,1440px)] grid-cols-[1fr_auto_1fr] items-center gap-8 border-b border-white/10 py-6 max-md:grid-cols-[1fr_auto]">
          <a href="#drift-cinematic-home" className="flex w-fit items-center gap-3 text-sm font-extrabold tracking-[.22em]">
            <span className="grid size-9 place-items-center rounded-full bg-white text-black"><CarFront className="size-4" /></span>DRIFT
          </a>
          <nav className="flex items-center gap-9 text-[11px] font-semibold uppercase tracking-[.16em] text-white/50 max-md:hidden" aria-label="Landing navigation">
            <a className="transition hover:text-white" href="#browse">Fleet</a><a className="transition hover:text-white" href="/experience">Concept</a><a className="transition hover:text-white" href="/login">Sign in</a>
          </nav>
          <a href="#browse" className="justify-self-end inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[.06] px-4 py-3 text-xs font-semibold backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white/10">Find a car <ArrowRight className="size-4" /></a>
        </header>

        <div className="drift-hero-copy relative z-10 mx-auto w-[min(100%-40px,1440px)] pt-[clamp(6rem,15vh,11rem)] max-sm:w-[calc(100%-30px)] max-sm:pt-[8vh]">
          <p className="flex items-center gap-3 text-[11px] font-bold tracking-[.22em] text-white/50"><span className="h-px w-9 bg-[#8fc5ee]" /> RENTAL, REFRAMED</p>
          <h1 className="mt-5 max-w-4xl text-[clamp(4.7rem,10.6vw,10.7rem)] font-semibold leading-[.74] tracking-[-.075em] max-sm:text-[clamp(3.9rem,19vw,6.1rem)]">
            <span className="block">Move</span><span className="ml-[clamp(0rem,8vw,8rem)] block text-white/35 max-sm:ml-0">different.</span>
          </h1>
          <p className="mt-[clamp(2rem,5vh,4rem)] max-w-lg text-[clamp(.94rem,1.2vw,1.08rem)] leading-7 text-white/55">Pick the car. See the price. Own the moment. Drift turns car rental into something that feels less like paperwork and more like a launch sequence.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href="#browse" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:-translate-y-0.5">Explore the fleet <ArrowRight className="size-4" /></a>
            <a href="/experience" className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/15 bg-black/20 px-5 py-3 text-sm font-semibold backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white/10"><Sparkles className="size-4" /> Enter 3D concept</a>
          </div>
        </div>

        <aside className="absolute right-[clamp(1.2rem,3vw,3.5rem)] top-1/2 z-10 flex -translate-y-1/2 items-center gap-4 text-[9px] font-semibold uppercase tracking-[.18em] text-white/35 [writing-mode:vertical-rl] max-[900px]:hidden" aria-label="Drift highlights">
          <span>01</span><span className="h-14 w-px bg-white/20" /><span>Premium fleet</span><span>South Africa</span>
        </aside>

        <div className="absolute bottom-8 left-[max(20px,calc((100vw-1440px)/2))] z-10 flex gap-2 max-[900px]:bottom-5 max-[900px]:right-5 max-[900px]:overflow-x-auto">
          {metrics.map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex min-w-32 items-center gap-3 rounded-2xl border border-white/10 bg-black/35 px-3 py-3 text-white/70 backdrop-blur-xl">
              <Icon className="size-4 shrink-0" /><span className="grid"><small className="text-[9px] font-semibold uppercase tracking-[.12em] text-white/30">{label}</small><strong className="text-xs text-white/90">{value}</strong></span>
            </div>
          ))}
        </div>

        <a href="#browse" className="absolute bottom-9 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 text-[10px] font-semibold uppercase tracking-[.14em] text-white/40 max-[900px]:hidden">Scroll to explore <ArrowDown className="size-4 animate-bounce" /></a>
      </section>
      <RentalApp />
    </>
  );
}
