'use client';
import { useState, type SubmitEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CarFront } from 'lucide-react';
export function AuthPage({
  mode = 'login',
}: { mode?: 'login' | 'register' } = {}) {
  const returnTo=useSearchParams().get('returnTo') || '';
  const [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const body = Object.fromEntries(new FormData(event.currentTarget));
      const response = await fetch('/api/auth/' + mode, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || 'Please try again.');
      localStorage.removeItem('drift_user');
      localStorage.removeItem('drift_orders');
      const target = new URLSearchParams(location.search).get('returnTo');
      location.href =
        target && /^\/(?!\/)/.test(target) && !target.includes('\\')
          ? target
          : '/';
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Please try again.');
      setBusy(false);
    }
  }
  const field = 'mt-2 w-full rounded-xl border border-black/15 p-3';
  return (
    <main className="min-h-screen bg-[#f5f5f7] px-5 py-16 text-[#1d1d1f]">
      <section className="page-enter mx-auto max-w-lg rounded-[32px] bg-white p-8 shadow-sm sm:p-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-black/55"
        >
          <ArrowLeft className="size-4" />
          Back to vehicles
        </Link>
        <CarFront className="mt-8 size-10 text-[#0071e3]" />
        <h1 className="mt-5 text-3xl font-semibold">
          {mode === 'register'
            ? 'Create your Drift account'
            : 'Sign in to Drift'}
        </h1>
        <form onSubmit={submit} className="mt-7 space-y-4">
          {mode === 'register' && (
            <>
              <label className="block text-sm">
                First name
                <input
                  name="firstName"
                  autoComplete="given-name"
                  required
                  maxLength={80}
                  className={field}
                />
              </label>
              <label className="block text-sm">
                Last name
                <input
                  name="lastName"
                  autoComplete="family-name"
                  required
                  maxLength={80}
                  className={field}
                />
              </label>
              <label className="block text-sm">
                Phone (optional)
                <input
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  maxLength={25}
                  className={field}
                />
              </label>
            </>
          )}
          <label className="block text-sm">
            Email
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              className={field}
            />
          </label>
          <label className="block text-sm">
            Password
            <input
              name="password"
              type="password"
              autoComplete={
                mode === 'register' ? 'new-password' : 'current-password'
              }
              required
              minLength={12}
              maxLength={128}
              className={field}
            />
          </label>
          <p className="text-xs text-black/50">Use 12–128 characters.</p>
          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          )}
          <button
            disabled={busy}
            className="w-full rounded-full bg-[#0071e3] p-3 font-medium text-white disabled:opacity-50"
          >
            {busy
              ? 'Please wait…'
              : mode === 'register'
                ? 'Create account'
                : 'Sign in'}
          </button>
        </form>
        <a
          className="mt-6 block text-sm text-[#0071e3]"
          href={
            (mode === 'register' ? '/login' : '/register') +
            (returnTo ? '?returnTo=' + encodeURIComponent(returnTo) : '')
          }
        >
          {mode === 'register'
            ? 'Already registered? Sign in'
            : 'New here? Create an account'}
        </a>
      </section>
    </main>
  );
}
