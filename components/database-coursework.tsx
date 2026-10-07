'use client';
import { useState } from 'react';
import Image from 'next/image';
import stages from '@/lib/normalization.json';

export function DatabaseCoursework({
  onExplore,
}: {
  onExplore: (table: string) => void;
}) {
  const [stage, setStage] = useState(0);
  const current = stages[stage];
  const [view, setView] = useState<'erd' | 'normalization'>('erd');
  const [diagram, setDiagram] = useState('fleet');
  const diagrams = [
    { id: 'fleet', name: 'Fleet and locations' },
    { id: 'bookings', name: 'Bookings and payments' },
    { id: 'accounts', name: 'Accounts' },
    { id: 'history', name: 'History and reviews' },
  ];
  return (
    <section
      className="my-6 rounded-2xl border border-black/10 bg-white p-5 sm:p-7"
      aria-labelledby="coursework-title"
    >
      <h2 id="coursework-title" className="text-xl font-semibold">
        Database design
      </h2>
      <div className="mt-4 flex gap-2">
        {(['erd', 'normalization'] as const).map((v) => (
          <button
            type="button"
            key={v}
            aria-pressed={view === v}
            onClick={() => setView(v)}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${view === v ? 'bg-black text-white' : 'bg-black/5'}`}
          >
            {v === 'erd' ? 'ERD' : 'Normalization'}
          </button>
        ))}
      </div>
      {view === 'erd' ? (
        <div>
          <div className="mt-4 flex flex-wrap gap-2">
            {diagrams.map((d) => (
              <button
                type="button"
                key={d.id}
                aria-pressed={diagram === d.id}
                onClick={() => setDiagram(d.id)}
                className={`rounded-lg border px-3 py-2 text-xs ${diagram === d.id ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-black/10'}`}
              >
                {d.name}
              </button>
            ))}
          </div>
          <p className="mt-4 text-xs text-black/55">
            Crow’s foot = many · circle = optional · bar = one · PK = primary
            key · FK = foreign key · ? = nullable
          </p>
          <a
            href={`/database-design/${diagram}.png`}
            target="_blank"
            rel="noreferrer"
            className="mt-4 block"
            aria-label="Open ERD at full size"
          >
            <Image
              width={1600}
              height={1600}
              unoptimized
              style={{ width: 'auto', height: 'auto' }}
              src={`/database-design/${diagram}.png`}
              alt={`${diagrams.find((d) => d.id === diagram)?.name} entity relationship diagram with primary keys, foreign keys and cardinalities`}
              className="mx-auto max-h-[620px] max-w-full object-contain"
            />
          </a>
          <p className="mt-3 text-xs text-black/50">
            21 core tables · 24 foreign keys · select the diagram to enlarge.
            Live table relationships appear in the inspector below.
          </p>
        </div>
      ) : (
        <>
          <div
            className="mt-4 grid grid-cols-4 gap-2"
            aria-label="Normalization stages"
          >
            {stages.map((s, i) => (
              <button
                type="button"
                key={s.name}
                aria-pressed={stage === i}
                onClick={() => setStage(i)}
                className={`rounded-lg border px-3 py-2 text-sm font-medium ${stage === i ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-black/10'}`}
              >
                {s.name}
              </button>
            ))}
          </div>
          <h3 className="mt-5 font-semibold">{current.title}</h3>
          <p className="mt-1 text-sm text-black/60">{current.rule}</p>
          <p className="mt-4 text-xs text-black/50">
            Underlined = primary key · * = foreign key · braces = repeating
            group
          </p>
          <div className="mt-3 space-y-2">
            {current.relations.map((r) => (
              <p
                key={r.name}
                className="rounded-lg bg-[#f5f5f7] p-3 font-mono text-xs leading-6 break-words"
              >
                <strong>{r.name}</strong> (
                {[...r.key, ...r.fields].map((field, i) => (
                  <span key={field}>
                    {i > 0 && ', '}
                    <span
                      className={
                        r.key.includes(field)
                          ? 'underline underline-offset-4'
                          : ''
                      }
                    >
                      {field}
                    </span>
                    {'foreign' in r && r.foreign?.includes(field) ? '*' : ''}
                  </span>
                ))}
                )
              </p>
            ))}
          </div>
          <p className="mt-4 text-sm leading-6">{current.dependencies}</p>
          <details className="mt-3 text-sm text-black/60">
            <summary className="cursor-pointer">
              Explanation and implementation
            </summary>
            <p className="mt-2 leading-6">{current.note}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {current.tables.map((t) => (
                <button
                  type="button"
                  className="rounded-lg border border-black/10 px-3 py-2 text-xs text-blue-700"
                  key={t}
                  onClick={() => onExplore(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </details>
        </>
      )}
    </section>
  );
}
