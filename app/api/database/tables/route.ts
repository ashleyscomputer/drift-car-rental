import { rows, write } from '@/lib/mysql';
import { requireUser, sameOrigin, failure, HttpError } from '@/lib/server-auth';

const types = {
  text: 'VARCHAR(255)',
  number: 'INT',
  decimal: 'DECIMAL(12,2)',
  date: 'DATE',
} as const;
const identifier = /^[a-z][a-z0-9_]{0,39}$/;
function tableName(value: unknown) {
  if (typeof value !== 'string' || !/^custom_[a-z][a-z0-9_]{0,39}$/.test(value))
    throw new HttpError(
      400,
      'Select an admin-created table. Core tables are protected.',
    );
  return '`' + value + '`';
}
async function columns(name: string) {
  tableName(name);
  const fields = await rows<{ name: string; type: string }>(
    'SELECT COLUMN_NAME name,DATA_TYPE type FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name=? ORDER BY ORDINAL_POSITION',
    [name],
  );
  if (!fields.length) throw new HttpError(404, 'Table not found.');
  if (
    !fields.some((f) => f.name === 'id' && f.type === 'int') ||
    fields.some(
      (f) =>
        !identifier.test(f.name) ||
        !['int', 'decimal', 'varchar', 'date'].includes(f.type),
    )
  )
    throw new HttpError(
      409,
      'This table layout is not supported by the record editor.',
    );
  return fields;
}
function errorResponse(error: unknown) {
  if (
    ['ER_TABLEACCESS_DENIED_ERROR', 'ER_DBACCESS_DENIED_ERROR'].includes(
      (error as { code?: string })?.code || '',
    )
  )
    return Response.json(
      {
        error:
          'Table management needs MySQL CREATE and DROP permissions. Run scripts/enable-table-management.ps1 on the database computer.',
      },
      { status: 503 },
    );
  if ((error as { code?: string })?.code === 'ER_TABLE_EXISTS_ERROR')
    return Response.json(
      { error: 'That table already exists.' },
      { status: 409 },
    );
  return failure(error);
}
export async function GET(request: Request) {
  try {
    await requireUser(request, true);
    const name = new URL(request.url).searchParams.get('table');
    if (!name) {
      const tables = await rows<{ name: string }>(
        "SELECT TABLE_NAME name FROM information_schema.tables WHERE table_schema=DATABASE() AND table_type='BASE TABLE' ORDER BY TABLE_NAME",
      );
      return Response.json(
        {
          tables: tables.filter((t) =>
            /^custom_[a-z][a-z0-9_]{0,39}$/.test(t.name),
          ),
        },
        { headers: { 'Cache-Control': 'no-store' } },
      );
    }
    const fields = await columns(name);
    const records = await rows<Record<string, unknown>>(
      `SELECT * FROM ${tableName(name)} ORDER BY id DESC LIMIT 100`,
    );
    return Response.json(
      { fields, records },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    await requireUser(request, true);
    const body = (await request.json()) as {
      name?: unknown;
      columns?: { name: string; type: string }[];
    };
    if (typeof body.name !== 'string' || !identifier.test(body.name))
      throw new HttpError(
        400,
        'Use a table name starting with a lowercase letter, followed by letters, numbers or underscores (up to 40 characters).',
      );
    if (
      !Array.isArray(body.columns) ||
      body.columns.length < 1 ||
      body.columns.length > 8
    )
      throw new HttpError(400, 'Add between 1 and 8 columns.');
    const seen = new Set(['id']);
    const definitions = body.columns.map((c) => {
      if (
        !c ||
        typeof c.name !== 'string' ||
        !identifier.test(c.name) ||
        seen.has(c.name) ||
        !Object.hasOwn(types, c.type)
      )
        throw new HttpError(
          400,
          'Use unique lowercase column names and a supported type. The id column is automatic.',
        );
      seen.add(c.name);
      return (
        '`' + c.name + '` ' + types[c.type as keyof typeof types] + ' NULL'
      );
    });
    const name = 'custom_' + body.name;
    await write(
      `CREATE TABLE ${tableName(name)} (id INT AUTO_INCREMENT PRIMARY KEY,${definitions.join(',')}) ENGINE=InnoDB`,
    );
    return Response.json({ name }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
export async function PATCH(request: Request) {
  try {
    sameOrigin(request);
    await requireUser(request, true);
    const body = (await request.json()) as {
      table: string;
      id?: number;
      values: Record<string, unknown>;
    };
    const fields = (await columns(body.table)).filter((f) => f.name !== 'id');
    if (
      !body.values ||
      typeof body.values !== 'object' ||
      Array.isArray(body.values) ||
      Object.keys(body.values).some((k) => !fields.some((f) => f.name === k))
    )
      throw new HttpError(
        400,
        'Provide values for the selected table columns only.',
      );
    if (
      body.id !== undefined &&
      (!Number.isSafeInteger(body.id) || body.id < 1)
    )
      throw new HttpError(400, 'Invalid record ID.');
    const values = fields.map((f) => {
      const v = body.values[f.name];
      if (v === null || v === undefined || v === '') return null;
      if (f.type === 'varchar') {
        if (typeof v !== 'string' || v.length > 255)
          throw new HttpError(
            400,
            `${f.name} must be text up to 255 characters.`,
          );
        return v;
      }
      if (f.type === 'date') {
        if (
          typeof v !== 'string' ||
          !/^\d{4}-\d{2}-\d{2}$/.test(v) ||
          !Number.isFinite(Date.parse(v)) ||
          new Date(v).toISOString().slice(0, 10) !== v
        )
          throw new HttpError(400, `${f.name} needs a valid date.`);
        return v;
      }
      if (typeof v !== 'string' && typeof v !== 'number')
        throw new HttpError(400, 'Invalid numeric value.');
      const n = Number(v);
      if (
        !Number.isFinite(n) ||
        (f.type === 'int' &&
          (!Number.isInteger(n) || Math.abs(n) > 2147483647)) ||
        (f.type === 'decimal' &&
          (Math.abs(n) > 9999999999.99 ||
            Math.abs(n * 100 - Math.round(n * 100)) > 0.0001))
      )
        throw new HttpError(
          400,
          `${f.name} is outside its numeric range or precision.`,
        );
      return n;
    });
    const result =
      body.id === undefined
        ? await write(
            `INSERT INTO ${tableName(body.table)} (${fields.map((f) => '`' + f.name + '`').join(',')}) VALUES (${fields.map(() => '?').join(',')})`,
            values,
          )
        : await write(
            `UPDATE ${tableName(body.table)} SET ${fields.map((f) => '`' + f.name + '`=?').join(',')} WHERE id=?`,
            [...values, body.id],
          );
    return Response.json({ saved: true, id: body.id ?? result.insertId });
  } catch (error) {
    return errorResponse(error);
  }
}
export async function DELETE(request: Request) {
  try {
    sameOrigin(request);
    await requireUser(request, true);
    const body = (await request.json()) as {
      table: string;
      id?: number;
      confirm?: string;
    };
    const name = tableName(body.table);
    await columns(body.table);
    if (body.id !== undefined) {
      if (!Number.isSafeInteger(body.id) || body.id < 1)
        throw new HttpError(400, 'Invalid record ID.');
      await write(`DELETE FROM ${name} WHERE id=?`, [body.id]);
    } else {
      if (body.confirm !== body.table)
        throw new HttpError(
          400,
          'Type the full table name to confirm removal.',
        );
      await write(`DROP TABLE ${name}`);
    }
    return Response.json({ deleted: true });
  } catch (error) {
    return errorResponse(error);
  }
}
