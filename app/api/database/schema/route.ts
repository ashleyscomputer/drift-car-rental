import { rows } from '@/lib/mysql';
import { requireUser, failure } from '@/lib/server-auth';
import type {
  SchemaColumn,
  SchemaRelation,
  SchemaIndex,
  SchemaTable,
} from '@/lib/database-schema';
export async function GET(request: Request) {
  try {
    await requireUser(request, true);
    const [[info], tables, columns, indexes, relations, checks] =
      await Promise.all([
        rows<{ database: string; version: string }>(
          'SELECT DATABASE() `database`,VERSION() version',
        ),
        rows<{ name: string; engine: string }>(
          "SELECT TABLE_NAME name,ENGINE engine FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_TYPE='BASE TABLE' ORDER BY TABLE_NAME",
        ),
        rows<SchemaColumn & { tableName: string }>(
          'SELECT TABLE_NAME tableName,COLUMN_NAME name,COLUMN_TYPE type,IS_NULLABLE nullable,COLUMN_DEFAULT defaultValue,COLUMN_KEY `key`,EXTRA extra FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() ORDER BY TABLE_NAME,ORDINAL_POSITION',
        ),
        rows<SchemaIndex & { tableName: string }>(
          'SELECT TABLE_NAME tableName,INDEX_NAME name,COLUMN_NAME `column`,(1-NON_UNIQUE) `unique`,SEQ_IN_INDEX position FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() ORDER BY TABLE_NAME,INDEX_NAME,SEQ_IN_INDEX',
        ),
        rows<SchemaRelation>(
          'SELECT k.CONSTRAINT_NAME name,k.TABLE_NAME `table`,k.COLUMN_NAME `column`,k.REFERENCED_TABLE_NAME targetTable,k.REFERENCED_COLUMN_NAME targetColumn,r.UPDATE_RULE updateRule,r.DELETE_RULE deleteRule FROM information_schema.KEY_COLUMN_USAGE k JOIN information_schema.REFERENTIAL_CONSTRAINTS r ON r.CONSTRAINT_SCHEMA=k.CONSTRAINT_SCHEMA AND r.CONSTRAINT_NAME=k.CONSTRAINT_NAME AND r.TABLE_NAME=k.TABLE_NAME WHERE k.TABLE_SCHEMA=DATABASE() AND k.REFERENCED_TABLE_NAME IS NOT NULL ORDER BY k.TABLE_NAME,k.ORDINAL_POSITION',
        ),
        rows<{ tableName: string; name: string; clause: string }>(
          "SELECT t.TABLE_NAME tableName,t.CONSTRAINT_NAME name,c.CHECK_CLAUSE clause FROM information_schema.TABLE_CONSTRAINTS t JOIN information_schema.CHECK_CONSTRAINTS c ON t.CONSTRAINT_SCHEMA=c.CONSTRAINT_SCHEMA AND t.CONSTRAINT_NAME=c.CONSTRAINT_NAME WHERE t.TABLE_SCHEMA=DATABASE() AND t.CONSTRAINT_TYPE='CHECK'",
        ),
      ]);
    const result: SchemaTable[] = [];
    for (const t of tables) {
      const identifier = '`' + t.name.replaceAll('`', '``') + '`';
      const [[count], [definition]] = await Promise.all([
        rows<{ total: number }>('SELECT COUNT(*) total FROM ' + identifier),
        rows<Record<string, string>>('SHOW CREATE TABLE ' + identifier),
      ]);
      result.push({
        ...t,
        rows: count.total,
        columns: columns.filter((c) => c.tableName === t.name),
        indexes: indexes.filter((i) => i.tableName === t.name),
        checks: checks.filter((c) => c.tableName === t.name),
        ddl: definition['Create Table'],
      });
    }
    return Response.json(
      {
        ...info,
        capturedAt: new Date().toISOString(),
        tables: result,
        relations,
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (e) {
    return failure(e);
  }
}
