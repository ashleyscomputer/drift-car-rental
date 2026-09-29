import { ArrowLeft, CarFront } from 'lucide-react';

const files = [
  "Volkswagen Polo VI (2023) (53990800384).jpg",
  "2022 Ford Fiesta.jpg",
  "Opel Corsa (2024) (53955026390).jpg",
  "Peugeot 208 (2024) (53983365987).jpg",
  "2023 Mazda2 (DJ) 1X7A1555.jpg",
  "Honda Fit (GR, gasoline) parked in Carpark building @ Marine Parade - Singapore (front view).jpg",
  "Mini Cooper S Favoured Trim (F66) – f 21092025.jpg",
  "Toyota Corolla (E210) sedan IMG 4190.jpg",
  "Honda Civic Sedan (FE1-4) Washington DC Metro Area, USA (1).jpg",
  "MAZDA3 SEDAN (BP) China (4).jpg",
  "Audi A3 Sedan 35 TFSI 8Y Glacier White Metallic (1).jpg",
  "BMW 5-Series (G60) 530i xDrive (2024) (53799155730).jpg",
  "MERCEDES-BENZ E CLASS (W214) China.jpg",
  "Lexus ES 300h AXZH10 2024.jpg",
  "2022 Kia Sonet.jpg",
  "Hyundai Creta 1.5 GLS 2023.jpg",
  "Chery Tiggo7 Pro GLS 2024.jpg",
  "Subaru Forester (SL) e-BOXER Auto Zuerich 2024 DSC 6353.jpg",
  "2024 Jeep Wrangler four-door Sahara in Silver Zynith, front right, 2026-06-06.jpg",
  "Volvo XC40 2023.jpg",
  "Porsche Cayenne Coupé (2024) (54734021839).jpg",
  "Range Rover Evoque (L551) 1X7A1765.jpg",
  "2023 Mitsubishi Triton AXCR.jpg",
  "Nissan Navara Pro-4X 2023 (53087252280).jpg",
  "Volkswagen Amarok Mk2 153008.jpg",
  "Great Wall Pao IMG006.jpg",
  "Toyota Hiace (52714991805).jpg",
  "VW T6.1.jpg",
  "Ford Tourneo Custom (2023) IMG 9655.jpg",
  "Hyundai Staria Premium 2025.jpg"
];
const source = (file:string) => `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file).replace(/%20/g,'_')}`;

export default function PhotoCreditsPage(){
  return <main className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]"><header className="border-b border-black/[.06] bg-white/85"><div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5"><a href="/" className="flex items-center gap-2 font-semibold"><span className="grid size-8 place-items-center rounded-full bg-black text-white"><CarFront className="size-4"/></span>Drift</a><a href="/" className="flex items-center gap-2 text-sm text-black/50"><ArrowLeft className="size-4"/>Home</a></div></header><div className="mx-auto max-w-5xl px-5 py-12"><p className="text-sm font-semibold tracking-[.12em] text-[#0071e3]">PHOTO CREDITS</p><h1 className="mt-3 text-4xl font-semibold tracking-[-.05em]">Vehicle photography sources.</h1><p className="mt-4 max-w-3xl text-sm leading-7 text-black/55">Vehicles 41–70 use model-specific photography from Wikimedia Commons. Each source page below contains the photographer attribution and the applicable reuse licence. The first 40 vehicles retain the existing project assets documented in the repository.</p><div className="mt-8 grid gap-3 sm:grid-cols-2">{files.map((file,index)=><a key={file} href={source(file)} target="_blank" rel="noreferrer" className="rounded-2xl bg-white p-4 text-sm shadow-sm transition hover:-translate-y-0.5"><span className="text-xs text-black/35">Vehicle {index+41}</span><p className="mt-1 font-medium">{file}</p><p className="mt-2 text-xs text-[#0071e3]">Open Wikimedia source ↗</p></a>)}</div></div></main>;
}