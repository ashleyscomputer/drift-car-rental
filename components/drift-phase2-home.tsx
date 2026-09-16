'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { ArrowDown, ArrowRight, CarFront } from 'lucide-react';

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const range = (value: number, start: number, end: number) =>
  clamp((value - start) / Math.max(end - start, 0.0001));
const mix = (from: number, to: number, amount: number) => from + (to - from) * clamp(amount);
const fadeWindow = (value: number, startIn: number, endIn: number, startOut: number, endOut: number) =>
  Math.min(range(value, startIn, endIn), 1 - range(value, startOut, endOut));

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
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const finePointer = useMediaQuery('(pointer: fine)');

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
    const reset = () => setPointer({ x: 0, y: 0 });
    window.addEventListener('pointermove', move, { passive: true });
    document.documentElement.addEventListener('mouseleave', reset);
    return () => {
      window.removeEventListener('pointermove', move);
      document.documentElement.removeEventListener('mouseleave', reset);
    };
  }, [finePointer, reducedMotion]);

  const p = progress;
  const pointerX = finePointer && !reducedMotion ? pointer.x : 0;
  const pointerY = finePointer && !reducedMotion ? pointer.y : 0;

  const introOpacity = 1 - range(p, 0.16, 0.31);
  const approach = range(p, 0.06, 0.38);
  const doorOpen = reducedMotion ? (p > 0.42 ? 1 : 0) : range(p, 0.34, 0.57);
  const detail = range(p, 0.58, 0.84);
  const detailOpacity = fadeWindow(p, 0.56, 0.66, 0.84, 0.91);
  const handoff = range(p, 0.88, 0.985);
  const sceneOpacity = 1 - range(p, 0.9, 0.99);
  const progressPercent = clamp(p) * 100;

  const carScale = reducedMotion ? 1.04 : mix(0.96, 1.18, approach) + mix(0, 0.18, detail);
  const carX = reducedMotion ? 0 : mix(5, -4, approach) + mix(0, 13, detail) + pointerX * 1.2;
  const carY = reducedMotion ? 0 : mix(2, -1, approach) + mix(0, 4, detail) + pointerY * 0.7;
  const carRotation = reducedMotion ? 0 : mix(-0.7, 0.5, approach) + mix(0, -1.1, detail);
  const openScale = reducedMotion ? 1.06 : mix(1.01, 1.19, doorOpen) + mix(0, 0.19, detail);
  const openX = reducedMotion ? 0 : mix(2, -2, doorOpen) + mix(0, 13, detail) + pointerX * 1.1;
  const openY = reducedMotion ? 0 : mix(1, -1, doorOpen) + mix(0, 4, detail) + pointerY * 0.6;
  const openRotation = reducedMotion ? 0 : mix(-0.35, 0.4, doorOpen) + mix(0, -1, detail);

  return (
    <section
      ref={stageRef}
      id="drift-cinematic-home"
      className="relative h-[260svh] bg-[#050506] text-white max-md:h-[225svh]"
      aria-label="Mercedes-Benz SLS AMG cinematic presentation"
    >
      <style>{`
        .sls-grain{background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.18'/%3E%3C/svg%3E");mix-blend-mode:soft-light}
        .sls-car{will-change:transform,opacity,filter;transform-origin:center center}
        .sls-line{background:linear-gradient(90deg,transparent,rgba(255,229,211,.88),transparent)}
        @media(max-width:767px){.sls-grain{opacity:.045!important}.sls-car{filter:saturate(.78) contrast(1.08) brightness(.72)!important}}
        @media(prefers-reduced-motion:reduce){.sls-car{transform:none!important}.sls-motion{display:none!important}}
      `}</style>

      <div className="sticky top-0 isolate h-[100svh] overflow-hidden bg-[#050506]">
        <div aria-hidden="true" className="absolute inset-0 -z-50 bg-[radial-gradient(circle_at_63%_63%,rgba(125,58,38,.17),transparent_31%),linear-gradient(180deg,#050506,#090808_62%,#050506)]" />
        <div aria-hidden="true" className="sls-grain pointer-events-none absolute inset-0 z-[70] opacity-[.09]" />

        <header className="absolute inset-x-0 top-0 z-[90]">
          <div className="mx-auto flex h-[72px] w-[min(100%-36px,1440px)] items-center justify-between border-b border-white/10">
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' })}
              className="flex items-center gap-3 text-xs font-black tracking-[.24em] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              aria-label="Back to the beginning of the SLS experience"
            >
              <span className="grid size-8 place-items-center rounded-full border border-white/18"><CarFront className="size-3.5" /></span>
              DRIFT
            </button>
            <div className="flex items-center gap-5">
              <span className="hidden text-[9px] font-semibold uppercase tracking-[.18em] text-white/34 sm:block">SLS AMG · ONE ICON</span>
              <Link href="/login" className="text-[11px] font-semibold uppercase tracking-[.13em] text-white/58 transition hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">Sign in</Link>
            </div>
          </div>
        </header>

        <div aria-hidden="true" className="absolute left-[calc(50%-1px)] top-[72px] z-[75] h-[3px] w-px bg-white/12">
          <span className="block h-full origin-top bg-[#d7a48d]" style={{ transform: `scaleY(${progressPercent / 100})` }} />
        </div>

        <div className="absolute inset-0" style={{ opacity: sceneOpacity }} aria-hidden={sceneOpacity < 0.02}>
          <div aria-hidden="true" className="absolute left-[8%] top-[48%] z-0 -translate-y-1/2 whitespace-nowrap text-[clamp(9rem,24vw,23rem)] font-black leading-none tracking-[-.095em] text-white/[.045] max-md:left-1 max-md:top-[41%] max-md:text-[38vw]">SLS</div>
          <div aria-hidden="true" className="absolute right-[-10vw] top-[12vh] h-[70vh] w-[60vw] bg-[linear-gradient(115deg,transparent_18%,rgba(232,190,166,.1)_48%,transparent_74%)] blur-3xl" style={{ transform: `translate3d(${pointerX * 16}px,${pointerY * 9}px,0) rotate(-9deg)` }} />

          <div className="absolute left-[max(20px,calc((100vw-1440px)/2))] top-[clamp(8.5rem,18vh,12rem)] z-40 w-[min(42vw,620px)] max-md:left-5 max-md:right-5 max-md:top-[6.8rem] max-md:w-auto" style={{ opacity: introOpacity }}>
            <p className="flex items-center gap-3 text-[9px] font-bold uppercase tracking-[.22em] text-white/47"><span className="h-px w-9 bg-[#d7a48d]" />DRIFT EXPERIENCE · SLS AMG</p>
            <h1 className="mt-5 text-[clamp(4rem,9vw,8.8rem)] font-semibold leading-[.78] tracking-[-.078em] max-md:text-[clamp(3.5rem,17vw,5.5rem)]">An icon <span className="text-white/32">takes flight.</span></h1>
            <p className="mt-6 max-w-md text-sm leading-6 text-white/50">One car. One continuous camera move. Scroll to approach the SLS, lift the gullwing doors and move in for the details.</p>
          </div>

          <figure className="pointer-events-none absolute bottom-[-1vh] left-1/2 z-10 h-[80vh] w-[88vw] -translate-x-1/2 max-md:bottom-[12vh] max-md:h-[56vh] max-md:w-[146vw]" aria-label="Mercedes-Benz SLS AMG cinematic showcase">
            <div aria-hidden="true" className="absolute bottom-[8%] left-[17%] right-[17%] h-[14%] rounded-[50%] bg-black/85 blur-3xl" />

            <Image
              src="/cinematic/sls-closed.jpg"
              alt=""
              fill
              priority
              sizes="(max-width: 767px) 146vw, 88vw"
              className="sls-car object-cover [filter:saturate(.72)_contrast(1.12)_brightness(.68)]"
              style={{
                opacity: 1 - range(doorOpen, 0.15, 0.85),
                objectPosition: detail > 0.25 ? '58% 48%' : '50% 52%',
                transform: `translate3d(${carX}vw,${carY}vh,0) scale(${carScale}) rotate(${carRotation}deg)`,
              }}
              aria-hidden="true"
            />

            <Image
              src="/cinematic/sls-open.jpg"
              alt=""
              fill
              sizes="(max-width: 767px) 146vw, 88vw"
              className="sls-car object-cover [filter:saturate(.74)_contrast(1.12)_brightness(.7)]"
              style={{
                opacity: range(doorOpen, 0.08, 0.9),
                objectPosition: detail > 0.2 ? '59% 44%' : '50% 50%',
                transform: `translate3d(${openX}vw,${openY}vh,0) scale(${openScale}) rotate(${openRotation}deg)`,
                clipPath: reducedMotion ? undefined : `inset(${mix(4, 0, doorOpen)}% ${mix(9, 0, doorOpen)}% ${mix(4, 0, doorOpen)}% ${mix(9, 0, doorOpen)}% round ${mix(22, 0, doorOpen)}px)`,
              }}
              aria-hidden="true"
            />

            <div aria-hidden="true" className="absolute left-[24%] right-[24%] top-[5%] h-[47%] bg-[radial-gradient(ellipse,rgba(229,160,124,.3),transparent_66%)] blur-2xl" style={{ opacity: range(doorOpen, 0.18, 0.72) * (1 - range(detail, 0.55, 0.9)) }} />
            <div aria-hidden="true" className="sls-motion absolute inset-0 bg-[linear-gradient(105deg,transparent_33%,rgba(255,220,197,.14)_49%,transparent_64%)] mix-blend-screen" style={{ transform: `translate3d(${mix(-72, 78, p)}%,0,0)` }} />
          </figure>

          <div className="absolute bottom-[8vh] left-[max(20px,calc((100vw-1440px)/2))] z-50 max-md:bottom-[5vh] max-md:left-5" style={{ opacity: fadeWindow(p, 0.22, 0.32, 0.51, 0.61) }}>
            <p className="text-[9px] font-bold uppercase tracking-[.2em] text-[#d7a48d]">APPROACH</p>
            <p className="mt-2 max-w-sm text-sm leading-6 text-white/48">The camera closes the distance while the SLS stays planted in the frame.</p>
          </div>

          <div className="absolute right-[max(24px,calc((100vw-1440px)/2))] top-[24%] z-50 w-[min(86vw,360px)] text-right max-md:left-5 max-md:right-5 max-md:top-[17%] max-md:w-auto max-md:text-left" style={{ opacity: fadeWindow(p, 0.39, 0.48, 0.62, 0.72) }}>
            <p className="text-[9px] font-bold uppercase tracking-[.2em] text-[#d7a48d]">GULLWING REVEAL</p>
            <h2 className="mt-3 text-[clamp(2.6rem,5vw,5rem)] font-semibold leading-[.9] tracking-[-.06em]">Let the doors <span className="text-white/34">rise.</span></h2>
          </div>

          <div className="absolute bottom-[7vh] right-[max(24px,calc((100vw-1440px)/2))] z-50 w-[min(88vw,460px)] max-md:bottom-[5vh] max-md:left-5 max-md:right-5 max-md:w-auto" style={{ opacity: detailOpacity }}>
            <p className="text-[9px] font-bold uppercase tracking-[.2em] text-[#d7a48d]">CLOSER / AROUND THE CAR</p>
            <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 text-[10px] font-semibold uppercase tracking-[.14em] text-white/58 sm:grid-cols-3">
              <span>6.2L V8</span><span>Gullwing doors</span><span>Rear-wheel drive</span><span>7-speed DCT</span><span>AMG design</span><span>Drift Experience</span>
            </div>
            <p className="mt-4 text-[11px] leading-5 text-white/34">Cinematic showcase only. The SLS is not presented as currently bookable inventory.</p>
          </div>

          <div className="sls-motion absolute bottom-8 left-1/2 z-[80] -translate-x-1/2 text-center" style={{ opacity: (1 - range(p, 0.18, 0.3)) * (1 - handoff) }}>
            <p className="text-[9px] font-semibold uppercase tracking-[.2em] text-white/35">Scroll to open</p>
            <ArrowDown className="mx-auto mt-3 size-4 animate-bounce text-white/42" />
          </div>
        </div>

        <div aria-hidden="true" className="absolute inset-0 z-[60] bg-[linear-gradient(180deg,rgba(245,245,247,0)_0%,rgba(245,245,247,.18)_38%,#f5f5f7_75%)]" style={{ opacity: handoff }} />
        <div className="absolute inset-x-0 bottom-[8vh] z-[80] mx-auto w-[min(100%-40px,1180px)] text-center text-[#17191c] max-md:bottom-[6vh]" style={{ opacity: range(handoff, 0.3, 0.95), transform: reducedMotion ? undefined : `translate3d(0,${mix(30, 0, handoff)}px,0)` }}>
          <p className="text-[9px] font-bold uppercase tracking-[.22em] text-black/42">THE REAL DRIFT FLEET · SOUTH AFRICA</p>
          <h2 className="mt-3 text-[clamp(3rem,6.3vw,6rem)] font-semibold leading-none tracking-[-.07em]">Choose your drive.</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-black/52">The cinematic ends here. Real vehicles, live availability and the working booking flow continue below.</p>
          <Link href="#browse" className="mt-6 inline-flex min-h-12 items-center gap-2 border-b border-black/30 px-1 py-3 text-xs font-bold uppercase tracking-[.13em] transition hover:gap-3 hover:border-black focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black">Browse available cars <ArrowRight className="size-4" /></Link>
        </div>

        <Link href="/cinematic/credits.txt" className="absolute bottom-4 left-5 z-[92] text-[8px] font-medium uppercase tracking-[.14em] text-white/20 transition hover:text-white/55 focus-visible:text-white max-md:hidden" style={{ opacity: sceneOpacity }}>Photography credits</Link>
      </div>
    </section>
  );
}
