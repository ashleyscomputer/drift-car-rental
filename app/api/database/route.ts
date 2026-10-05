import { rows } from '@/lib/mysql';
import { requireUser, failure } from '@/lib/server-auth';
export async function GET(request: Request) {
  try {
    await requireUser(request, true);
    const columns = await rows<{ name: string; field: string }>(
      'SELECT TABLE_NAME name,COLUMN_NAME field FROM information_schema.columns WHERE table_schema=DATABASE() ORDER BY TABLE_NAME,ORDINAL_POSITION',
    );
    const result = [];
    for (const name of new Set(columns.map((c) => c.name))) {
      if (!/^[a-zA-Z0-9_]+$/.test(name)) continue;
      const [count] = await rows<{ total: number }>(
        'SELECT COUNT(*) total FROM ' + name,
      );
      result.push({
        name,
        rows: count.total,
        fields: columns.filter((c) => c.name === name).map((c) => c.field),
      });
    }
    return Response.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    return failure(e);
  }
}
