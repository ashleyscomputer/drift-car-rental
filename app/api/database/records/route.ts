import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { databaseConfigured, getPool } from '@/lib/db';
import { ensureReferenceData } from '@/lib/mysql-store';
import { requireAdmin } from '@/lib/server-auth';

export const runtime = 'nodejs';

const tables = {
  rentalextra: { pk: 'extra_id', fields: ['extra_code','extra_name','description','price','pricing_type','is_active'] },
  feature: { pk: 'feature_id', fields: ['feature_name'] },
  vehiclecategory: { pk: 'category_id', fields: ['category_name'] },
} as const;

type TableName = keyof typeof tables;

function resolveTable(value: string | null): TableName | null {
  const key = (value || '').toLowerCase() as TableName;
  return key in tables ? key : null;
}

function cleanValues(table: TableName, input: Record<string, unknown>) {
  return Object.fromEntries(tables[table].fields.filter((field) => Object.prototype.hasOwnProperty.call(input, field)).map((field) => [field, input[field]]));
}

export async function GET(request: Request) {
  if (!(await requireAdmin(request))) return Response.json({ error: 'Admin sign-in required.' }, { status: 401 });
  if (!databaseConfigured()) return Response.json({ error: 'MySQL is not configured.' }, { status: 503 });
  const table = resolveTable(new URL(request.url).searchParams.get('table'));
  if (!table) return Response.json({ error: 'This table is not available in the safe editor.' }, { status: 400 });
  await ensureReferenceData();
  const config = tables[table];
  const [rows] = await getPool().query<RowDataPacket[]>(`SELECT * FROM \`${table}\` ORDER BY \`${config.pk}\``);
  return Response.json(rows);
}

export async function POST(request: Request) {
  if (!(await requireAdmin(request))) return Response.json({ error: 'Admin sign-in required.' }, { status: 401 });
  if (!databaseConfigured()) return Response.json({ error: 'MySQL is not configured.' }, { status: 503 });
  const body = await request.json() as { table?: string; values?: Record<string, unknown> };
  const table = resolveTable(body.table || null);
  if (!table || !body.values) return Response.json({ error: 'Choose a supported table and values.' }, { status: 400 });
  const values = cleanValues(table, body.values);
  const fields = Object.keys(values);
  if (!fields.length) return Response.json({ error: 'No editable values were supplied.' }, { status: 400 });
  const placeholders = fields.map(() => '?').join(',');
  const [result] = await getPool().execute<ResultSetHeader>(`INSERT INTO \`${table}\` (${fields.map((field) => `\`${field}\``).join(',')}) VALUES (${placeholders})`, fields.map((field) => values[field]));
  return Response.json({ ok: true, id: result.insertId }, { status: 201 });
}

export async function PATCH(request: Request) {
  if (!(await requireAdmin(request))) return Response.json({ error: 'Admin sign-in required.' }, { status: 401 });
  if (!databaseConfigured()) return Response.json({ error: 'MySQL is not configured.' }, { status: 503 });
  const body = await request.json() as { table?: string; id?: number; values?: Record<string, unknown> };
  const table = resolveTable(body.table || null);
  if (!table || !body.id || !body.values) return Response.json({ error: 'Choose a supported record.' }, { status: 400 });
  const values = cleanValues(table, body.values);
  const fields = Object.keys(values);
  if (!fields.length) return Response.json({ error: 'No editable values were supplied.' }, { status: 400 });
  const config = tables[table];
  await getPool().execute(`UPDATE \`${table}\` SET ${fields.map((field) => `\`${field}\` = ?`).join(', ')} WHERE \`${config.pk}\` = ?`, [...fields.map((field) => values[field]), body.id]);
  return Response.json({ ok: true });
}

export async function DELETE(request: Request) {
  if (!(await requireAdmin(request))) return Response.json({ error: 'Admin sign-in required.' }, { status: 401 });
  if (!databaseConfigured()) return Response.json({ error: 'MySQL is not configured.' }, { status: 503 });
  const body = await request.json() as { table?: string; id?: number };
  const table = resolveTable(body.table || null);
  if (!table || !body.id) return Response.json({ error: 'Choose a supported record.' }, { status: 400 });
  const config = tables[table];
  try {
    await getPool().execute(`DELETE FROM \`${table}\` WHERE \`${config.pk}\` = ?`, [body.id]);
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: 'This record is referenced elsewhere and cannot be deleted safely.' }, { status: 409 });
  }
}
