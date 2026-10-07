'use client';
import { useEffect, useState } from 'react';
import {
  Database,
  ArrowUpRight,
  ArrowRight,
  Search,
  RefreshCw,
  Download,
  KeyRound,
  Link2,
  Table2,
  ShieldCheck,
  Code2,
  Plus,
  ChevronRight,
  Check,
  GitBranch,
  Rows3,
  X,
  LockKeyhole,
} from 'lucide-react';
import { DatabaseCoursework } from './database-coursework';
import { TableWorkspace } from './table-workspace';
import { saveFile } from '@/lib/download';
import { CatalogueSetup } from './catalogue-setup';
import type { DatabaseSchema, SchemaTable } from '@/lib/database-schema';

const groups = [
  {
    name: 'Fleet & locations',
    color: '#24bda7',
    tables: [
      'province',
      'city',
      'branch',
      'vehiclecategory',
      'vehiclemodel',
      'vehicle',
      'vehicleimage',
      'feature',
      'vehiclefeature',
    ],
  },
  {
    name: 'Accounts & access',
    color: '#9a89f5',
    tables: ['customer', 'appuser', 'usersession', 'passwordresettoken'],
  },
  {
    name: 'Bookings & payments',
    color: '#efaa57',
    tables: [
      'booking',
      'rentalextra',
      'bookingextra',
      'payment',
      'cancellationrequest',
      'bookingstatushistory',
      'bookingemail',
      'vehiclereview',
    ],
  },
];
const group = (name: string) =>
  groups.find((g) => g.tables.includes(name.toLowerCase())) || {
    name: 'Other',
    color: '#8dabc6',
  };
const descriptions: Record<string, string> = {
  vehicle:
    'The fleet master record. Models and branches are referenced once; photographs and features live in related tables.',
  booking:
    'The reservation hub. Connects a customer and vehicle to rental dates, branches, extras, payments and an auditable status history.',
  customer:
    'Customer profile information, linked to account access and reservations without repeating profile fields in every table.',
  appuser:
    'Account identity and role. Password hashes are stored here; session tokens are stored as hashes in a separate table.',
  payment:
    'Payment events are separate from reservations. Automatically approved payments do not represent collected revenue.',
  vehiclefeature:
    'A junction table resolves the many-to-many relationship between vehicles and features.',
  bookingextra:
    'Stores selected extras and their price snapshots so historical booking totals remain stable when catalogue prices change.',
  usersession:
    'Expiring, revocable sessions. The database stores token hashes rather than raw browser session tokens.',
  cancellationrequest:
    'Records a customer request and its administrator decision. A request alone does not release the reserved vehicle.',
  vehiclereview:
    'A review references a booking, with a unique booking key and a constrained rating.',
  vehicleimage:
    'A separate image collection supports multiple photographs per vehicle, ordering and source credits.',
};
async function readSchema(signal?: AbortSignal) {
  const response = await fetch('/api/database/schema', {
    cache: 'no-store',
    signal,
  });
  const data = (await response.json()) as DatabaseSchema & { error?: string };
  if (!response.ok)
    throw new Error(data.error || 'Database metadata could not load.');
  return data;
}
export function DatabaseStudio({ onSaved }: { onSaved: () => Promise<void> }) {
  const [schema, setSchema] = useState<DatabaseSchema | null>(null),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(true);
  const [selected, setSelected] = useState('booking'),
    [search, setSearch] = useState(''),
    [tab, setTab] = useState<'columns' | 'relations' | 'indexes' | 'sql'>(
      'columns',
    );
  const [add, setAdd] = useState(false),
    [notice, setNotice] = useState('');
  async function refresh() {
    setBusy(true);
    setError('');
    try {
      const data = await readSchema();
      setSchema(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Database unavailable.');
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    const controller = new AbortController();
    readSchema(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setSchema(data);
      })
      .catch((e) => {
        if (!controller.signal.aborted)
          setError(e instanceof Error ? e.message : 'Database unavailable.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setBusy(false);
      });
    return () => controller.abort();
  }, []);
  const table =
    schema?.tables.find(
      (t) => t.name.toLowerCase() === selected.toLowerCase(),
    ) || schema?.tables[0];
  const total = schema?.tables.reduce((n, t) => n + t.rows, 0) || 0;
  const columns = schema?.tables.reduce((n, t) => n + t.columns.length, 0) || 0;
  const checks = schema?.tables.reduce((n, t) => n + t.checks.length, 0) || 0;
  const unique =
    schema?.tables.reduce(
      (n, t) =>
        n + new Set(t.indexes.filter((i) => i.unique).map((i) => i.name)).size,
      0,
    ) || 0;
  const related =
    schema?.relations.filter(
      (r) => r.table === table?.name || r.targetTable === table?.name,
    ) || [];
  function select(name: string) {
    setSelected(name);
    setTab('columns');
  }
  function exportSql() {
    if (!schema) return;
    saveFile(
      'Drift-schema.sql',
      '-- Drift: live structure export; no account or booking records.\n-- Captured ' +
        schema.capturedAt +
        '\n-- Import into an EMPTY database.\nSET FOREIGN_KEY_CHECKS=0;\n\n' +
        schema.tables.map((t) => t.ddl + ';').join('\n\n') +
        '\n\nSET FOREIGN_KEY_CHECKS=1;\n',
      'application/sql',
    );
    setNotice('Structure exported. No personal records included.');
  }
  return (
    <div className="db-studio">
      <div className="db-heading">
        <div>
          <div className="db-eyebrow">
            <span /> DRIFT / DATA SYSTEMS
          </div>
          <h1>
            Database studio<span>.</span>
          </h1>
          <p>Explore the structure behind every drive.</p>
        </div>
        <div className="db-actions">
          <button onClick={() => void refresh()} disabled={busy}>
            <RefreshCw size={15} className={busy ? 'animate-spin' : ''} />
            {busy ? 'Refreshing' : 'Refresh'}
          </button>
          <button
            className="db-dark-button"
            onClick={exportSql}
            disabled={!schema}
          >
            <Download size={15} />
            Export schema
          </button>
        </div>
      </div>
      {error && (
        <div role="alert" className="db-error">
          {error} <button onClick={() => void refresh()}>Try again</button>
        </div>
      )}
      {notice && (
        <div className="db-notice">
          <Check size={16} />
          <span>{notice}</span>
          <button
            aria-label="Dismiss export message"
            onClick={() => setNotice('')}
          >
            <X size={15} />
          </button>
        </div>
      )}
      {!schema ? (
        <div className="db-loading">
          <Database size={30} />
          <p>
            {busy
              ? 'Reading your MySQL schema…'
              : 'Database details are unavailable.'}
          </p>
        </div>
      ) : (
        <>
          <section className="db-hero">
            <div className="db-hero-copy">
              <div className="db-live">
                <span />
                LIVE SCHEMA <span className="db-live-divider" /> MySQL{' '}
                {schema.version.split('-')[0]}
              </div>
              <h2>Database</h2>

              <div className="db-database-name">
                <Database size={16} />
                <code>{schema.database}</code>
                <span>
                  {new Set(schema.tables.map((t) => t.engine)).size === 1
                    ? schema.tables[0]?.engine
                    : 'Mixed engines'}
                </span>
              </div>
            </div>
            <div className="db-summary-mark" aria-hidden="true">
              <Database size={38} strokeWidth={1.2} />
            </div>
            <div className="db-hero-bottom">
              <span>
                <span className="db-pulse" /> Connected snapshot
              </span>
              <span>
                Captured{' '}
                {new Date(schema.capturedAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}{' '}
                · refresh to update
              </span>
            </div>
          </section>
          <div className="db-metrics">
            {[
              {
                label: 'RELATIONAL TABLES',
                value: schema.tables.length,
                note: columns + ' defined columns',
                icon: Table2,
                color: '#159783',
              },
              {
                label: 'STORED RECORDS',
                value: total.toLocaleString(),
                note: 'Exact counts · all tables',
                icon: Rows3,
                color: '#6b63c6',
              },
              {
                label: 'FOREIGN KEYS',
                value: schema.relations.length,
                note: 'Database-enforced relationships',
                icon: GitBranch,
                color: '#bc823c',
              },
              {
                label: 'CHECK CONSTRAINTS',
                value: checks,
                note: unique + ' primary / unique indexes',
                icon: ShieldCheck,
                color: '#527cb8',
              },
            ].map(({ label, value, note, icon: Icon, color }) => (
              <div key={label} className="db-metric">
                <div>
                  <span>{label}</span>
                  <Icon size={17} style={{ color }} />
                </div>
                <strong>{value}</strong>
                <p>{note}</p>
              </div>
            ))}
          </div>
          <DatabaseCoursework
            onExplore={(name) => {
              const match = schema.tables.find(
                (t) => t.name.toLowerCase() === name,
              );
              if (match) {
                select(match.name);
                document
                  .getElementById('database-schema-explorer')
                  ?.scrollIntoView({ block: 'start' });
              }
            }}
          />
          <section
            id="database-schema-explorer"
            style={{ scrollMarginTop: 90 }}
            className="db-workspace"
          >
            <aside className="db-table-sidebar">
              <div className="db-sidebar-title">
                <span>SCHEMA EXPLORER</span>
                <span>{schema.tables.length}</span>
              </div>
              <label className="db-search">
                <Search size={15} />
                <input
                  aria-label="Search database tables"
                  placeholder="Find a table…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button
                    aria-label="Clear table search"
                    onClick={() => setSearch('')}
                  >
                    <X size={13} />
                  </button>
                )}
              </label>
              <div className="db-table-list">
                {[
                  ...groups,
                  { name: 'Other', color: '#8dabc6', tables: [] },
                ].map((g) => (
                  <div className="db-table-group" key={g.name}>
                    <p>
                      <span style={{ background: g.color }} />
                      {g.name}
                    </p>
                    {schema.tables
                      .filter(
                        (t) =>
                          group(t.name).name === g.name &&
                          t.name.toLowerCase().includes(search.toLowerCase()),
                      )
                      .map((t) => (
                        <button
                          key={t.name}
                          onClick={() => select(t.name)}
                          aria-pressed={table?.name === t.name}
                          className={
                            table?.name === t.name ? 'is-selected' : ''
                          }
                        >
                          <Table2 size={14} />
                          <span>{t.name}</span>
                          <small>{t.rows.toLocaleString()}</small>
                          {table?.name === t.name && <ChevronRight size={13} />}
                        </button>
                      ))}
                  </div>
                ))}
                {!schema.tables.some((t) =>
                  t.name.toLowerCase().includes(search.toLowerCase()),
                ) && <p className="db-no-results">No matching tables.</p>}
              </div>
              <div className="db-sidebar-footer">
                <LockKeyhole size={14} />
                <span>Metadata view · admin access</span>
              </div>
            </aside>
            {table && (
              <div className="db-inspector">
                <div className="db-inspector-heading">
                  <div>
                    <span className="db-section-kicker">TABLE</span>
                    <h2>
                      <span style={{ background: group(table.name).color }} />
                      {table.name}
                    </h2>
                  </div>
                  <span className="db-pill">{table.rows} records</span>
                </div>
                <p className="db-table-description">
                  {descriptions[table.name.toLowerCase()] ||
                    'A dedicated entity in the rental schema. Explore its columns, keys and relationships below.'}
                </p>
                <RelationMap table={table} schema={schema} onSelect={select} />
                <div
                  className="db-tabs"
                  role="tablist"
                  aria-label="Table detail views"
                >
                  {(
                    [
                      {
                        id: 'columns',
                        label: 'Columns',
                        icon: Table2,
                        count: table.columns.length,
                      },
                      {
                        id: 'relations',
                        label: 'Relationships',
                        icon: Link2,
                        count: related.length,
                      },
                      {
                        id: 'indexes',
                        label: 'Integrity',
                        icon: ShieldCheck,
                        count:
                          table.checks.length +
                          new Set(table.indexes.map((i) => i.name)).size,
                      },
                      { id: 'sql', label: 'SQL definition', icon: Code2 },
                    ] as const
                  ).map(({ id, label, icon: Icon, ...rest }) => (
                    <button
                      key={id}
                      role="tab"
                      aria-selected={tab === id}
                      onClick={() => setTab(id)}
                      className={tab === id ? 'active' : ''}
                    >
                      <Icon size={14} />
                      {label}
                      {'count' in rest && <span>{rest.count}</span>}
                    </button>
                  ))}
                </div>
                <div
                  className="db-tab-content"
                  role="tabpanel"
                  aria-label={tab}
                >
                  {tab === 'columns' && (
                    <div className="db-overflow">
                      <table className="db-columns">
                        <thead>
                          <tr>
                            <th>Column</th>
                            <th>Data type</th>
                            <th>Rules</th>
                            <th>Default</th>
                          </tr>
                        </thead>
                        <tbody>
                          {table.columns.map((c) => {
                            const fk = schema.relations.some(
                              (r) =>
                                r.table === table.name && r.column === c.name,
                            );
                            return (
                              <tr key={c.name}>
                                <td aria-label={c.name}>
                                  <div>
                                    <span
                                      className={
                                        'db-column-icon ' +
                                        (c.key === 'PRI' ? 'is-key' : '')
                                      }
                                    >
                                      {c.key === 'PRI' ? (
                                        <KeyRound size={13} />
                                      ) : fk ? (
                                        <Link2 size={13} />
                                      ) : (
                                        <span>·</span>
                                      )}
                                    </span>
                                    <code>{c.name}</code>
                                  </div>
                                </td>
                                <td>
                                  <code className="db-type">{c.type}</code>
                                </td>
                                <td>
                                  <div className="db-rule-list">
                                    {c.key === 'PRI' && (
                                      <span className="db-tag db-tag-amber">
                                        PK
                                      </span>
                                    )}
                                    {fk && (
                                      <span className="db-tag db-tag-teal">
                                        FK
                                      </span>
                                    )}
                                    {c.key === 'UNI' && (
                                      <span className="db-tag db-tag-purple">
                                        UNIQUE
                                      </span>
                                    )}
                                    <span className="db-tag">
                                      {c.nullable === 'YES'
                                        ? 'NULLABLE'
                                        : 'NOT NULL'}
                                    </span>
                                    {/(?:STORED|VIRTUAL) GENERATED/.test(
                                      c.extra,
                                    ) && (
                                      <span className="db-tag db-tag-purple">
                                        GENERATED
                                      </span>
                                    )}
                                    {c.extra.includes('auto_increment') && (
                                      <span className="db-tag">AUTO</span>
                                    )}
                                  </div>
                                </td>
                                <td>
                                  <code className="db-default">
                                    {c.defaultValue ?? '—'}
                                  </code>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {tab === 'relations' && (
                    <div className="db-relations">
                      {related.length ? (
                        related.map((r) => (
                          <div
                            className="db-relation-row"
                            key={r.table + r.name + r.column}
                          >
                            <Link2 size={17} />
                            <div>
                              <button onClick={() => select(r.table)}>
                                {r.table}
                                <span>.{r.column}</span>
                              </button>
                              <ArrowRight size={14} />
                              <button onClick={() => select(r.targetTable)}>
                                {r.targetTable}
                                <span>.{r.targetColumn}</span>
                              </button>
                              <p>
                                Foreign key → referenced key · ON DELETE{' '}
                                {r.deleteRule} · ON UPDATE {r.updateRule}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p>No foreign-key relationships for this table.</p>
                      )}
                    </div>
                  )}
                  {tab === 'indexes' && (
                    <div className="db-integrity">
                      <p className="db-subtitle">INDEXES & UNIQUENESS</p>
                      {[...new Set(table.indexes.map((i) => i.name))].map(
                        (name) => {
                          const items = table.indexes.filter(
                            (i) => i.name === name,
                          );
                          return (
                            <div className="db-index" key={name}>
                              <KeyRound size={15} />
                              <div>
                                <strong>{name}</strong>
                                <code>
                                  {items.map((i) => i.column).join(' + ')}
                                </code>
                              </div>
                              <span className="db-tag">
                                {items[0].unique ? 'UNIQUE' : 'INDEX'}
                              </span>
                            </div>
                          );
                        },
                      )}
                      <p className="db-subtitle db-check-title">
                        CHECK CONSTRAINTS
                      </p>
                      {table.checks.length ? (
                        table.checks.map((c) => (
                          <div className="db-check" key={c.name}>
                            <ShieldCheck size={16} />
                            <div>
                              <strong>{c.name}</strong>
                              <code>{c.clause}</code>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="db-muted">
                          No CHECK constraints defined for this table.
                        </p>
                      )}
                    </div>
                  )}
                  {tab === 'sql' && (
                    <div className="db-sql">
                      <div>
                        <span>
                          <span /> MYSQL · LIVE DEFINITION
                        </span>
                        <button
                          onClick={() =>
                            saveFile(
                              table.name + '.sql',
                              table.ddl + ';\n',
                              'application/sql',
                            )
                          }
                        >
                          <Download size={14} /> Download
                        </button>
                      </div>
                      <pre>
                        <code>{table.ddl};</code>
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
          <section className="db-entry-panel">
            <div>
              <span className="db-entry-icon">
                <Plus size={21} />
              </span>
              <div>
                <h3>Catalogue</h3>
                <p>Add a branch or rental extra directly to MySQL.</p>
              </div>
            </div>
            <button onClick={() => setAdd(!add)} aria-expanded={add}>
              {add ? 'Close forms' : 'Add records'}
              {add ? <X size={15} /> : <ArrowUpRight size={16} />}
            </button>
          </section>
          {add && (
            <CatalogueSetup
              onSaved={async () => {
                await refresh();
                await onSaved();
              }}
            />
          )}
          <TableWorkspace
            onChanged={async () => {
              await refresh();
              await onSaved();
            }}
          />
          <footer className="db-footer">
            <span>
              <Database size={13} />
              DRIFT DATABASE STUDIO
            </span>
            <span>MySQL information_schema · read-only metadata</span>
          </footer>
        </>
      )}
    </div>
  );
}

function RelationMap({
  table,
  schema,
  onSelect,
}: {
  table: SchemaTable;
  schema: DatabaseSchema;
  onSelect: (name: string) => void;
}) {
  const links = schema.relations.filter(
    (r) => r.table === table.name || r.targetTable === table.name,
  );
  return (
    <div className="db-map">
      <div className="db-map-title">
        <span>
          <GitBranch size={13} /> ENTITY RELATIONSHIPS
        </span>
        <span>0..1 optional · 1 required · 0..N many</span>
      </div>
      <details className="overflow-x-auto p-4">
        <summary className="cursor-pointer text-sm text-blue-700">
          Show {links.length} relationships
        </summary>
        {links.map((r) => {
          const child = schema.tables.find((t) => t.name === r.table)!;
          const column = child.columns.find((c) => c.name === r.column)!;
          const unique = child.indexes.some(
            (i) =>
              Number(i.unique) === 1 &&
              i.column === r.column &&
              child.indexes.filter((j) => j.name === i.name).length === 1,
          );
          const parentCount = column.nullable === 'YES' ? '0..1' : '1';
          const childCount = unique ? '0..1' : '0..N';
          return (
            <div
              key={r.name + r.table}
              className="min-w-[600px] border-b border-black/5 py-3 last:border-0"
            >
              <div className="flex items-center justify-between gap-3 text-sm">
                <button
                  className="w-40 rounded-lg border border-black/10 p-3 text-left font-mono text-blue-700"
                  onClick={() => onSelect(r.targetTable)}
                >
                  {r.targetTable}
                  <small className="block text-black/50">
                    PK {r.targetColumn}
                  </small>
                </button>
                <span className="font-mono text-xs">{parentCount}</span>
                <span className="h-px flex-1 bg-black/20" />
                <span className="font-mono text-xs">{childCount}</span>
                <button
                  className="w-48 rounded-lg border border-black/10 p-3 text-left font-mono text-blue-700"
                  onClick={() => onSelect(r.table)}
                >
                  {r.table}
                  <small className="block text-black/50">FK {r.column}</small>
                </button>
              </div>
              <p className="mt-2 text-center text-xs text-black/55">
                {r.table}.{r.column} → {r.targetTable}.{r.targetColumn}
              </p>
            </div>
          );
        })}
        {!links.length && (
          <p className="text-sm text-black/55">No declared foreign keys.</p>
        )}
      </details>
    </div>
  );
}
