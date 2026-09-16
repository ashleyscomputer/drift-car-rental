'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { ArrowRight, CarFront } from 'lucide-react';
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

const G63_IMAGES = [
  '/cinematic/g63-01.jpg',
  '/cinematic/g63-02.jpg',
  '/cinematic/g63-03.jpg',
];
const SLS_IMAGES = ['/cinematic/sls-closed.jpg', '/cinematic/sls-open.jpg'];
const FERRARI_IMAGES = [
  '/cinematic/ferrari-01.jpg',
  '/cinematic/ferrari-02.jpg',
  '/cinematic/ferrari-03.jpg',
];

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const mix = (from: number, to: number, amount: number) => from + (to - from) * clamp(amount);
const range = (value: number, start: number, end: number) => clamp((value - start) / Math.max(end - start, 0.0001));
const fadeWindow = (value: number, startIn: number, endIn: number, startOut: number, endOut: number) =>
  Math.min(range(value, startIn, endIn), 1 - range(value, startOut, endOut));
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
        // Keep the seeded G63 fallback so the cinematic layer never blocks the rental product.
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
      setPointer({
        x: clamp((event.clientX / Math.max(window.innerWidth, 1) - 0.5) * 2, -1, 1),
        y: clamp((event.clientY / Math.max(window.innerHeight, 1) - 0.5) * 2, -1, 1),
      });
    };
    const leave = () => setPointer({ x: 0, y: 0 });
    window.addEventListener('pointermove', move, { passive: true });
    document.documentElement.addEventListener('mouseleave', leave);
    return () => {
      window.removeEventListener('pointermove', move);
      document.documentElement.removeEventListener('mouseleave', leave);
    };
  }, [finePointer, reducedMotion]);

  const p = reducedMotion ? clamp(progress * 1.02) : progress;
  const g = range(p, 0, 0.335);
  const sls = range(p, 0.30, 0.655);
  const ferrari = range(p, 0.615, 0.915);
  const handoff = range(p, 0.885, 0.995);
  const pointerX = finePointer && !reducedMotion ? pointer.x : 0;
  const pointerY = finePointer && !reducedMotion ? pointer.y : 0;

  const gOpacity = 1 - range(p, 0.285, 0.345);
  const slsOpacity = range(p, 0.292, 0.335) * (1 - range(p, 0.602, 0.662));
  const ferrariOpacity = range(p, 0.61, 0.655) * (1 - range(p, 0.872, 0.925));
  const showSlsAssets = p > 0.245;
  const showFerrariAssets = p > 0.54;

  const allWheelDrive = useMemo(
    () => heroVehicle.features.find((feature) => /4x4|all-wheel|awd/i.test(feature)) ?? '4MATIC / AWD',
    [heroVehicle],
  );

  const chapter = p < 0.305 ? 1 : p < 0.625 ? 2 : p < 0.89 ? 3 : 4;
  const scrollToChapter = (target: number) => {
    const stage = stageRef.current;
    if (!stage) return;
    const top = window.scrollY + stage.getBoundingClientRect().top;
    const distance = Math.max(stage.offsetHeight - window.innerHeight, 1);
    window.scrollTo({ top: top + target * distance, behavior: reducedMotion ? 'auto' : 'smooth' });
  };

  const gAngleOpacity = [
    1 - range(g, 0.31, 0.44),
    fadeWindow(g, 0.29, 0.42, 0.57, 0.69),
    range(g, 0.59, 0.72),
  ];
  const gCopy = 1 - range(g, 0.29, 0.42);
  const gSpecs = fadeWindow(g, 0.47, 0.58, 0.84, 0.96);
  const gPrice = range(g, 0.61, 0.72) * (1 - range(g, 0.9, 0.99));

  const door = range(sls, 0.36, 0.64);
  const slsCopy = fadeWindow(sls, 0.1, 0.2, 0.51, 0.63);
  const slsOpen = range(door, 0.08, 0.9);
  const slsSpecs = range(sls, 0.64, 0.76) * (1 - range(sls, 0.91, 1));

  const ferrariAngle = [
    1 - range(ferrari, 0.32, 0.45),
    fadeWindow(ferrari, 0.29, 0.42, 0.58, 0.69),
    range(ferrari, 0.6, 0.73),
  ];
  const ferrariCopy = fadeWindow(ferrari, 0.1, 0.2, 0.47, 0.58);
  const ferrariSpecs = range(ferrari, 0.62, 0.74) * (1 - range(ferrari, 0.92, 1));

  return (
    <section ref={stageRef} id="drift-cinematic-home" className="relative h-[380svh] bg-[#070809] text-white max-md:h-[330svh]">
      <link rel="preload" as="image" href={G63_IMAGES[0]} />
      <style>{`
        .drift-grain{background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.18'/%3E%3C/svg%3E");mix-blend-mode:soft-light}
        .drift-hairline{background:linear-gradient(90deg,transparent,rgba(255,255,255,.55),transparent)}
        .drift-nav-button{position:relative}.drift-nav-button:after{content:'';position:absolute;left:0;right:100%;bottom:-7px;height:1px;background:white;transition:right .35s cubic-bezier(.22,1,.36,1)}.drift-nav-button:hover:after,.drift-nav-button:focus-visible:after{right:0}
        .drift-image{transition:filter .35s ease;will-change:transform,opacity,clip-path}
        @media(max-width:767px){.drift-grain{opacity:.06!important}.drift-image{filter:saturate(.78) contrast(1.08) brightness(.72)!important}}
        @media(prefers-reduced-motion:reduce){.drift-image{transform:none!important}.drift-motion-only{display:none!important}}
      `}</style>

      <div className="sticky top-0 isolate h-[100svh] overflow-hidden bg-[#070809]">
        <div aria-hidden="true" className="absolute inset-0 -z-50 bg-[radial-gradient(circle_at_72%_50%,rgba(119,132,139,.16),transparent_34%),linear-gradient(180deg,#070809,#0a0b0c_67%,#070809)]" />
        <div aria-hidden="true" className="drift-grain pointer-events-none absolute inset-0 z-[70] opacity-[.10]" />

        <header className="absolute inset-x-0 top-0 z-[80]">
          <div className="mx-auto grid h-[72px] w-[min(100%-36px,1440px)] grid-cols-[1fr_auto_1fr] items-center gap-8 border-b border-white/10 max-md:grid-cols-[1fr_auto]">
            <button onClick={() => scrollToChapter(0)} className="flex w-fit items-center gap-3 text-xs font-black tracking-[.24em] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white" aria-label="Back to Drift opening">
              <span className="grid size-8 place-items-center rounded-full border border-white/18"><CarFront className="size-3.5" /></span>
              DRIFT
            </button>
            <nav className="flex items-center gap-8 text-[10px] font-semibold uppercase tracking-[.18em] text-white/48 max-md:hidden" aria-label="Cinematic chapters">
              <button className={`drift-nav-button ${chapter === 1 ? 'text-white' : 'hover:text-white'}`} onClick={() => scrollToChapter(0.03)}>01 G63</button>
              <button className={`drift-nav-button ${chapter === 2 ? 'text-white' : 'hover:text-white'}`} onClick={() => scrollToChapter(0.32)}>02 SLS</button>
              <button className={`drift-nav-button ${chapter === 3 ? 'text-white' : 'hover:text-white'}`} onClick={() => scrollToChapter(0.64)}>03 812</button>
              <button className="drift-nav-button hover:text-white" onClick={() => scrollToChapter(0.95)}>Fleet</button>
            </nav>
            <div className="flex items-center justify-self-end gap-4">
              <span className="hidden text-[9px] font-semibold uppercase tracking-[.18em] text-white/34 lg:block">South Africa · ZAR</span>
              <Link href="/login" className="text-[11px] font-semibold uppercase tracking-[.13em] text-white/58 transition hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Sign in</Link>
            </div>
          </div>
        </header>

        <div className="absolute left-1/2 top-[50%] z-[75] hidden -translate-y-1/2 xl:block" style={{ left: 'calc(100% - 28px)', opacity: 1 - handoff }}>
          <div className="flex items-center gap-3 text-[9px] font-semibold tracking-[.18em] text-white/34 [writing-mode:vertical-rl]">
            <span>{String(Math.min(chapter, 3)).padStart(2, '0')} / 03</span>
            <span className="h-12 w-px bg-white/16" />
            <span>{chapter === 1 ? 'G 63' : chapter === 2 ? 'SLS AMG' : chapter === 3 ? '812 SUPERFAST' : 'FLEET'}</span>
          </div>
        </div>

        <div className="absolute inset-0" style={{ opacity: gOpacity }} aria-hidden={gOpacity < 0.02}>
          <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(112deg,rgba(4,5,6,.99)_0%,rgba(8,10,11,.9)_31%,rgba(13,16,18,.24)_67%,rgba(4,5,6,.88)_100%)]" />
          <div aria-hidden="true" className="absolute right-[-12vw] top-[12vh] h-[78vh] w-[62vw] bg-[linear-gradient(115deg,transparent_15%,rgba(196,211,219,.1)_48%,transparent_75%)] blur-3xl" style={{ transform: `translate3d(${pointerX * 16}px,${pointerY * 10}px,0) rotate(-8deg)` }} />
          <div aria-hidden="true" className="absolute left-[33%] top-[46%] z-0 -translate-y-1/2 whitespace-nowrap text-[clamp(9rem,23vw,22rem)] font-black leading-none tracking-[-.09em] text-white/[.055] max-md:left-3 max-md:top-[40%] max-md:text-[34vw]" style={{ transform: `translate3d(${reducedMotion ? 0 : mix(-18, 22, g)}px,-50%,0)` }}>G 63</div>

          <div className="absolute left-[max(20px,calc((100vw-1440px)/2))] top-[clamp(8.5rem,18vh,12rem)] z-30 w-[min(40vw,520px)] max-md:left-5 max-md:right-5 max-md:top-[6.9rem] max-md:w-auto" style={{ opacity: gCopy, transform: `translate3d(0,${reducedMotion ? 0 : mix(16, -10, range(g, 0.05, 0.36))}px,0)` }}>
            <Eyebrow>DRIFT / 01 · G 63</Eyebrow>
            <h1 className="mt-5 text-[clamp(4rem,8.5vw,8.4rem)] font-semibold leading-[.78] tracking-[-.075em] max-md:text-[clamp(3.5rem,17vw,5.7rem)]">Built to <span className="text-white/34">arrive.</span></h1>
            <p className="mt-6 max-w-sm text-sm leading-6 text-white/50">Architectural presence for South African roads. The rate below comes from the live Drift fleet, not campaign copy.</p>
          </div>

          <figure className="pointer-events-none absolute bottom-[1vh] right-[-4vw] z-10 h-[78vh] w-[74vw] max-md:bottom-[13vh] max-md:right-[-33vw] max-md:h-[54vh] max-md:w-[132vw]" aria-label={`${heroVehicle.year} ${heroVehicle.brand} ${heroVehicle.model}`}>
            <div aria-hidden="true" className="absolute bottom-[8%] left-[14%] right-[8%] h-[13%] rounded-[50%] bg-black/80 blur-3xl" />
            {G63_IMAGES.map((src, index) => (
              <img
                key={src}
                src={src}
                alt=""
                aria-hidden="true"
                loading={index === 0 ? 'eager' : 'lazy'}
                className="drift-image absolute inset-0 size-full object-cover [filter:saturate(.72)_contrast(1.13)_brightness(.67)]"
                style={{
                  opacity: gAngleOpacity[index],
                  objectPosition: index === 0 ? '56% center' : index === 1 ? '51% center' : '47% center',
                  transform: `translate3d(${mix(22, -18, g) + pointerX * 5}px,${mix(18, -4, g) + pointerY * 4}px,0) scale(${mix(1.03, 1.11, g)})`,
                  clipPath: index === 1 ? `polygon(${mix(100, 0, range(g, .3, .48))}% 0,100% 0,100% 100%,${mix(82, 0, range(g, .3, .48))}% 100%)` : undefined,
                }}
              />
            ))}
            <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(112deg,transparent_35%,rgba(235,246,250,.12)_49%,transparent_63%)] mix-blend-screen" style={{ transform: `translate3d(${mix(-72, 68, g) + pointerX * 10}%,0,0)` }} />
          </figure>

          <div className="absolute right-[max(26px,calc((100vw-1440px)/2))] top-[31%] z-40 hidden w-[240px] space-y-7 lg:block" style={{ opacity: gSpecs }}>
            <SpecLine label="POWERTRAIN" value="V8 BITURBO" />
            <SpecLine label="TRACTION" value={allWheelDrive.toUpperCase()} />
            <SpecLine label="TRANSMISSION" value={heroVehicle.transmission.toUpperCase()} />
            <SpecLine label="BODY" value={`${heroVehicle.doors} DOORS`} />
          </div>

          <div className="absolute bottom-[7vh] left-[max(20px,calc((100vw-1440px)/2))] z-40 max-md:bottom-[5vh] max-md:left-5" style={{ opacity: gPrice, transform: `translate3d(0,${mix(16, 0, gPrice)}px,0)` }}>
            <p className="text-[9px] font-bold uppercase tracking-[.2em] text-white/42">LIVE FLEET RATE</p>
            <p className="mt-2 text-[clamp(2rem,3.3vw,3.8rem)] font-semibold tracking-[-.05em]">From {currency(heroVehicle.dailyRate)} <span className="text-lg font-medium text-white/42">/ day</span></p>
            <Link href="#browse" className="mt-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[.13em] text-white/70 transition hover:gap-3 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Explore the fleet <ArrowRight className="size-3.5" /></Link>
          </div>
        </div>

        <div aria-hidden="true" className="absolute inset-0 z-[32] bg-[#070809]" style={{ opacity: fadeWindow(p, 0.292, 0.316, 0.332, 0.352) }}>
          <div className="absolute left-[-20%] right-[-20%] top-1/2 h-px bg-white/65 shadow-[0_0_44px_rgba(255,255,255,.55)]" style={{ transform: `translate3d(${mix(-38, 38, range(p, .292, .352))}%,0,0)` }} />
        </div>

        <div className="absolute inset-0" style={{ opacity: slsOpacity }} aria-hidden={slsOpacity < 0.02}>
          <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_63%_68%,rgba(134,67,45,.18),transparent_32%),linear-gradient(180deg,#060607,#0a0909_70%,#050505)]" />
          <div aria-hidden="true" className="absolute left-[15%] top-[49%] z-0 -translate-y-1/2 whitespace-nowrap text-[clamp(8rem,19vw,19rem)] font-black leading-none tracking-[-.09em] text-white/[.045] max-md:left-3 max-md:top-[41%] max-md:text-[29vw]">GULLWING</div>

          <div className="absolute left-[max(20px,calc((100vw-1440px)/2))] top-[clamp(8.5rem,18vh,12rem)] z-30 max-w-[650px] max-md:left-5 max-md:right-5 max-md:top-[6.9rem]" style={{ opacity: slsCopy }}>
            <Eyebrow warm>DRIFT / 02 · SLS AMG</Eyebrow>
            <p className="mt-5 text-[11px] font-semibold uppercase tracking-[.18em] text-white/48">Mercedes-Benz SLS AMG</p>
            <h2 className="mt-3 text-[clamp(3.8rem,8vw,8rem)] font-semibold leading-[.79] tracking-[-.072em] max-md:text-[clamp(3.25rem,15.5vw,5.1rem)]">An icon <span className="text-white/34">takes flight.</span></h2>
          </div>

          <figure className="pointer-events-none absolute bottom-[1vh] left-1/2 z-10 h-[76vh] w-[82vw] -translate-x-1/2 max-md:bottom-[12vh] max-md:h-[55vh] max-md:w-[134vw]" aria-label="Mercedes-Benz SLS AMG Drift Experience showcase">
            <div aria-hidden="true" className="absolute bottom-[8%] left-[17%] right-[17%] h-[13%] rounded-[50%] bg-black/85 blur-3xl" />
            {showSlsAssets && (
              <>
                <img src={SLS_IMAGES[0]} alt="" aria-hidden="true" loading="lazy" className="drift-image absolute inset-0 size-full object-cover [filter:saturate(.55)_contrast(1.12)_brightness(.62)]" style={{ opacity: 1 - slsOpen, objectPosition: '50% center', transform: `translate3d(${mix(30, 4, sls) + pointerX * 4}px,${mix(18, -2, sls) + pointerY * 3}px,0) scale(${mix(.99, 1.08, sls)})` }} />
                <img src={SLS_IMAGES[1]} alt="" aria-hidden="true" loading="lazy" className="drift-image absolute inset-0 size-full object-cover [filter:saturate(.58)_contrast(1.13)_brightness(.66)]" style={{ opacity: slsOpen, objectPosition: '50% center', transform: `translate3d(${mix(18, -8, sls) + pointerX * 4}px,${mix(16, -4, sls) + pointerY * 3}px,0) scale(${mix(1.02, 1.1, sls)})`, clipPath: `inset(${mix(18, 0, slsOpen)}% ${mix(10, 0, slsOpen)}% 0 ${mix(10, 0, slsOpen)}%)` }} />
              </>
            )}
            <div aria-hidden="true" className="absolute left-[25%] right-[25%] top-[6%] h-[48%] bg-[radial-gradient(ellipse,rgba(223,155,120,.26),transparent_66%)] blur-2xl" style={{ opacity: slsOpen }} />
            <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(104deg,transparent_36%,rgba(255,219,197,.13)_49%,transparent_62%)] mix-blend-screen" style={{ transform: `translate3d(${mix(-65, 65, sls)}%,0,0)` }} />
          </figure>

          <div className="absolute bottom-[7vh] right-[max(24px,calc((100vw-1440px)/2))] z-40 w-[min(86vw,440px)] text-right max-md:bottom-[5vh] max-md:left-5 max-md:right-5 max-md:w-auto max-md:text-left" style={{ opacity: slsSpecs }}>
            <p className="text-[9px] font-bold uppercase tracking-[.2em] text-[#d9a58e]">DRIFT EXPERIENCE</p>
            <p className="mt-3 text-sm leading-6 text-white/54">6.2L V8 · GULLWING DOORS · REAR-WHEEL DRIVE · 7-SPEED DCT</p>
            <p className="mt-2 text-[11px] leading-5 text-white/34">Showcase vehicle. It is not presented as bookable rental inventory.</p>
          </div>
        </div>

        <div aria-hidden="true" className="absolute inset-0 z-[33] bg-[#060607]" style={{ opacity: fadeWindow(p, 0.604, 0.628, 0.648, 0.67) }}>
          <div className="absolute inset-y-0 left-[-18%] w-[46%] -skew-x-12 bg-[linear-gradient(90deg,transparent,rgba(167,16,26,.48),transparent)] blur-xl" style={{ transform: `translate3d(${mix(-40, 290, range(p, .604, .67))}%,0,0)` }} />
        </div>

        <div className="absolute inset-0" style={{ opacity: ferrariOpacity }} aria-hidden={ferrariOpacity < 0.02}>
          <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_72%_58%,rgba(171,18,29,.2),transparent_31%),linear-gradient(112deg,#060607_6%,#100708_54%,#050506_95%)]" />
          <div aria-hidden="true" className="absolute left-[3%] top-[48%] z-0 -translate-y-1/2 whitespace-nowrap text-[clamp(10rem,24vw,24rem)] font-black leading-none tracking-[-.09em] text-white/[.04] max-md:top-[42%] max-md:text-[39vw]">812</div>
          <div aria-hidden="true" className="absolute inset-x-[8%] bottom-[12%] h-px bg-gradient-to-r from-transparent via-[#bf1f2e]/50 to-transparent" />

          <div className="absolute left-[max(20px,calc((100vw-1440px)/2))] top-[clamp(8.5rem,18vh,12rem)] z-30 max-w-[650px] max-md:left-5 max-md:right-5 max-md:top-[6.9rem]" style={{ opacity: ferrariCopy, transform: `translate3d(${reducedMotion ? 0 : mix(-12, 0, range(ferrari, .08, .28))}px,0,0)` }}>
            <Eyebrow red>DRIFT / 03 · 812 SUPERFAST</Eyebrow>
            <p className="mt-5 text-[11px] font-semibold uppercase tracking-[.18em] text-white/48">Ferrari 812 Superfast</p>
            <h2 className="mt-3 text-[clamp(3.8rem,8.4vw,8.4rem)] font-semibold leading-[.78] tracking-[-.074em] max-md:text-[clamp(3.2rem,15vw,5rem)]">Velocity, <span className="text-white/32">sculpted.</span></h2>
          </div>

          <figure className="pointer-events-none absolute bottom-[-1vh] right-[-7vw] z-10 h-[79vh] w-[80vw] max-md:bottom-[12vh] max-md:right-[-38vw] max-md:h-[54vh] max-md:w-[142vw]" aria-label="Ferrari 812 Superfast Drift Experience showcase">
            <div aria-hidden="true" className="absolute bottom-[8%] left-[16%] right-[8%] h-[13%] rounded-[50%] bg-black/90 blur-3xl" />
            {showFerrariAssets && FERRARI_IMAGES.map((src, index) => (
              <img
                key={src}
                src={src}
                alt=""
                aria-hidden="true"
                loading="lazy"
                className="drift-image absolute inset-0 size-full object-cover [filter:saturate(.78)_contrast(1.15)_brightness(.64)]"
                style={{
                  opacity: ferrariAngle[index],
                  objectPosition: index === 0 ? '50% center' : index === 1 ? '48% center' : '55% center',
                  transform: `translate3d(${mix(46, -24, ferrari) + pointerX * 7}px,${mix(16, -5, ferrari) + pointerY * 4}px,0) scale(${mix(1.02, 1.13, ferrari)})`,
                  clipPath: index === 1 ? `polygon(${mix(100, 0, range(ferrari, .29, .48))}% 0,100% 0,100% 100%,${mix(84, 0, range(ferrari, .29, .48))}% 100%)` : undefined,
                }}
              />
            ))}
            <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(101deg,transparent_30%,rgba(255,64,73,.18)_48%,transparent_65%)] mix-blend-screen" style={{ transform: `translate3d(${mix(-80, 88, ferrari) + pointerX * 12}%,0,0)` }} />
            <div aria-hidden="true" className="drift-motion-only absolute inset-y-[20%] left-[-10%] w-[55%] bg-[linear-gradient(90deg,transparent,rgba(255,255,255,.05),transparent)] blur-xl" style={{ transform: `translate3d(${mix(-50, 220, ferrari)}%,0,0)` }} />
          </figure>

          <div className="absolute bottom-[7vh] left-[max(20px,calc((100vw-1440px)/2))] z-40 max-w-[520px] max-md:bottom-[5vh] max-md:left-5 max-md:right-5" style={{ opacity: ferrariSpecs }}>
            <p className="text-[9px] font-bold uppercase tracking-[.2em] text-[#e3434e]">DRIFT EXPERIENCE</p>
            <p className="mt-3 text-sm leading-6 text-white/55">V12 · REAR-WHEEL DRIVE · 812 SUPERFAST · CARBON-INSPIRED AERO TREATMENT</p>
            <p className="mt-2 text-[11px] leading-5 text-white/34">Mansory-inspired campaign attitude only. No claim is made that this vehicle is a Mansory conversion or rental inventory.</p>
          </div>
        </div>

        <div aria-hidden="true" className="absolute inset-0 z-[50] bg-[linear-gradient(180deg,rgba(246,246,247,0)_0%,#f5f5f7_70%)]" style={{ opacity: handoff }} />
        <div className="absolute inset-x-0 bottom-[8vh] z-[60] mx-auto w-[min(100%-40px,1180px)] text-center text-[#17191c] max-md:bottom-[6vh]" style={{ opacity: handoff, transform: `translate3d(0,${reducedMotion ? 0 : mix(26, 0, handoff)}px,0)` }}>
          <p className="text-[9px] font-bold uppercase tracking-[.22em] text-black/42">THE REAL DRIFT FLEET · SOUTH AFRICA</p>
          <h2 className="mt-3 text-[clamp(3rem,6.3vw,6rem)] font-semibold leading-none tracking-[-.07em]">Choose your drive.</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-black/52">Real vehicles, live rates and the working booking flow. Pickup options in Kimberley, Upington, Bloemfontein, Johannesburg and Cape Town.</p>
          <Link href="#browse" className="mt-6 inline-flex min-h-12 items-center gap-2 border-b border-black/30 px-1 py-3 text-xs font-bold uppercase tracking-[.13em] transition hover:gap-3 hover:border-black focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black">Browse available cars <ArrowRight className="size-4" /></Link>
        </div>

        <a href="/cinematic/credits.txt" className="absolute bottom-4 left-5 z-[76] text-[8px] font-medium uppercase tracking-[.14em] text-white/20 transition hover:text-white/55 focus-visible:text-white max-md:hidden" style={{ opacity: 1 - handoff }}>Photography credits</a>
      </div>
    </section>
  );
}

function Eyebrow({ children, warm = false, red = false }: { children: React.ReactNode; warm?: boolean; red?: boolean }) {
  return (
    <p className="flex items-center gap-3 text-[9px] font-bold uppercase tracking-[.22em] text-white/47">
      <span className={`h-px w-9 ${red ? 'bg-[#df3441]' : warm ? 'bg-[#d59a83]' : 'bg-white/60'}`} />
      {children}
    </p>
  );
}

function SpecLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="group">
      <div className="h-px w-full bg-white/13"><span className="block h-px w-9 bg-white/58 transition-all duration-500 group-hover:w-16" /></div>
      <p className="mt-2 text-[8px] font-semibold uppercase tracking-[.18em] text-white/32">{label}</p>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-[.15em] text-white/68">{value}</p>
    </div>
  );
}
