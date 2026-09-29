import { ArrowLeft, CarFront } from 'lucide-react';

export type InfoSection = { title: string; paragraphs: string[] };

export function InfoPage({ eyebrow, title, intro, sections, contact }: { eyebrow:string; title:string; intro:string; sections:InfoSection[]; contact?:boolean }) {
  return <main className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
    <header className="border-b border-black/[.06] bg-white/85 backdrop-blur-2xl"><div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5"><a href="/" className="flex items-center gap-2 font-semibold"><span className="grid size-8 place-items-center rounded-full bg-black text-white"><CarFront className="size-4"/></span>Drift</a><a href="/" className="flex items-center gap-2 text-sm text-black/50"><ArrowLeft className="size-4"/>Home</a></div></header>
    <div className="mx-auto max-w-5xl px-5 py-12 sm:py-16">
      <section className="max-w-3xl"><p className="text-sm font-semibold tracking-[.12em] text-[#0071e3]">{eyebrow}</p><h1 className="mt-3 text-4xl font-semibold tracking-[-.05em] sm:text-5xl">{title}</h1><p className="mt-5 text-base leading-7 text-black/55">{intro}</p></section>
      <section className="mt-10 space-y-4">{sections.map((section)=><article key={section.title} className="rounded-[28px] bg-white p-6 shadow-sm sm:p-8"><h2 className="text-xl font-semibold">{section.title}</h2>{section.paragraphs.map((paragraph)=><p key={paragraph} className="mt-3 text-sm leading-7 text-black/55">{paragraph}</p>)}</article>)}</section>
      {contact && <section className="mt-6 rounded-[28px] bg-black p-7 text-white sm:p-8"><p className="text-sm text-white/45">EMAIL</p><a href="mailto:ashley@kickstreet.store" className="mt-2 block text-2xl font-semibold">ashley@kickstreet.store</a><p className="mt-3 text-sm text-white/50">For booking questions, cancellation requests or general support.</p></section>}
    </div>
  </main>;
}