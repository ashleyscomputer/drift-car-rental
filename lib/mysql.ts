import mysql, {
  type RowDataPacket,
  type ResultSetHeader,
  type PoolConnection,
} from 'mysql2/promise';
const state = globalThis as typeof globalThis & { driftPool?: mysql.Pool };
export function pool() {
  if (
    !process.env.MYSQL_DATABASE ||
    !process.env.MYSQL_USER ||
    !process.env.MYSQL_PASSWORD
  )
    throw new Error('MySQL connection is not configured.');
  return (state.driftPool ??= mysql.createPool({
    host: process.env.MYSQL_HOST || 'localhost',
    port: Number(process.env.MYSQL_PORT || 3306),
    database: process.env.MYSQL_DATABASE,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    connectionLimit: 5,
    decimalNumbers: true,
    dateStrings: true,
    timezone: 'Z',
    ssl:
      process.env.MYSQL_SSL === 'false'
        ? undefined
        : {
            rejectUnauthorized: true,
            ...(process.env.MYSQL_SSL_CA
              ? { ca: process.env.MYSQL_SSL_CA.replace(/\\n/g, '\n') }
              : {}),
          },
  }));
}
export async function rows<T>(
  sql: string,
  values: (string | number | boolean | Date | Buffer | null)[] = [],
  connection?: PoolConnection,
): Promise<T[]> {
  const [result] = await (connection || pool()).execute<RowDataPacket[]>(
    sql,
    values,
  );
  return result as T[];
}
export async function write(
  sql: string,
  values: (string | number | boolean | Date | Buffer | null)[] = [],
  connection?: PoolConnection,
) {
  const [result] = await (connection || pool()).execute<ResultSetHeader>(
    sql,
    values,
  );
  return result;
}
export async function transaction<T>(
  fn: (connection: PoolConnection) => Promise<T>,
): Promise<T> {
  const c = await pool().getConnection();
  try {
    await c.beginTransaction();
    const result = await fn(c);
    await c.commit();
    return result;
  } catch (e) {
    await c.rollback();
    throw e;
  } finally {
    c.release();
  }
}
