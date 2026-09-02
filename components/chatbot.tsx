'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { LoaderCircle, MessageCircle, Send, Sparkles, X } from 'lucide-react';
import type { Vehicle } from '@/lib/store';

type ChatMessage = { role: 'user' | 'assistant'; content: string };

const starters = ['Recommend a budget car', 'How does booking work?', 'What is South Africa’s capital?'];

function appAnswer(question: string, vehicles: Vehicle[]) {
  const text = question.toLowerCase();
  const available = vehicles.filter((vehicle) => vehicle.status === 'Available');
  const cheapest = [...available].sort((a, b) => a.dailyRate - b.dailyRate).slice(0, 3);
  const premium = [...available].sort((a, b) => b.dailyRate - a.dailyRate).slice(0, 3);

  if (/(budget|cheap|afford|economy|lowest)/.test(text)) {
    return `For value, look at ${cheapest.map((car) => `${car.brand} ${car.model} from R${car.dailyRate}/day`).join(', ')}. Use the maximum-rate slider to narrow the catalogue further.`;
  }
  if (/(premium|luxury|special|fast|performance)/.test(text)) {
    return `For a premium drive, consider ${premium.map((car) => `${car.brand} ${car.model} from R${car.dailyRate}/day`).join(', ')}. Open any card to compare its gallery and features.`;
  }
  if (/(book|booking|reserve|rental)/.test(text)) {
    return 'Choose an available vehicle, open its details, select Book now, then set your dates and locations. This assignment is a database-free prototype, so bookings are stored only in memory and no payment is processed.';
  }
  if (/(price|rate|cost|quote)/.test(text)) {
    return 'Rates are market-aligned South African “from” prices per day. Your final real-world quote would depend on dates, branch, rental duration, insurance cover, mileage and availability.';
  }
  if (/(how many|catalog|fleet|vehicle|car)/.test(text)) {
    return `Drift currently has ${vehicles.length} vehicles across value, comfort and premium tiers. You can filter by brand, model, type, year, transmission, features and daily rate.`;
  }
  if (/(login|account|firebase|database)/.test(text)) {
    return 'There is no login, Firebase or permanent database yet. The customer booking flow and admin tools work as a polished in-memory prototype, ready for a database in a later assignment phase.';
  }
  if (/(admin|dashboard|report)/.test(text)) {
    return 'The Admin portal includes fleet management, bookings, customers, payments, reports and a simulated database manager. It is intentionally accessible without login for this prototype.';
  }
  return null;
}

export function Chatbot({ vehicles }: { vehicles: Vehicle[] }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('Hugging Face AI · runs in your browser');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Hi, I’m Drift Guide. I can help you choose a car, explain the prototype, or answer general-knowledge questions.' },
  ]);
  const workerRef = useRef<Worker | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, busy]);
  useEffect(() => () => {
    workerRef.current?.postMessage({ type: 'dispose' });
    workerRef.current?.terminate();
  }, []);

  const ensureWorker = () => {
    if (workerRef.current) return workerRef.current;
    const instance = new Worker(new URL('../workers/hf-chat.worker.ts', import.meta.url), { type: 'module' });
    instance.onmessage = (event: MessageEvent<{ type: string; value: string | number }>) => {
      if (event.data.type === 'status') setStatus(String(event.data.value));
      if (event.data.type === 'progress') setStatus(`Preparing the local model… ${event.data.value}%`);
      if (event.data.type === 'result') {
        setMessages((items) => [...items, { role: 'assistant', content: String(event.data.value) }]);
        setBusy(false);
        setStatus('Hugging Face AI · runs in your browser');
      }
      if (event.data.type === 'error') {
        setMessages((items) => [...items, { role: 'assistant', content: 'The on-device model could not load. App questions still work instantly; for general knowledge, check your connection and try again.' }]);
        setBusy(false);
        setStatus('Local AI unavailable');
      }
    };
    workerRef.current = instance;
    return instance;
  };

  const ask = (raw: string) => {
    const prompt = raw.trim();
    if (!prompt || busy) return;
    const history = messages.map(({ role, content }) => ({ role, content }));
    setMessages((items) => [...items, { role: 'user', content: prompt }]);
    setInput('');
    const local = appAnswer(prompt, vehicles);
    if (local) {
      window.setTimeout(() => setMessages((items) => [...items, { role: 'assistant', content: local }]), 250);
      return;
    }
    setBusy(true);
    ensureWorker().postMessage({ type: 'generate', prompt, history });
  };

  const submit = (event: FormEvent) => { event.preventDefault(); ask(input); };

  return <>
    {open && <section aria-label="Drift Guide chatbot" className="fixed bottom-24 right-4 z-[70] flex h-[min(620px,calc(100vh-130px))] w-[min(390px,calc(100vw-32px))] flex-col overflow-hidden rounded-[30px] border border-white/60 bg-white/95 shadow-[0_30px_100px_rgba(0,0,0,.24)] backdrop-blur-2xl sm:right-7">
      <header className="flex items-center gap-3 border-b border-black/[.06] p-4">
        <span className="grid size-10 place-items-center rounded-2xl bg-gradient-to-br from-[#0071e3] to-[#7b61ff] text-white"><Sparkles className="size-5" /></span>
        <div className="min-w-0 flex-1"><h2 className="font-semibold">Drift Guide</h2><p className="truncate text-[11px] text-black/40">{status}</p></div>
        <button onClick={() => setOpen(false)} className="grid size-9 place-items-center rounded-full bg-black/[.04] text-black/55 hover:bg-black/[.08]" aria-label="Close Drift Guide"><X className="size-4" /></button>
      </header>
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((message, index) => <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[86%] rounded-[20px] px-4 py-3 text-sm leading-5 ${message.role === 'user' ? 'rounded-br-md bg-[#0071e3] text-white' : 'rounded-bl-md bg-[#f2f2f7] text-black/75'}`}>{message.content}</div></div>)}
        {busy && <div className="flex items-center gap-2 text-xs text-black/45"><LoaderCircle className="size-4 animate-spin text-[#0071e3]" />{status}</div>}
        <div ref={endRef} />
      </div>
      {messages.length < 3 && <div className="flex gap-2 overflow-x-auto px-4 pb-3">{starters.map((starter) => <button key={starter} onClick={() => ask(starter)} className="shrink-0 rounded-full border border-black/[.08] bg-white px-3 py-2 text-xs text-black/60 hover:bg-black/[.03]">{starter}</button>)}</div>}
      <form onSubmit={submit} className="flex gap-2 border-t border-black/[.06] p-3"><input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask about Drift or anything else…" className="min-w-0 flex-1 rounded-full bg-[#f2f2f7] px-4 text-sm outline-none ring-[#0071e3] focus:ring-2" /><button disabled={!input.trim() || busy} className="grid size-11 place-items-center rounded-full bg-[#0071e3] text-white transition hover:bg-[#0077ed] disabled:opacity-40" aria-label="Send message"><Send className="size-4" /></button></form>
    </section>}
    <button onClick={() => setOpen((value) => !value)} className="fixed bottom-6 right-4 z-[69] grid size-14 place-items-center rounded-full bg-black text-white shadow-[0_14px_40px_rgba(0,0,0,.3)] transition hover:scale-105 sm:right-7" aria-label={open ? 'Close Drift Guide' : 'Open Drift Guide'}>{open ? <X className="size-5" /> : <MessageCircle className="size-6" />}</button>
  </>;
}
