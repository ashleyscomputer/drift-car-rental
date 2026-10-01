'use client';
import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
type Field = { name: string; type: string };
export function TableWorkspace({
  onChanged,
}: {
  onChanged: () => Promise<void>;
}) {
  const [tables, setTables] = useState<string[]>([]),
    [selected, setSelected] = useState('');
  const [fields, setFields] = useState<Field[]>([]),
    [records, setRecords] = useState<Record<string, string | number | null>[]>(
      [],
    );
  const [name, setName] = useState(''),
    [columns, setColumns] = useState([{ name: '', type: 'text' }]);
  const [values, setValues] = useState<Record<string, string>>({}),
    [id, setId] = useState<number | undefined>();
  const [confirmation, setConfirmation] = useState(''),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState('');
  async function request(method: string, body?: unknown, table?: string) {
    const res = await fetch(
      '/api/database/tables' +
        (table ? '?table=' + encodeURIComponent(table) : ''),
      {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
        cache: 'no-store',
      },
    );
    const data = await res.json();
    if (!res.ok) throw new Error((data as { error: string }).error);
    return data as {
      tables: { name: string }[];
      fields: Field[];
      records: Record<string, string | number | null>[];
      name: string;
    };
  }
  async function refresh() {
    const data = await request('GET');
    setTables(data.tables.map((t) => t.name));
  }
  async function select(table: string) {
    setSelected(table);
    setId(undefined);
    setValues({});
    setConfirmation('');
    if (!table) {
      setFields([]);
      setRecords([]);
      return;
    }
    const data = await request('GET', undefined, table);
    setFields(data.fields);
    setRecords(data.records);
  }
  useEffect(() => {
    let active = true;
    request('GET')
      .then((data) => {
        if (active) setTables(data.tables.map((t) => t.name));
      })
      .catch((e) => {
        if (active) setMessage(e.message);
      });
    return () => {
      active = false;
    };
  }, []);

  async function action(fn: () => Promise<void>) {
    setBusy(true);
    setMessage('');
    try {
      await fn();
      await refresh();
      await onChanged();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Unable to save.');
    } finally {
      setBusy(false);
    }
  }
  const inputClass = 'rounded-xl border border-black/10 bg-white p-2 text-sm';
  return (
    <section className="mt-6 rounded-3xl border border-black/10 bg-white p-6">
      <h2 className="text-xl font-semibold">Manage your tables</h2>
      <p className="mt-2 text-sm text-black/50">
        Create MySQL tables, manage their records and remove tables you no
        longer need. Core rental and account tables are protected.
      </p>
      <form
        className="mt-6 space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          void action(async () => {
            const data = await request('POST', { name, columns });
            await select(data.name);
            setName('');
            setMessage('Table created.');
          });
        }}
      >
        <label htmlFor="custom-table-name" className="block text-sm">
          New table name
          <Input
            required
            pattern="[a-z][a-z0-9_]{0,39}"
            maxLength={40}
            value={name}
            onChange={(e) => setName(e.target.value)}
            id="custom-table-name"
            placeholder="maintenance_notes"
          />
        </label>
        <p className="text-xs text-black/50">
          Stored as custom_{name || 'your_table'}. An integer primary key named
          id is added automatically.
        </p>
        {columns.map((c, i) => (
          <div className="flex flex-wrap gap-2" key={i}>
            <Input
              className="min-w-40 flex-1"
              aria-label={`Column ${i + 1} name`}
              required
              pattern="[a-z][a-z0-9_]{0,39}"
              value={c.name}
              onChange={(e) =>
                setColumns(
                  columns.map((v, j) =>
                    j === i ? { ...v, name: e.target.value } : v,
                  ),
                )
              }
            />
            <select
              aria-label={`Column ${i + 1} type`}
              className={inputClass}
              value={c.type}
              onChange={(e) =>
                setColumns(
                  columns.map((v, j) =>
                    j === i ? { ...v, type: e.target.value } : v,
                  ),
                )
              }
            >
              <option value="text">Text</option>
              <option value="number">Whole number</option>
              <option value="decimal">Decimal (2 places)</option>
              <option value="date">Date</option>
            </select>
            <Button
              type="button"
              variant="outline"
              disabled={columns.length === 1}
              onClick={() => setColumns(columns.filter((_, j) => j !== i))}
            >
              Remove column
            </Button>
          </div>
        ))}
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={columns.length >= 8 || busy}
            onClick={() => setColumns([...columns, { name: '', type: 'text' }])}
          >
            Add column
          </Button>
          <Button type="submit" disabled={busy}>
            Create table
          </Button>
        </div>
      </form>
      <div className="mt-8 border-t border-black/10 pt-5">
        <label className="block text-sm">
          Select a table
          <select
            className={inputClass + ' mt-2 block w-full'}
            value={selected}
            disabled={busy}
            onChange={(e) => void action(() => select(e.target.value))}
          >
            <option value="">Choose a table</option>
            {tables.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
      </div>
      {selected && (
        <>
          <form
            className="mt-5 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              void action(async () => {
                await request('PATCH', { table: selected, id, values });
                await select(selected);
                setMessage('Record saved.');
              });
            }}
          >
            <h3 className="font-medium">
              {id ? `Edit record #${id}` : 'Add a record'}
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {fields
                .filter((f) => f.name !== 'id')
                .map((f) => (
                  <label key={f.name} className="text-sm">
                    {f.name}
                    <Input
                      type={
                        f.type === 'date'
                          ? 'date'
                          : f.type === 'varchar'
                            ? 'text'
                            : 'number'
                      }
                      step={f.type === 'decimal' ? '0.01' : undefined}
                      maxLength={f.type === 'varchar' ? 255 : undefined}
                      value={values[f.name] || ''}
                      onChange={(e) =>
                        setValues({ ...values, [f.name]: e.target.value })
                      }
                    />
                  </label>
                ))}
            </div>
            <Button disabled={busy} type="submit">
              {id ? 'Save changes' : 'Add record'}
            </Button>
            {id && (
              <Button
                className="ml-2"
                type="button"
                variant="outline"
                onClick={() => {
                  setId(undefined);
                  setValues({});
                }}
              >
                Cancel edit
              </Button>
            )}
          </form>
          <p className="mt-5 text-xs text-black/50">
            Latest 100 records. Empty fields are stored as NULL.
          </p>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  {fields.map((f) => (
                    <th className="p-2" key={f.name}>
                      {f.name}
                    </th>
                  ))}
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={String(r.id)} className="border-t border-black/10">
                    {fields.map((f) => (
                      <td className="max-w-64 break-words p-2" key={f.name}>
                        {r[f.name] ?? 'NULL'}
                      </td>
                    ))}
                    <td className="flex gap-2 p-2">
                      <Button
                        disabled={busy}
                        variant="outline"
                        onClick={() => {
                          setId(Number(r.id));
                          setValues(
                            Object.fromEntries(
                              fields
                                .filter((f) => f.name !== 'id')
                                .map((f) => [f.name, String(r[f.name] ?? '')]),
                            ),
                          );
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        disabled={busy}
                        variant="outline"
                        onClick={() => {
                          if (
                            window.confirm(
                              `Permanently delete record #${r.id}?`,
                            )
                          )
                            void action(async () => {
                              await request('DELETE', {
                                table: selected,
                                id: Number(r.id),
                              });
                              await select(selected);
                              setMessage('Record deleted.');
                            });
                        }}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!records.length && (
              <p className="p-3 text-sm text-black/50">No records yet.</p>
            )}
          </div>
          <div className="mt-6 rounded-2xl border border-red-100 p-4">
            <p className="text-sm">
              Remove this table and all of its records. Type <b>{selected}</b>{' '}
              to confirm.
            </p>
            <Input
              aria-label="Confirm table name for removal"
              className="mt-2"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
            />
            <Button
              className="mt-3"
              variant="outline"
              disabled={busy || confirmation !== selected}
              onClick={() =>
                void action(async () => {
                  await request('DELETE', {
                    table: selected,
                    confirm: confirmation,
                  });
                  await select('');
                  setMessage('Table removed.');
                })
              }
            >
              Remove table permanently
            </Button>
          </div>
        </>
      )}
      {message && <output className="mt-4 block text-sm">{message}</output>}
    </section>
  );
}
