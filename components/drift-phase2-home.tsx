'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { ArrowDown, ArrowRight, CarFront, Sparkles } from 'lucide-react';
import type { Vehicle } from '@/lib/store';

const FALLBACK_VEHICLE: Pick<Vehicle, 'brand' | 'model' | 'year' | 'type' | 'dailyRate' | 'transmission' | 'doors' | 'colour' | 'status' | 'features'> = {
  brand: 'Mercedes-AMG',
  model: 'G63 G-Wagon',
  year: 2025,
  type: 'SUV',
  dailyRate: 3200,
  transmission: 'Automatic',
  doors: 5,
  colour: 'Platinum Magno',
  status: 'Available',
  features: ['4x4', 'AMG performance', 'Leather seats', 'Burmester audio'],
};

const G_WAGON_IMAGES = [
  'https://commons.wikimedia.org/wiki/Special:Redirect/file/Mercedes-AMG%20W463%20G%2063%20Obsidian%20Black%20(17).jpg?width=2200',
  'https://commons.wikimedia.org/wiki/Special:Redirect/file/Mercedes-AMG%20W463%20G%2063%20Obsidian%20Black%20(22).jpg?width=2200',
  'https://commons.wikimedia.org/wiki/Special:Redirect/file/Mercedes-AMG%20W463%20G%2063%20Obsidian%20Black%20(23).jpg?width=2200',
];

const G_WAGON_SOURCE = 'https://commons.wikimedia.org/wiki/Category:Mercedes-AMG_G_63_(2018%E2%80%932024)';
const SLS_CLOSED = 'https://commons.wikimedia.org/wiki/Special:Redirect/file/2010%20Mercedes-Benz%20SLS%20AMG%20(C%20197)%20Blackbird%20coupe%20(2010-10-16)%2002.jpg?width=2200';
const SLS_OPEN = 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Matte%20Black%20Mercedes%20SLS%20With%20Doors%20Up%20(12157179396).jpg?width=2200';
const SLS_SOURCE_CLOSED = 'https://commons.wikimedia.org/wiki/File:2010_Mercedes-Benz_SLS_AMG_(C_197)_Blackbird_coupe_(2010-10-16)_02.jpg';
const SLS_SOURCE_OPEN = 'https://commons.wikimedia.org/wiki/File:Matte_Black_Mercedes_SLS_With_Doors_Up_(12157179396).jpg';

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const mix = (from: number, to: number, amount: number) => from + (to - from) * clamp(amount);
const range = (value: number, start: number, end: number) => clamp((value - start) / Math.max(end - start, 0.0001));
const fadeWindow = (value: number, startIn: number, endIn: number, startOut: number, endOut: number) => {
  const fadeIn = range(value, startIn, endIn);
  const fadeOut = 1 - range(value, startOut, endOut);
  return Math.min(fadeIn, fadeOut);
};
const currency = (value: number) => `R${value.toLocaleString('en-ZA')}`;

function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onStoreChange) => {
      const media = window.matchMedia(query);
      const listener = () => onStoreChange();
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export default function DriftPhase2Home() {
  const stageRef = useRef<HTMLElement>(null);
  const frameRef = useRef<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const [heroVehicle, setHeroVehicle] = useState(FALLBACK_VEHICLE);
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const finePointer = useMediaQuery('(pointer: fine)');

  useEffect(() => {
    let cancelled = false;

    const loadHeroVehicle = async () => {
      try {
        const response = await fetch('/api/vehicles');
        if (!response.ok) return;
        const vehicles = (await response.json()) as Vehicle[];
        if (cancelled || !Array.isArray(vehicles)) return;
        const g63 = vehicles.find((vehicle) =>
          /mercedes/i.test(vehicle.brand) && /g\s?63|g-wagon|g wagon/i.test(vehicle.model),
        );
        if (g63) setHeroVehicle(g63);
      } catch {
        // The cinematic fallback mirrors the seeded G63 so the hero remains usable offline.
      }
    };

    void loadHeroVehicle();
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

    frameRef.current = window.requestAnimationFrame(update);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    };
  }, []);

  useEffect(() => {
    if (!finePointer || reducedMotion) return;

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

  const pointerX = finePointer && !reducedMotion ? pointer.x : 0;
  const pointerY = finePointer && !reducedMotion ? pointer.y : 0;
  const p = reducedMotion ? clamp(progress * 1.03) : progress;
  const gProgress = range(p, 0, 0.47);
  const slsProgress = range(p, 0.45, 0.9);
  const handoff = range(p, 0.88, 0.99);

  const gOpacity = 1 - range(p, 0.42, 0.51);
  const gCopyOpacity = (1 - range(gProgress, 0.19, 0.34)) * gOpacity;
  const gSpecOpacity = fadeWindow(gProgress, 0.31, 0.42, 0.72, 0.88) * gOpacity;
  const gWordmarkOpacity = mix(0.055, 0.135, range(gProgress, 0.05, 0.48)) * gOpacity;
  const gCarScale = reducedMotion ? 1 : mix(1.03, 1.16, range(gProgress, 0.06, 0.66));
  const gCarX = reducedMotion ? 0 : mix(-36, 66, range(gProgress, 0.12, 0.76)) + pointerX * 7;
  const gCarY = reducedMotion ? 0 : mix(34, -8, range(gProgress, 0.08, 0.74)) + pointerY * 7;
  const gCarRotate = reducedMotion ? 0 : mix(-0.45, 0.55, range(gProgress, 0.18, 0.78));
  const gLightX = reducedMotion ? 0 : mix(-52, 108, gProgress) + pointerX * 14;
  const gImageOpacities = [
    1 - range(gProgress, 0.34, 0.48),
    Math.min(range(gProgress, 0.34, 0.48), 1 - range(gProgress, 0.61, 0.73)),
    range(gProgress, 0.61, 0.73),
  ];

  const slsOpacity = range(p, 0.45, 0.53) * (1 - range(p, 0.86, 0.92));
  const slsCopyOpacity = (1 - range(slsProgress, 0.24, 0.38)) * slsOpacity;
  const doorProgress = range(slsProgress, 0.37, 0.63);
  const slsSpecOpacity = fadeWindow(slsProgress, 0.58, 0.7, 0.88, 0.98) * slsOpacity;
  const slsClosedOpacity = 1 - range(doorProgress, 0.2, 0.78);
  const slsOpenOpacity = range(doorProgress, 0.2, 0.78);
  const slsScale = reducedMotion ? 1 : mix(0.96, 1.075, range(slsProgress, 0.05, 0.7));
  const slsX = reducedMotion ? 0 : mix(28, -26, range(slsProgress, 0.06, 0.72)) + pointerX * 5;
  const slsY = reducedMotion ? 0 : mix(26, -4, range(slsProgress, 0.08, 0.72)) + pointerY * 5;
  const wingGlow = reducedMotion ? 0.2 : doorProgress * slsOpacity;
  const showSlsAssets = p > 0.36;

  const allWheelDrive = useMemo(
    () => heroVehicle.features.find((feature) => /4x4|all-wheel|awd/i.test(feature)) ?? 'All-wheel drive',
    [heroVehicle],
  );

  const gSpecs = [
    'MERCEDES-AMG G 63',
    heroVehicle.transmission.toUpperCase(),
    'V8 BITURBO',
    allWheelDrive.toUpperCase(),
    `${heroVehicle.doors} DOORS`,
    `${currency(heroVehicle.dailyRate)} / DAY`,
  ];
  const slsSpecs = ['6.2L V8', 'GULLWING DOORS', 'REAR-WHEEL DRIVE', '7-SPEED DCT', 'DRIFT EXPERIENCE'];
  const chapter = p < 0.47 ? ['01', 'G 63'] : p < 0.9 ? ['02', 'SLS AMG'] : ['03', 'FLEET'];

  return (
    <section ref={stageRef} id="drift-cinematic-home" className="relative h-[610svh] bg-[#050607] text-white max-md:h-[520svh]">
      <link rel="preload" as="image" href={G_WAGON_IMAGES[0]} />
      <style>{`
        .drift-cinematic-grid{background-image:linear-gradient(rgba(255,255,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.04) 1px,transparent 1px);background-size:86px 86px;mask-image:linear-gradient(to bottom,black,transparent 92%)}
        .drift-light-sweep{animation:driftLightSweep 8.6s cubic-bezier(.45,0,.55,1) infinite}
        .drift-film{background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.95' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.22'/%3E%3C/svg%3E");mix-blend-mode:soft-light}
        @keyframes driftLightSweep{0%,34%{transform:translate3d(-125%,0,0)}72%,100%{transform:translate3d(125%,0,0)}}
        @media(max-width:640px){.drift-cinematic-grid{background-size:54px 54px}.drift-light-sweep{animation-duration:11s}.drift-film{opacity:.08!important}}
        @media(prefers-reduced-motion:reduce){.drift-light-sweep{animation:none!important}.drift-scroll-cue{display:none!important}}
      `}</style>

      <div className="sticky top-0 isolate h-[100svh] overflow-hidden bg-[#050607]">
        <div aria-hidden="true" className="drift-cinematic-grid absolute inset-0 -z-50 opacity-50" />
        <div aria-hidden="true" className="drift-film pointer-events-none absolute inset-0 z-[60] opacity-[.12]" />

        <div className="absolute inset-x-0 top-0 z-50">
          <header className="mx-auto grid h-[76px] w-[min(100%-40px,1440px)] grid-cols-[1fr_auto_1fr] items-center gap-8 border-b border-white/10 max-md:w-[calc(100%-30px)] max-md:grid-cols-[1fr_auto]">
            <Link href="#drift-cinematic-home" className="flex w-fit items-center gap-3 text-xs font-extrabold tracking-[.22em]">
              <span className="grid size-9 place-items-center rounded-full bg-white text-black"><CarFront className="size-4" /></span>
              DRIFT
            </Link>
            <nav className="flex items-center gap-9 text-[11px] font-semibold uppercase tracking-[.16em] text-white/48 max-md:hidden" aria-label="Primary navigation">
              <Link className="transition-colors hover:text-white focus-visible:text-white" href="#browse">Fleet</Link>
              <Link className="transition-colors hover:text-white focus-visible:text-white" href="/experience">Experience</Link>
            </nav>
            <div className="flex items-center justify-self-end gap-4">
              <Link href="/login" className="text-xs font-semibold text-white/55 transition hover:text-white max-sm:hidden">Sign in</Link>
              <Link href="#browse" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 bg-white/[.07] px-4 py-2 text-xs font-semibold backdrop-blur-xl transition hover:bg-white/12 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                Find a car <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </header>
        </div>

        <div className="absolute inset-0" style={{ opacity: gOpacity }} aria-hidden={gOpacity < 0.02}>
          <div
            aria-hidden="true"
            className="absolute left-[60%] top-[48%] -z-40 aspect-square w-[min(94vw,1080px)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(170,185,195,.23)_0%,rgba(69,82,91,.12)_40%,transparent_70%)] blur-2xl max-md:left-[72%]"
            style={{ transform: `translate3d(calc(-50% + ${gLightX}px), -50%, 0)` }}
          />
          <div aria-hidden="true" className="absolute inset-0 -z-30 bg-[linear-gradient(90deg,rgba(5,6,7,.98)_0%,rgba(5,6,7,.88)_25%,rgba(5,6,7,.24)_61%,rgba(5,6,7,.58)_100%)] max-md:bg-[linear-gradient(180deg,rgba(5,6,7,.98)_0%,rgba(5,6,7,.72)_42%,rgba(5,6,7,.42)_74%,rgba(5,6,7,.96)_100%)]" />
          <div
            aria-hidden="true"
            className="absolute left-1/2 top-[49%] -z-20 -translate-x-1/2 -translate-y-1/2 select-none whitespace-nowrap text-[clamp(8rem,17vw,18rem)] font-black leading-none tracking-[-.09em] text-white max-sm:text-[32vw]"
            style={{ opacity: gWordmarkOpacity, transform: `translate3d(calc(-50% + ${reducedMotion ? 0 : mix(-10, 20, gProgress) + pointerX * 4}px), -50%, 0)` }}
          >
            DRIFT
          </div>

          <div
            className="absolute left-[max(20px,calc((100vw-1440px)/2))] top-[clamp(8.5rem,18vh,12rem)] z-20 max-w-[700px] max-md:left-5 max-md:right-5 max-md:top-[7.5rem]"
            style={{ opacity: gCopyOpacity, transform: `translate3d(0, ${reducedMotion ? 0 : mix(0, -24, range(gProgress, 0.12, 0.34))}px, 0)` }}
          >
            <p className="flex items-center gap-3 text-[10px] font-bold tracking-[.24em] text-white/48"><span className="h-px w-9 bg-white/55" /> CHAPTER 01 · AMG PRESENCE</p>
            <h1 className="mt-5 text-[clamp(4.3rem,9.7vw,9.7rem)] font-semibold leading-[.77] tracking-[-.074em] max-sm:text-[clamp(3.7rem,18vw,5.6rem)]">
              <span className="block">Move</span>
              <span className="ml-[clamp(0rem,7vw,7rem)] block text-white/36 max-sm:ml-0">different.</span>
            </h1>
            <p className="mt-[clamp(1.7rem,4vh,3.2rem)] max-w-md text-[clamp(.92rem,1.15vw,1.05rem)] leading-7 text-white/56">Choose the car. See the price. Own the moment.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="#browse" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                Explore the fleet <ArrowRight className="size-4" />
              </Link>
              <Link href="/experience" className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/14 bg-black/20 px-5 py-3 text-sm font-semibold text-white/80 backdrop-blur-xl transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                <Sparkles className="size-4" /> Drift Experience
              </Link>
            </div>
          </div>

          <div
            className="pointer-events-none absolute inset-x-0 bottom-[2vh] z-10 mx-auto h-[74%] w-[min(96vw,1380px)] max-md:bottom-[5vh] max-md:h-[59%] max-md:w-[138vw]"
            style={{ transform: `translate3d(${gCarX}px, ${gCarY}px, 0) scale(${gCarScale}) rotate(${gCarRotate}deg)` }}
            role="img"
            aria-label={`${heroVehicle.year} ${heroVehicle.brand} ${heroVehicle.model}`}
          >
            <div aria-hidden="true" className="absolute bottom-[8%] left-[16%] right-[5%] h-[12%] rounded-[50%] bg-black/85 blur-3xl" />
            {G_WAGON_IMAGES.map((src, index) => (
              <div
                key={src}
                aria-hidden="true"
                className="absolute inset-0 bg-cover bg-center [filter:saturate(.7)_contrast(1.12)_brightness(.67)] [mask-image:linear-gradient(90deg,transparent_0%,rgba(0,0,0,.82)_8%,black_23%,black_92%,transparent_100%)] max-md:bg-[position:52%_center]"
                style={{ backgroundImage: `url("${src}")`, opacity: gImageOpacities[index] }}
              />
            ))}
            <div aria-hidden="true" className="drift-light-sweep absolute inset-0 bg-[linear-gradient(112deg,transparent_34%,rgba(255,255,255,.11)_48%,transparent_61%)] mix-blend-screen" />
          </div>

          <div className="absolute inset-0 z-20 hidden lg:block" style={{ opacity: gSpecOpacity }} aria-label={`${heroVehicle.brand} ${heroVehicle.model} specifications`}>
            <SpecMarker className="left-[7%] top-[43%]" align="left" label={gSpecs[0]} emphasis />
            <SpecMarker className="left-[12%] top-[67%]" align="left" label={gSpecs[1]} />
            <SpecMarker className="right-[7%] top-[38%]" align="right" label={gSpecs[2]} />
            <SpecMarker className="right-[10%] top-[57%]" align="right" label={gSpecs[3]} />
            <SpecMarker className="right-[14%] top-[70%]" align="right" label={gSpecs[4]} />
            <SpecMarker className="right-[7%] top-[80%]" align="right" label={gSpecs[5]} emphasis />
          </div>

          <div className="absolute inset-x-4 bottom-5 z-30 flex flex-wrap justify-center gap-2 lg:hidden" style={{ opacity: gSpecOpacity }}>
            {gSpecs.slice(0, 5).map((spec) => <span key={spec} className="rounded-full border border-white/12 bg-black/48 px-3 py-2 text-[9px] font-semibold tracking-[.12em] text-white/72 backdrop-blur-lg">{spec}</span>)}
            <span className="rounded-full bg-white px-3 py-2 text-[9px] font-bold tracking-[.12em] text-black">{gSpecs[5]}</span>
          </div>

          <div className="absolute bottom-4 left-5 z-40 max-w-[72vw] text-[9px] leading-4 text-white/22 max-sm:hidden">
            G 63 showcase photography: <a className="underline decoration-white/20 underline-offset-2 hover:text-white/50" href={G_WAGON_SOURCE} target="_blank" rel="noreferrer">Damian B Oh / Wikimedia Commons, CC BY-SA 4.0</a>
          </div>
        </div>

        <div
          aria-hidden="true"
          className="absolute inset-0 z-[21] bg-[radial-gradient(circle_at_50%_48%,rgba(255,255,255,.08),transparent_28%),linear-gradient(115deg,#050607_8%,#161719_51%,#050607_92%)]"
          style={{ opacity: fadeWindow(p, 0.43, 0.49, 0.5, 0.56) }}
        />

        <div className="absolute inset-0" style={{ opacity: slsOpacity }} aria-hidden={slsOpacity < 0.02}>
          <div aria-hidden="true" className="absolute inset-0 -z-40 bg-[radial-gradient(circle_at_50%_58%,rgba(138,54,38,.18)_0%,rgba(42,24,21,.1)_34%,transparent_67%),linear-gradient(180deg,#050506,#0b0a0a_68%,#050506)]" />
          <div aria-hidden="true" className="absolute inset-x-[12%] bottom-[15%] -z-30 h-px bg-gradient-to-r from-transparent via-white/24 to-transparent" />
          <div aria-hidden="true" className="absolute inset-x-[18%] bottom-[8%] -z-30 h-[28%] rounded-[50%] bg-[radial-gradient(ellipse,rgba(255,255,255,.07),transparent_63%)] blur-2xl" />

          <div
            aria-hidden="true"
            className="absolute left-1/2 top-[48%] -z-20 -translate-x-1/2 -translate-y-1/2 select-none whitespace-nowrap text-[clamp(7rem,15vw,15rem)] font-black leading-none tracking-[-.075em] text-white max-sm:text-[28vw]"
            style={{ opacity: 0.055 * slsOpacity, transform: `translate3d(calc(-50% + ${reducedMotion ? 0 : pointerX * 3}px), -50%, 0)` }}
          >
            GULLWING
          </div>

          <div
            className="absolute left-[max(20px,calc((100vw-1440px)/2))] top-[clamp(8.8rem,19vh,12.5rem)] z-30 max-w-[680px] max-md:left-5 max-md:right-5 max-md:top-[7.7rem]"
            style={{ opacity: slsCopyOpacity, transform: `translate3d(0, ${reducedMotion ? 0 : mix(22, -16, range(slsProgress, 0.04, 0.34))}px, 0)` }}
          >
            <p className="flex items-center gap-3 text-[10px] font-bold tracking-[.24em] text-white/45"><span className="h-px w-9 bg-[#d59a83]" /> CHAPTER 02 · THE ICON</p>
            <h2 className="mt-5 max-w-[760px] text-[clamp(4rem,8.7vw,8.8rem)] font-semibold leading-[.79] tracking-[-.07em] max-sm:text-[clamp(3.35rem,16vw,5rem)]">
              An icon <span className="text-white/36">takes flight.</span>
            </h2>
            <p className="mt-6 text-sm font-semibold uppercase tracking-[.18em] text-white/62">Mercedes-Benz SLS AMG</p>
            <p className="mt-3 max-w-md text-sm leading-6 text-white/44">A Drift Experience showcase. The SLS is not presented as currently bookable inventory.</p>
          </div>

          <div
            className="pointer-events-none absolute inset-x-0 bottom-[3vh] z-10 mx-auto h-[70%] w-[min(96vw,1380px)] max-md:bottom-[9vh] max-md:h-[55%] max-md:w-[138vw]"
            style={{ transform: `translate3d(${slsX}px, ${slsY}px, 0) scale(${slsScale})` }}
            role="img"
            aria-label="Mercedes-Benz SLS AMG cinematic gullwing showcase"
          >
            <div aria-hidden="true" className="absolute bottom-[7%] left-[17%] right-[8%] h-[12%] rounded-[50%] bg-black/90 blur-3xl" />
            <div aria-hidden="true" className="absolute left-[29%] top-[4%] h-[52%] w-[10%] -rotate-[18deg] bg-[linear-gradient(to_top,rgba(214,136,104,.32),transparent)] blur-2xl" style={{ opacity: wingGlow }} />
            <div aria-hidden="true" className="absolute right-[29%] top-[4%] h-[52%] w-[10%] rotate-[18deg] bg-[linear-gradient(to_top,rgba(214,136,104,.32),transparent)] blur-2xl" style={{ opacity: wingGlow }} />
            {showSlsAssets && (
              <>
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-cover bg-center [filter:saturate(.62)_contrast(1.13)_brightness(.64)] [mask-image:linear-gradient(90deg,transparent_1%,rgba(0,0,0,.9)_10%,black_23%,black_91%,transparent_99%)] max-md:bg-[position:52%_center]"
                  style={{ backgroundImage: `url("${SLS_CLOSED}")`, opacity: slsClosedOpacity }}
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-cover bg-center [filter:saturate(.64)_contrast(1.15)_brightness(.68)] [mask-image:linear-gradient(90deg,transparent_1%,rgba(0,0,0,.9)_10%,black_23%,black_91%,transparent_99%)] max-md:bg-[position:50%_center]"
                  style={{ backgroundImage: `url("${SLS_OPEN}")`, opacity: slsOpenOpacity }}
                />
              </>
            )}
            <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(112deg,transparent_34%,rgba(255,215,196,.11)_48%,transparent_61%)] mix-blend-screen" style={{ transform: `translate3d(${mix(-55, 65, slsProgress)}%,0,0)`, opacity: slsOpacity }} />
          </div>

          <div className="absolute inset-0 z-30 hidden lg:block" style={{ opacity: slsSpecOpacity }} aria-label="Mercedes-Benz SLS AMG showcase specifications">
            <SpecMarker className="left-[8%] top-[44%]" align="left" label={slsSpecs[0]} emphasis />
            <SpecMarker className="left-[11%] top-[67%]" align="left" label={slsSpecs[1]} />
            <SpecMarker className="right-[7%] top-[41%]" align="right" label={slsSpecs[2]} />
            <SpecMarker className="right-[11%] top-[62%]" align="right" label={slsSpecs[3]} />
            <SpecMarker className="right-[7%] top-[78%]" align="right" label={slsSpecs[4]} emphasis />
          </div>

          <div className="absolute inset-x-4 bottom-6 z-30 flex flex-wrap justify-center gap-2 lg:hidden" style={{ opacity: slsSpecOpacity }}>
            {slsSpecs.map((spec, index) => <span key={spec} className={`rounded-full px-3 py-2 text-[9px] font-semibold tracking-[.12em] backdrop-blur-lg ${index === slsSpecs.length - 1 ? 'bg-white text-black' : 'border border-white/12 bg-black/48 text-white/72'}`}>{spec}</span>)}
          </div>

          <div className="absolute bottom-4 left-5 z-40 max-w-[72vw] text-[9px] leading-4 text-white/25 max-sm:hidden">
            SLS showcase photography: <a className="underline decoration-white/20 underline-offset-2 hover:text-white/50" href={SLS_SOURCE_CLOSED} target="_blank" rel="noreferrer">Sicnag / Wikimedia Commons</a> · <a className="underline decoration-white/20 underline-offset-2 hover:text-white/50" href={SLS_SOURCE_OPEN} target="_blank" rel="noreferrer">Axion23 / Wikimedia Commons, CC BY 2.0</a>
          </div>
        </div>

        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 z-[35] h-[58%] bg-[linear-gradient(to_bottom,transparent,#f5f5f7_78%)]" style={{ opacity: handoff }} />
        <div
          className="absolute inset-x-0 bottom-[10vh] z-40 mx-auto w-[min(100%-40px,1240px)] text-center text-[#15171a] max-md:bottom-[8vh]"
          style={{ opacity: handoff, transform: `translate3d(0, ${mix(38, 0, handoff)}px, 0)` }}
        >
          <p className="text-[10px] font-bold tracking-[.22em] text-black/42">THE REAL DRIFT FLEET</p>
          <h2 className="mt-3 text-[clamp(2.8rem,6vw,5.8rem)] font-semibold leading-none tracking-[-.065em]">Choose your drive.</h2>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-black/52">The cinematic story hands the wheel back to the rental product: real vehicles, real prices, filters and the working booking flow.</p>
          <Link href="#browse" className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black">
            Browse available cars <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="drift-scroll-cue absolute bottom-7 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 text-[9px] font-semibold uppercase tracking-[.18em] text-white/38 max-md:hidden" style={{ opacity: (1 - range(p, 0.09, 0.18)) * (1 - handoff) }}>
          Scroll to explore <span className="h-8 w-px bg-white/18" /><ArrowDown className="size-3.5" />
        </div>

        <div className="absolute right-6 top-1/2 z-50 hidden -translate-y-1/2 items-center gap-3 text-[9px] font-semibold tracking-[.14em] text-white/36 xl:flex [writing-mode:vertical-rl]" style={{ opacity: 1 - handoff }}>
          <span>{chapter[0]}</span>
          <span className="h-12 w-px bg-white/16" />
          <span>{chapter[1]}</span>
        </div>
      </div>
    </section>
  );
}

function SpecMarker({ label, className, align, emphasis = false }: { label: string; className: string; align: 'left' | 'right'; emphasis?: boolean }) {
  return (
    <div className={`absolute ${className} flex items-center gap-3 ${align === 'right' ? 'flex-row-reverse text-right' : ''}`}>
      <span className={`size-1.5 rounded-full ${emphasis ? 'bg-white' : 'bg-[#d59a83]'}`} />
      <span className="h-px w-12 bg-white/18" aria-hidden="true" />
      <span className={`text-[9px] font-semibold tracking-[.16em] ${emphasis ? 'text-white' : 'text-white/58'}`}>{label}</span>
    </div>
  );
}
