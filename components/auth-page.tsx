'use client';

import { FormEvent, useState } from 'react';
import { ArrowLeft, ArrowRight, CarFront, Check, Eye, EyeOff, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DEMO_ACCOUNT_KEY, saveDemoUser } from '@/lib/demo-auth';

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const register = mode === 'register';
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const finish = (user: { name: string; email: string; provider: 'email' | 'google' }) => {
    saveDemoUser(user);
    const target = new URLSearchParams(window.location.search).get('returnTo');
    window.location.href = target?.startsWith('/') ? target : '/';
  };
  const submit = (event: FormEvent) => {
    event.preventDefault(); setError('');
    if (register && form.name.trim().length < 2) return setError('Please enter your full name.');
    if (!form.email.includes('@')) return setError('Please enter a valid demo email.');
    if (form.password.length < 6) return setError('Use at least 6 characters for the demo password.');
    if (register && form.password !== form.confirm) return setError('The passwords do not match.');
    if (register) localStorage.setItem(DEMO_ACCOUNT_KEY, JSON.stringify({ name: form.name.trim(), email: form.email.toLowerCase() }));
    const account = JSON.parse(localStorage.getItem(DEMO_ACCOUNT_KEY) || 'null');
    if (!register && account && account.email !== form.email.toLowerCase()) return setError('That demo account was not found. Register first or use Google demo sign-in.');
    finish({ name: register ? form.name.trim() : account?.name || 'Drift Guest', email: form.email.toLowerCase(), provider: 'email' });
  };
  return <main className="page-enter min-h-screen bg-[#f5f5f7] p-4 text-[#1d1d1f] sm:p-8">
    <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl overflow-hidden rounded-[36px] bg-white shadow-[0_30px_100px_rgba(0,0,0,.12)] lg:grid-cols-[1.05fr_.95fr]">
      <section className="relative hidden overflow-hidden bg-black p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="auth-orbit absolute -right-24 top-16 size-96 rounded-full bg-gradient-to-br from-[#2997ff] via-[#6e5cff] to-[#ff5ea8] opacity-80 blur-2xl" />
        <a href="/" className="relative z-10 flex items-center gap-2 text-lg font-semibold"><span className="grid size-9 place-items-center rounded-full bg-white text-black"><CarFront className="size-5" /></span>Drift</a>
        <div className="relative z-10 max-w-md"><p className="text-sm font-medium text-white/60">YOUR DRIVE, READY</p><h1 className="mt-4 text-5xl font-semibold leading-[.98] tracking-[-.055em]">A smoother road starts here.</h1><p className="mt-6 text-lg leading-7 text-white/60">Save your details, reserve your favourite car and complete a beautifully simple demo checkout.</p><div className="mt-10 space-y-3 text-sm text-white/75">{['40 hand-picked vehicles','Transparent South African pricing','Fast, simulated checkout'].map(x => <p key={x} className="flex items-center gap-3"><Check className="size-4 text-[#64d2ff]" />{x}</p>)}</div></div>
      </section>
      <section className="flex items-center p-6 sm:p-12 lg:p-16"><div className="mx-auto w-full max-w-md">
        <a href="/" className="mb-10 inline-flex items-center gap-2 text-sm text-black/50 hover:text-black"><ArrowLeft className="size-4" />Back to vehicles</a>
        <p className="text-sm font-semibold text-[#0071e3]">{register ? 'CREATE ACCOUNT' : 'WELCOME BACK'}</p><h2 className="mt-2 text-4xl font-semibold tracking-[-.045em]">{register ? 'Join Drift.' : 'Sign in to Drift.'}</h2><p className="mt-3 text-sm leading-6 text-black/50">{register ? 'Create a local demo profile to continue.' : 'Continue your booking from this browser.'}</p>
        <div className="mt-7 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-xs leading-5 text-blue-800"><ShieldCheck className="mr-2 inline size-4" /><strong>Demo mode:</strong> use test values only. Nothing is sent to Google and passwords are not stored.</div>
        <Button variant="outline" className="mt-6 h-12 w-full rounded-full text-sm" onClick={() => finish({ name: 'Google Demo User', email: 'demo.google@drift.local', provider: 'google' })}><span className="mr-1 font-bold text-[#4285f4]">G</span> Continue with Google <span className="text-black/35">(demo)</span></Button>
        <div className="my-6 flex items-center gap-4 text-xs text-black/35"><span className="h-px flex-1 bg-black/10" />or use email<span className="h-px flex-1 bg-black/10" /></div>
        <form onSubmit={submit} className="space-y-4">{register && <label className="block text-xs font-medium text-black/55">Full name<Input className="mt-2 h-12 rounded-2xl" autoComplete="name" value={form.name} onChange={e => setForm({...form,name:e.target.value})} placeholder="Nombulelo Mahlangu" /></label>}<label className="block text-xs font-medium text-black/55">Email address<Input className="mt-2 h-12 rounded-2xl" type="email" autoComplete="email" value={form.email} onChange={e => setForm({...form,email:e.target.value})} placeholder="you@example.com" /></label><label className="block text-xs font-medium text-black/55">Demo password<div className="relative mt-2"><Input className="h-12 rounded-2xl pr-12" type={show?'text':'password'} autoComplete={register?'new-password':'current-password'} value={form.password} onChange={e => setForm({...form,password:e.target.value})} placeholder="6+ characters" /><button type="button" onClick={() => setShow(!show)} className="absolute right-4 top-3.5 text-black/35" aria-label="Toggle password visibility">{show?<EyeOff className="size-4"/>:<Eye className="size-4"/>}</button></div></label>{register && <label className="block text-xs font-medium text-black/55">Confirm password<Input className="mt-2 h-12 rounded-2xl" type={show?'text':'password'} value={form.confirm} onChange={e => setForm({...form,confirm:e.target.value})} /></label>}{error && <p className="rounded-xl bg-red-50 p-3 text-xs text-red-700">{error}</p>}<Button type="submit" className="h-12 w-full rounded-full bg-[#0071e3] text-white hover:bg-[#0077ed]">{register?'Create demo account':'Sign in'}<ArrowRight /></Button></form>
        <p className="mt-7 text-center text-sm text-black/45">{register?'Already have an account?':'New to Drift?'} <a className="font-medium text-[#0071e3]" href={register?'/login':'/register'}>{register?'Sign in':'Create account'}</a></p>
      </div></section>
    </div>
  </main>;
}
