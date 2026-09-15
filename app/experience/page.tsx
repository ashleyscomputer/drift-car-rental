import { lazy, Suspense } from 'react';
const CinematicCar = lazy(() => import('@/components/cinematic-car'));
export default function ExperiencePage(){return <Suspense fallback={<main className="grid min-h-screen place-items-center bg-black text-white"><p>Preparing the Drift Concept…</p></main>}><CinematicCar/></Suspense>}
