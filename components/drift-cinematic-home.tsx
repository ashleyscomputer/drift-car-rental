'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowRight, CarFront, Sparkles } from 'lucide-react';
import type { Vehicle } from '@/lib/store';

const FALLBACK_VEHICLE: Pick<Vehicle, 'brand' | 'model' | 'year' | 'type' | 'dailyRate' | 'transmission' | 'doors' | 'colour' | 'status' | 'features'> = {
  brand: 'BMW',
  model: 'X5',
  year: 2025,
  type: 'SUV',
  dailyRate: 2800,
  transmission: 'Automatic',
  doors: 5,
  colour: 'Carbon Black',
  status: 'Available',
  features: ['All-wheel drive', 'Leather seats', 'Panoramic roof', 'Parking assist'],
};

const ANGLES = [
  '/vehicles/gallery/bmw-x5/1.jpg',
  '/vehicles/gallery/bmw-x5/2.jpg',
  '/vehicles/gallery/bmw-x5/3.jpg',
];

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const mix = (from: number, to: number, amount: number) => from + (to - from) * clamp(amount);
const range = (value: number, start: number, end: number) => clamp((value - start) / Math.max(end - start, 0.0001));
const fadeWindow = (value: number, startIn: number, endIn: number, startOut: number, endOut: number) => {
  const fadeIn = range(value, startIn, endIn);
  const fadeOut = 1 - range(value, startOut, endOut);
  return Math.min(fadeIn, fadeOut);
};
const currency = (value: number) => `R${value.toLocaleString('en-ZA')}`;

export default function DriftCinematicHome() {
  const stageRef = useRef<HTMLElement>(null);
  const frameRef = useRef<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [finePointer, setFinePointer] = useState(false);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const [heroVehicle, setHeroVehicle] = useState(FALLBACK_VEHICLE);

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const pointerMedia = window.matchMedia('(pointer: fine)');
    const syncPreferences = () => {
      setReducedMotion(motion.matches);
      setFinePointer(pointerMedia.matches);
    };
    syncPreferences();
    motion.addEventListener('change', syncPreferences);
    pointerMedia.addEventListener('change', syncPreferences);
    return () => {
      motion.removeEventListener('change', syncPreferences);
      pointerMedia.removeEventListener('change', syncPreferences);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/vehicles')
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error('Vehicle API unavailable'))))
      .then((vehicles: Vehicle[]) => {
        if (cancelled) return;
        const x5 = vehicles.find((vehicle) => vehicle.brand === 'BMW' && vehicle.model === 'X5');
        if (x5) setHeroVehicle(x5);
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const update = () => {
      frameRef.current = null;
      const stage = stageRef.current;
      if (!stage) return;
      const rect = stage.getBoundingClientRect();
      const distance = Math.max(stage.offsetHeight - window.innerHeight, 1);
      setProgress(clamp(-rect.top / distance));
    };
    const schedule = () => {
      if (frameRef.current !== null) return;
      frameRef.current = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    };
  }, []);

  useEffect(() => {
    if (!finePointer || reducedMotion) {
      setPointer({ x: 0, y: 0 });
      return;
    }
    const move = (event: PointerEvent) => {
      const x = (event.clientX / Math.max(window.innerWidth, 1) - 0.5) * 2;
      const y = (event.clientY / Math.max(window.innerHeight, 1) - 0.5) * 2;
      setPointer({ x: clamp(x, -1, 1), y: clamp(y, -1, 1) });
    };
    const leave = () => setPointer({ x: 0, y: 0 });
    window.addEventListener('pointermove', move, { passive: true });
    document.documentElement.addEventListener('mouseleave', leave);
    return () => {
      window.removeEventListener('pointermove', move);
      document.documentElement.removeEventListener('mouseleave', leave);
    };
  }, [finePointer, reducedMotion]);

  const motionProgress = reducedMotion ? clamp(progress * 1.15) : progress;
  const heroCopyOpacity = 1 - range(motionProgress, 0.18, 0.34);
  const detailOpacity = fadeWindow(motionProgress, 0.3, 0.42, 0.76, 0.88);
  const transitionOpacity = range(motionProgress, 0.78, 0.96);
  const wordmarkOpacity = mix(0.05, 0.13, range(motionProgress, 0.05, 0.45)) * (1 - range(motionProgress, 0.82, 1));
  const late = range(motionProgress, 0.78, 1);
  const carScale = reducedMotion ? 1 : mix(1, 1.11, range(motionProgress, 0.08, 0.66)) - late * 0.31;
  const carX = reducedMotion ? 0 : mix(-42, 78, range(motionProgress, 0.12, 0.72)) + pointer.x * 8;
  const carY = reducedMotion ? 0 : mix(34, -6, range(motionProgress, 0.08, 0.72)) - late * 118 + pointer.y * 8;
  const carRotate = reducedMotion ? 0 : mix(-0.7, 0.9, range(motionProgress, 0.16, 0.76));
  const lightX = reducedMotion ? 0 : mix(-55, 120, motionProgress) + pointer.x * 12;

  const imageOpacities = [
    1 - range(motionProgress, 0.34, 0.47),
    Math.min(range(motionProgress, 0.34, 0.47), 1 - range(motionProgress, 0.58, 0.7)),
    range(motionProgress, 0.58, 0.7),
  ];

  const allWheelDrive = useMemo(
    () => heroVehicle.features.find((feature) => /all-wheel|xdrive|quattro|4x4/i.test(feature)) ?? heroVehicle.type,
    [heroVehicle],
  );

  const specs = [
    heroVehicle.transmission.toUpperCase(),
    `${heroVehicle.year} ${heroVehicle.type}`.toUpperCase(),
    `${heroVehicle.doors} DOORS`,
    allWheelDrive.toUpperCase(),
    `${currency(heroVehicle.dailyRate)} / DAY`,
  ];

  return (
    <section ref={stageRef} id="drift-cinematic-home" className="relative h-[360svh] bg-[#050607] text-white">
      <style>{`
        .drift-cinematic-grid{background-image:linear-gradient(rgba(255,255,255,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.045) 1px,transparent 1px);background-size:86px 86px;mask-image:linear-gradient(to bottom,black,transparent 90%)}
        .drift-light-sweep{animation:driftLightSweep 9s cubic-bezier(.45,0,.55,1) infinite}
        @keyframes driftLightSweep{0%,36%{transform:translate3d(-120%,0,0)}70%,100%{transform:translate3d(120%,0,0)}}
        @media(max-width:640px){.drift-cinematic-grid{background-size:54px 54px}.drift-light-sweep{animation-duration:12s}}
        @media(prefers-reduced-motion:reduce){.drift-light-sweep{animation:none!important}.drift-scroll-cue{display:none!important}}
      `}</style>

      <div className="sticky top-0 isolate h-[100svh] overflow-hidden bg-[#050607]">
        <div aria-hidden="true" className="drift-cinematic-grid absolute inset-0 -z-50 opacity-55" />
        <div
          aria-hidden="true"
          className="absolute left-[58%] top-[48%] -z-40 aspect-square w-[min(90vw,1050px)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(131,185,226,.22)_0%,rgba(67,92,113,.11)_38%,transparent_69%)] blur-2xl max-md:left-[70%]"
          style={{ transform: `translate3d(calc(-50% + ${lightX}px), -50%, 0)` }}
        />
        <div aria-hidden="true" className="absolute inset-0 -z-30 bg-[linear-gradient(90deg,rgba(5,6,7,.96)_0%,rgba(5,6,7,.86)_27%,rgba(5,6,7,.22)_60%,rgba(5,6,7,.5)_100%)] max-md:bg-[linear-gradient(180deg,rgba(5,6,7,.97)_0%,rgba(5,6,7,.68)_43%,rgba(5,6,7,.4)_76%,rgba(5,6,7,.96)_100%)]" />
        <div
          aria-hidden="true"
          className="absolute left-1/2 top-[49%] -z-20 -translate-x-1/2 -translate-y-1/2 select-none whitespace-nowrap text-[clamp(8rem,17vw,18rem)] font-black leading-none tracking-[-.09em] text-white max-sm:text-[32vw]"
          style={{ opacity: wordmarkOpacity, transform: `translate3d(calc(-50% + ${reducedMotion ? 0 : mix(-12, 22, motionProgress) + pointer.x * 4}px), -50%, 0)` }}
        >
          DRIFT
        </div>

        <div className="absolute inset-x-0 top-0 z-40">
          <header className="mx-auto grid h-[76px] w-[min(100%-40px,1440px)] grid-cols-[1fr_auto_1fr] items-center gap-8 border-b border-white/10 max-md:w-[calc(100%-30px)] max-md:grid-cols-[1fr_auto]">
            <a href="#drift-cinematic-home" className="flex w-fit items-center gap-3 text-xs font-extrabold tracking-[.22em]">
              <span className="grid size-9 place-items-center rounded-full bg-white text-black"><CarFront className="size-4" /></span>
              DRIFT
            </a>
            <nav className="flex items-center gap-9 text-[11px] font-semibold uppercase tracking-[.16em] text-white/48 max-md:hidden" aria-label="Primary navigation">
              <a className="transition-colors hover:text-white focus-visible:text-white" href="#browse">Fleet</a>
              <a className="transition-colors hover:text-white focus-visible:text-white" href="/experience">Experience</a>
            </nav>
            <div className="flex items-center justify-self-end gap-4">
              <a href="/login" className="text-xs font-semibold text-white/55 transition hover:text-white max-sm:hidden">Sign in</a>
              <a href="#browse" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 bg-white/[.07] px-4 py-2 text-xs font-semibold backdrop-blur-xl transition hover:bg-white/12 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                Find a car <ArrowRight className="size-3.5" />
              </a>
            </div>
          </header>
        </div>

        <div
          className="absolute left-[max(20px,calc((100vw-1440px)/2))] top-[clamp(8.5rem,18vh,12rem)] z-20 max-w-[680px] max-md:left-5 max-md:right-5 max-md:top-[7.5rem]"
          style={{ opacity: heroCopyOpacity, transform: `translate3d(0, ${reducedMotion ? 0 : mix(0, -28, range(motionProgress, 0.12, 0.34))}px, 0)` }}
        >
          <p className="flex items-center gap-3 text-[10px] font-bold tracking-[.24em] text-white/48"><span className="h-px w-9 bg-[#9ed2f6]" /> RENTAL, REFRAMED</p>
          <h1 className="mt-5 text-[clamp(4.4rem,9.8vw,9.8rem)] font-semibold leading-[.76] tracking-[-.074em] max-sm:text-[clamp(3.8rem,18vw,5.8rem)]">
            <span className="block">Move</span>
            <span className="ml-[clamp(0rem,7vw,7rem)] block text-white/36 max-sm:ml-0">different.</span>
          </h1>
          <p className="mt-[clamp(1.75rem,4vh,3.25rem)] max-w-md text-[clamp(.92rem,1.15vw,1.05rem)] leading-7 text-white/56">Choose the car. See the price. Own the moment.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href="#browse" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
              Explore the fleet <ArrowRight className="size-4" />
            </a>
            <a href="/experience" className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/14 bg-black/20 px-5 py-3 text-sm font-semibold text-white/80 backdrop-blur-xl transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
              <Sparkles className="size-4" /> Discover the experience
            </a>
          </div>
        </div>

        <div
          className="pointer-events-none absolute inset-x-0 bottom-[3vh] z-10 mx-auto h-[72%] w-[min(92vw,1320px)] max-md:bottom-[6vh] max-md:h-[58%] max-md:w-[132vw]"
          style={{ transform: `translate3d(${carX}px, ${carY}px, 0) scale(${carScale}) rotate(${carRotate}deg)` }}
        >
          <div aria-hidden="true" className="absolute bottom-[8%] left-[16%] right-[5%] h-[12%] rounded-[50%] bg-black/80 blur-3xl" />
          {ANGLES.map((src, index) => (
            <img
              key={src}
              src={src}
              alt={index === 0 ? `${heroVehicle.year} ${heroVehicle.brand} ${heroVehicle.model} from the Drift rental fleet` : ''}
              aria-hidden={index !== 0}
              loading="eager"
              decoding="async"
              fetchPriority={index === 0 ? 'high' : 'auto'}
              className="absolute inset-0 h-full w-full object-cover object-center [filter:saturate(.72)_contrast(1.08)_brightness(.72)] [mask-image:linear-gradient(90deg,transparent_0%,rgba(0,0,0,.78)_9%,black_24%,black_91%,transparent_100%)] max-md:object-[54%_center]"
              style={{ opacity: imageOpacities[index], transition: reducedMotion ? 'opacity 180ms linear' : 'opacity 120ms linear' }}
              onError={(event) => {
                const image = event.currentTarget;
                image.onerror = null;
                image.src = '/vehicles/bmw-x5.jpg';
              }}
            />
          ))}
          <div aria-hidden="true" className="drift-light-sweep absolute inset-0 bg-[linear-gradient(112deg,transparent_34%,rgba(255,255,255,.10)_48%,transparent_61%)] mix-blend-screen" style={{ opacity: 1 - transitionOpacity }} />
        </div>

        <div className="absolute inset-0 z-20 hidden lg:block" style={{ opacity: detailOpacity }} aria-label={`${heroVehicle.brand} ${heroVehicle.model} specifications`}>
          <SpecMarker className="left-[8%] top-[44%]" align="left" label={specs[0]} />
          <SpecMarker className="left-[13%] top-[69%]" align="left" label={specs[1]} />
          <SpecMarker className="right-[7%] top-[40%]" align="right" label={specs[2]} />
          <SpecMarker className="right-[11%] top-[62%]" align="right" label={specs[3]} />
          <SpecMarker className="right-[8%] top-[76%]" align="right" label={specs[4]} emphasis />
        </div>

        <div className="absolute inset-x-4 bottom-5 z-30 flex flex-wrap justify-center gap-2 lg:hidden" style={{ opacity: detailOpacity }}>
          {specs.slice(0, 4).map((spec) => <span key={spec} className="rounded-full border border-white/12 bg-black/42 px-3 py-2 text-[9px] font-semibold tracking-[.12em] text-white/70 backdrop-blur-lg">{spec}</span>)}
          <span className="rounded-full bg-white px-3 py-2 text-[9px] font-bold tracking-[.12em] text-black">{specs[4]}</span>
        </div>

        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 z-[25] h-[48%] bg-[linear-gradient(to_bottom,transparent,#f5f5f7)]" style={{ opacity: transitionOpacity }} />

        <div
          className="absolute inset-x-0 bottom-[10vh] z-30 mx-auto w-[min(100%-40px,1240px)] text-center text-[#15171a] max-md:bottom-[8vh]"
          style={{ opacity: transitionOpacity, transform: `translate3d(0, ${mix(36, 0, transitionOpacity)}px, 0)` }}
        >
          <p className="text-[10px] font-bold tracking-[.22em] text-black/42">THE REAL FLEET</p>
          <h2 className="mt-3 text-[clamp(2.8rem,6vw,5.8rem)] font-semibold leading-none tracking-[-.065em]">Choose your drive.</h2>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-black/52">The launch sequence ends where the rental product begins. Same fleet, real prices, working filters and booking flow.</p>
        </div>

        <div className="drift-scroll-cue absolute bottom-7 left-1/2 z-30 flex -translate-x-1/2 items-center gap-3 text-[9px] font-semibold uppercase tracking-[.18em] text-white/38 max-md:hidden" style={{ opacity: 1 - range(motionProgress, 0.12, 0.28) }}>
          Scroll to explore <span className="h-8 w-px bg-white/18" /><ArrowDown className="size-3.5" />
        </div>

        <div className="absolute right-6 top-1/2 z-30 hidden -translate-y-1/2 items-center gap-3 text-[9px] font-semibold tracking-[.14em] text-white/36 xl:flex [writing-mode:vertical-rl]">
          <span>{String(Math.min(4, Math.floor(motionProgress * 4) + 1)).padStart(2, '0')}</span>
          <span className="h-12 w-px bg-white/16" />
          <span>{heroVehicle.brand} {heroVehicle.model}</span>
        </div>
      </div>
    </section>
  );
}

function SpecMarker({ label, className, align, emphasis = false }: { label: string; className: string; align: 'left' | 'right'; emphasis?: boolean }) {
  return (
    <div className={`absolute ${className} flex items-center gap-3 ${align === 'right' ? 'flex-row-reverse text-right' : ''}`}>
      <span className={`size-1.5 rounded-full ${emphasis ? 'bg-white' : 'bg-[#9ed2f6]'}`} />
      <span className="h-px w-12 bg-white/18" aria-hidden="true" />
      <span className={`text-[9px] font-semibold tracking-[.16em] ${emphasis ? 'text-white' : 'text-white/58'}`}>{label}</span>
    </div>
  );
}
