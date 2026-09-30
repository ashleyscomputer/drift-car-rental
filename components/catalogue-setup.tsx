'use client';
import { useState, type SubmitEvent } from 'react';
export function CatalogueSetup({ onSaved }: { onSaved: () => Promise<void> }) {
  const [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false);
  async function save(event: SubmitEvent<HTMLFormElement>, kind: string) {
    event.preventDefault();
    const form = event.currentTarget;
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch('/api/catalogue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...Object.fromEntries(new FormData(form)),
          kind,
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || 'Unable to save.');
      form.reset();
      await onSaved();
      setMessage('Saved to MySQL.');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Unable to save.');
    } finally {
      setBusy(false);
    }
  }
  const field = (name: string, label: string, type = 'text') => (
    <label key={name} className="block text-sm">
      {label}
      <input
        name={name}
        type={type}
        required
        min={type === 'number' ? 0 : undefined}
        step={type === 'number' ? '0.01' : undefined}
        className="mt-1 w-full rounded-xl border border-black/15 p-3"
      />
    </label>
  );
  return (
    <section className="mt-6">
      <div className="grid gap-5 md:grid-cols-2">
        <form
          onSubmit={(e) => save(e, 'branch')}
          className="space-y-4 rounded-3xl bg-white p-6"
        >
          <h2 className="text-xl font-semibold">Add a branch</h2>
          {field('name', 'Branch name')}
          {field('province', 'Province')}
          {field('city', 'City')}
          {field('address', 'Street address')}
          <button
            disabled={busy}
            className="rounded-full bg-black px-5 py-3 text-white"
          >
            Save branch
          </button>
        </form>
        <form
          onSubmit={(e) => save(e, 'extra')}
          className="space-y-4 rounded-3xl bg-white p-6"
        >
          <h2 className="text-xl font-semibold">Add an optional extra</h2>
          {field('code', 'Unique code')}
          {field('name', 'Name')}
          {field('price', 'Price (ZAR)', 'number')}
          <label className="block text-sm">
            Pricing
            <select
              name="pricing"
              className="mt-1 w-full rounded-xl border border-black/15 p-3"
            >
              <option value="daily">Per rental day</option>
              <option value="once">Once per booking</option>
            </select>
          </label>
          <button
            disabled={busy}
            className="rounded-full bg-black px-5 py-3 text-white"
          >
            Save extra
          </button>
        </form>
      </div>
      {message && <output className="mt-4 block">{message}</output>}
    </section>
  );
}
