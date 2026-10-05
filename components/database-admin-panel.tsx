'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Database, GitBranch, LoaderCircle, Pencil, Plus, RefreshCw, Save, ShieldCheck, Table2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';

type DbTable = { name: string; rows: number; fields: string[] };
type Relationship = { childTable: string; childColumn: string; parentTable: string; parentColumn: string };
type Normalization = { form: string; status: string; explanation: string };
type Details = { health: { ok: boolean; configured: boolean; source: string; latencyMs?: number; database?: string; version?: string; error?: string }; tables: DbTable[]; relationships: Relationship[]; normalization: Normalization[] };
type EditorTable = 'rentalextra' | 'feature' | 'vehiclecategory';

type EditorConfig = { label: string; pk: string; fields: { key: string; label: string; type?: 'number' | 'select' | 'textarea'; options?: string[] }[] };
const editorConfig: Record<EditorTable, EditorConfig> = {
  rentalextra: { label: 'Rental extras', pk: 'extra_id', fields: [
    { key: 'extra_code', label: 'Code' }, { key: 'extra_name', label: 'Name' }, { key: 'price', label: 'Price', type: 'number' },
    { key: 'pricing_type', label: 'Pricing', type: 'select', options: ['daily','once'] }, { key: 'is_active', label: 'Active', type: 'select', options: ['1','0'] }, { key: 'description', label: 'Description', type: 'textarea' },
  ] },
  feature: { label: 'Vehicle features', pk: 'feature_id', fields: [{ key: 'feature_name', label: 'Feature name' }] },
  vehiclecategory: { label: 'Vehicle categories', pk: 'category_id', fields: [{ key: 'category_name', label: 'Category name' }] },
};

const fallbackRelationships: Relationship[] = [
  { childTable:'City',childColumn:'province_id',parentTable:'Province',parentColumn:'province_id' },
  { childTable:'Branch',childColumn:'city_id',parentTable:'City',parentColumn:'city_id' },
  { childTable:'VehicleModel',childColumn:'category_id',parentTable:'VehicleCategory',parentColumn:'category_id' },
  { childTable:'Vehicle',childColumn:'model_id',parentTable:'VehicleModel',parentColumn:'model_id' },
  { childTable:'Vehicle',childColumn:'branch_id',parentTable:'Branch',parentColumn:'branch_id' },
  { childTable:'VehicleFeature',childColumn:'vehicle_id',parentTable:'Vehicle',parentColumn:'vehicle_id' },
  { childTable:'VehicleFeature',childColumn:'feature_id',parentTable:'Feature',parentColumn:'feature_id' },
  { childTable:'Booking',childColumn:'customer_id',parentTable:'Customer',parentColumn:'customer_id' },
  { childTable:'Booking',childColumn:'vehicle_id',parentTable:'Vehicle',parentColumn:'vehicle_id' },
  { childTable:'BookingExtra',childColumn:'booking_id',parentTable:'Booking',parentColumn:'booking_id' },
  { childTable:'BookingExtra',childColumn:'extra_id',parentTable:'RentalExtra',parentColumn:'extra_id' },
  { childTable:'Payment',childColumn:'booking_id',parentTable:'Booking',parentColumn:'booking_id' },
];

export function DatabaseAdminPanel({ tables: initialTables, onRefresh, setToast }: { tables: DbTable[]; onRefresh: () => Promise<void>; setToast: (value: string) => void }) {
  const [details, setDetails] = useState<Details | null>(null);
  const [tab, setTab] = useState<'schema'|'erd'|'normalization'|'data'>('schema');
  const [loading, setLoading] = useState(true);
  const [editorTable, setEditorTable] = useState<EditorTable>('rentalextra');
  const [records, setRecords] = useState<Record<string, unknown>[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const tables = details?.tables || initialTables;

  const loadDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/database?details=1', { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Database details could not load.');
      setDetails(result);
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Database details could not load.');
    } finally { setLoading(false); }
  };

  const loadRecords = async (table: EditorTable) => {
    setRecords([]); setEditingId(null); setForm({});
    const response = await fetch(`/api/database/records?table=${table}`, { cache: 'no-store' });
    const result = await response.json();
    if (response.ok) setRecords(result); else setToast(result.error || 'Records could not load.');
  };

  useEffect(() => { loadDetails(); }, []);
  useEffect(() => { if (tab === 'data' && details?.health.ok) loadRecords(editorTable); }, [tab, editorTable, details?.health.ok]);

  const relationships = details?.relationships?.length ? details.relationships : fallbackRelationships;
  const entities = useMemo(() => [...new Set(relationships.flatMap((r) => [r.childTable, r.parentTable]))], [relationships]);

  const submitRecord = async (event: FormEvent) => {
    event.preventDefault();
    const config = editorConfig[editorTable];
    const values: Record<string, unknown> = {};
    for (const field of config.fields) {
      const raw = form[field.key] ?? '';
      values[field.key] = field.type === 'number' ? Number(raw) : field.key === 'is_active' ? Number(raw || 1) : raw;
    }
    const response = await fetch('/api/database/records', { method: editingId ? 'PATCH' : 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ table: editorTable, id: editingId || undefined, values }) });
    const result = await response.json();
    if (!response.ok) return setToast(result.error || 'Database update failed.');
    setToast(editingId ? 'Database record updated.' : 'Database record created.');
    setForm({}); setEditingId(null); await loadRecords(editorTable); await loadDetails(); await onRefresh();
  };

  const edit = (record: Record<string, unknown>) => {
    const config = editorConfig[editorTable];
    setEditingId(Number(record[config.pk]));
    setForm(Object.fromEntries(config.fields.map((field) => [field.key, String(record[field.key] ?? '')])));
  };

  const remove = async (record: Record<string, unknown>) => {
    const config = editorConfig[editorTable];
    const response = await fetch('/api/database/records', { method:'DELETE', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ table:editorTable, id:Number(record[config.pk]) }) });
    const result = await response.json();
    if (!response.ok) return setToast(result.error || 'Record could not be deleted.');
    setToast('Database record deleted.'); await loadRecords(editorTable); await loadDetails(); await onRefresh();
  };

  return <div>
    <div className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-3xl font-semibold tracking-[-.04em]">Database</h1><p className="mt-1 text-sm text-black/45">Live schema, ERD, normalization and controlled data editing.</p></div><Button variant="outline" onClick={loadDetails} disabled={loading}>{loading ? <LoaderCircle className="animate-spin"/> : <RefreshCw/>} Refresh</Button></div>
    <div className={`mt-5 flex items-start gap-3 rounded-2xl border p-4 text-sm ${details?.health.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-900'}`}><span className="mt-0.5">{details?.health.ok ? <CheckCircle2 className="size-5"/> : <Database className="size-5"/>}</span><div><strong>{details?.health.ok ? 'MySQL connected' : 'MySQL not online yet'}</strong><p className="mt-1 opacity-75">{details?.health.ok ? `${details.health.database || 'drift_car_rental'} · ${details.health.latencyMs ?? 0} ms · ${details.health.version || ''}` : details?.health.error || 'The application is currently using its safe in-memory fallback.'}</p></div></div>
    <div className="mt-5 flex flex-wrap gap-2">{(['schema','erd','normalization','data'] as const).map((item) => <button key={item} onClick={() => setTab(item)} className={`rounded-full px-4 py-2 text-sm capitalize ${tab===item?'bg-black text-white':'bg-white text-black/55'}`}>{item === 'erd' ? 'ERD' : item}</button>)}</div>

    {tab === 'schema' && <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{tables.map((table) => <div key={table.name} className="rounded-[22px] border border-black/[.05] bg-white p-5"><div className="flex items-center justify-between"><span className="grid size-9 place-items-center rounded-xl bg-[#f5f5f7]"><Table2 className="size-4"/></span><span className="text-xs text-black/40">{table.rows} rows</span></div><h3 className="mt-5 font-semibold">{table.name}</h3><p className="mt-2 line-clamp-3 text-xs leading-5 text-black/45">{table.fields.join(' · ')}</p></div>)}</div>}

    {tab === 'erd' && <div className="mt-6"><div className="rounded-[24px] bg-black p-6 text-white"><div className="flex items-center gap-3"><GitBranch/><div><h2 className="font-semibold">Entity Relationship Diagram</h2><p className="text-sm text-white/45">{details?.health.ok ? 'Generated from live MySQL foreign keys.' : 'Schema blueprint shown until the hosted database is reachable.'}</p></div></div><div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">{entities.map((entity) => <div key={entity} className="rounded-2xl bg-white/[.08] p-4"><strong className="text-sm">{entity}</strong><div className="mt-3 space-y-1 text-[11px] text-white/50">{relationships.filter((r)=>r.childTable===entity).slice(0,5).map((r)=><p key={`${r.childTable}-${r.childColumn}`}>{r.childColumn} → {r.parentTable}.{r.parentColumn}</p>)}{relationships.filter((r)=>r.childTable===entity).length===0&&<p>Parent / lookup entity</p>}</div></div>)}</div></div><div className="mt-5 space-y-2">{relationships.map((r,i) => <div key={`${r.childTable}-${r.childColumn}-${i}`} className="flex flex-wrap items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm shadow-sm"><strong>{r.childTable}</strong><code className="text-xs text-black/45">.{r.childColumn}</code><span className="text-black/25">→</span><strong>{r.parentTable}</strong><code className="text-xs text-black/45">.{r.parentColumn}</code></div>)}</div></div>}

    {tab === 'normalization' && <div className="mt-6 grid gap-4 lg:grid-cols-3">{(details?.normalization || []).map((item) => <div key={item.form} className="rounded-[24px] border border-black/[.05] bg-white p-6"><div className="flex items-center justify-between"><span className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><ShieldCheck className="size-5"/></span><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">{item.status}</span></div><h3 className="mt-6 text-2xl font-semibold">{item.form}</h3><p className="mt-3 text-sm leading-6 text-black/50">{item.explanation}</p></div>)}</div>}

    {tab === 'data' && <div className="mt-6 grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
      <section className="overflow-hidden rounded-[24px] border border-black/[.05] bg-white"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/[.05] p-5"><div><h2 className="font-semibold">Safe record editor</h2><p className="mt-1 text-xs text-black/40">Vehicle and booking changes remain in their dedicated admin screens.</p></div><NativeSelect value={editorTable} onChange={(e)=>setEditorTable(e.target.value as EditorTable)}>{Object.entries(editorConfig).map(([key,value])=><NativeSelectOption key={key} value={key}>{value.label}</NativeSelectOption>)}</NativeSelect></div><div className="overflow-x-auto"><table className="w-full text-left text-sm"><tbody>{records.map((record) => <tr key={String(record[editorConfig[editorTable].pk])} className="border-b border-black/[.05]"><td className="px-5 py-4"><strong>{String(record.extra_name || record.feature_name || record.category_name || record[editorConfig[editorTable].pk])}</strong><p className="mt-1 max-w-md truncate text-xs text-black/40">{Object.entries(record).slice(0,5).map(([k,v])=>`${k}: ${String(v ?? '')}`).join(' · ')}</p></td><td className="px-5 py-4"><div className="flex justify-end gap-2"><Button size="icon-sm" variant="outline" onClick={()=>edit(record)}><Pencil/></Button><Button size="icon-sm" variant="destructive" onClick={()=>remove(record)}><Trash2/></Button></div></td></tr>)}{records.length===0&&<tr><td className="p-8 text-center text-black/40">{details?.health.ok?'No records in this table.':'Connect MySQL to edit live records.'}</td></tr>}</tbody></table></div></section>
      <form onSubmit={submitRecord} className="h-fit rounded-[24px] border border-black/[.05] bg-white p-6"><div className="flex items-center justify-between"><div><h2 className="font-semibold">{editingId ? 'Edit record' : 'Add record'}</h2><p className="mt-1 text-xs text-black/40">{editorConfig[editorTable].label}</p></div>{editingId&&<Button type="button" variant="ghost" onClick={()=>{setEditingId(null);setForm({});}}>Cancel</Button>}</div><div className="mt-5 space-y-4">{editorConfig[editorTable].fields.map((field) => <label key={field.key} className="block"><span className="mb-2 block text-xs font-medium text-black/55">{field.label}</span>{field.type==='select'?<NativeSelect className="w-full" value={form[field.key] ?? field.options?.[0] ?? ''} onChange={(e)=>setForm({...form,[field.key]:e.target.value})}>{field.options?.map((option)=><NativeSelectOption key={option} value={option}>{option === '1' ? 'Yes' : option === '0' ? 'No' : option}</NativeSelectOption>)}</NativeSelect>:field.type==='textarea'?<Textarea value={form[field.key]??''} onChange={(e)=>setForm({...form,[field.key]:e.target.value})}/>:<Input required={field.key!=='description'} type={field.type==='number'?'number':'text'} step={field.key==='price'?'0.01':undefined} value={form[field.key]??''} onChange={(e)=>setForm({...form,[field.key]:e.target.value})}/>}</label>)}</div><Button type="submit" disabled={!details?.health.ok} className="mt-6 w-full rounded-full bg-[#0071e3] text-white">{editingId?<><Save/> Save changes</>:<><Plus/> Add record</>}</Button></form>
    </div>}
  </div>;
}
