'use client';

import { FormEvent, useState } from 'react';
import { ArrowLeft, ArrowRight, CarFront, Check, Eye, EyeOff, LockKeyhole } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { saveAuthUser, type AuthUser } from '@/lib/auth';

export function AuthPage() {
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const result = await response.json() as { user?: AuthUser; error?: string };
      if (!response.ok || !result.user) throw new Error(result.error || 'Unable to sign in.');
      saveAuthUser(result.user);
      const target = new URLSearchParams(window.location.search).get('returnTo');
      window.location.href = target?.startsWith('/') ? target : '/';
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to sign in.');
      setLoading(false);
    }
  };

  return <main className="page-enter min-h-screen bg-[#f5f5f7] p-4 text-[#1d1d1f] sm:p-8">
    <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl overflow-hidden rounded-[36px] bg-white shadow-[0_30px_100px_rgba(0,0,0,.12)] lg:grid-cols-[1.05fr_.95fr]">
      <section className="relative hidden overflow-hidden bg-black p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="auth-orbit absolute -right-24 top-16 size-96 rounded-full bg-gradient-to-br from-[#2997ff] via-[#6e5cff] to-[#ff5ea8] opacity-80 blur-2xl" />
        <a href="/" className="relative z-10 flex items-center gap-2 text-lg font-semibold"><span className="grid size-9 place-items-center rounded-full bg-white text-black"><CarFront className="size-5" /></span>Drift</a>
        <div className="relative z-10 max-w-md"><p className="text-sm font-medium text-white/60">YOUR DRIVE, READY</p><h1 className="mt-4 text-5xl font-semibold leading-[.98] tracking-[-.055em]">A smoother road starts here.</h1><p className="mt-6 text-lg leading-7 text-white/60">Sign in to continue bookings, manage your account and access the right workspace for your role.</p><div className="mt-10 space-y-3 text-sm text-white/75">{['Full vehicle catalogue','Transparent South African pricing','Role-based account access'].map((item) => <p key={item} className="flex items-center gap-3"><Check className="size-4 text-[#64d2ff]" />{item}</p>)}</div></div>
      </section>
      <section className="flex items-center p-6 sm:p-12 lg:p-16"><div className="mx-auto w-full max-w-md">
        <a href="/" className="mb-10 inline-flex items-center gap-2 text-sm text-black/50 hover:text-black"><ArrowLeft className="size-4" />Back to vehicles</a>
        <p className="text-sm font-semibold text-[#0071e3]">WELCOME BACK</p><h2 className="mt-2 text-4xl font-semibold tracking-[-.045em]">Sign in to Drift.</h2><p className="mt-3 text-sm leading-6 text-black/50">Use your account credentials to continue.</p>
        <div className="mt-7 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-xs leading-5 text-blue-800"><LockKeyhole className="mr-2 inline size-4" />Credentials are checked by the server. Your password is not stored in browser storage.</div>
        <form onSubmit={submit} className="mt-7 space-y-4">
          <label className="block text-xs font-medium text-black/55">Email address<Input required className="mt-2 h-12 rounded-2xl" type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@example.com" /></label>
          <label className="block text-xs font-medium text-black/55">Password<div className="relative mt-2"><Input required className="h-12 rounded-2xl pr-12" type={show ? 'text' : 'password'} autoComplete="current-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="Enter your password" /><button type="button" onClick={() => setShow(!show)} className="absolute right-4 top-3.5 text-black/35" aria-label="Toggle password visibility">{show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button></div></label>
          {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-xs text-red-700">{error}</p>}
          <Button type="submit" disabled={loading} className="h-12 w-full rounded-full bg-[#0071e3] text-white hover:bg-[#0077ed]">{loading ? 'Signing in…' : <>Sign in <ArrowRight /></>}</Button>
        </form>
      </div></section>
    </div>
  </main>;
}