import mysql, { type Pool, type PoolConnection, type RowDataPacket } from 'mysql2/promise';

let pool: Pool | undefined;

export function databaseConfigured() {
  return Boolean(process.env.MYSQL_URL || process.env.DATABASE_URL || (process.env.MYSQL_HOST && process.env.MYSQL_USER && process.env.MYSQL_PASSWORD !== undefined));
}

function poolConfig() {
  const url = process.env.MYSQL_URL || process.env.DATABASE_URL;
  if (url) return url;
  const host = process.env.MYSQL_HOST;
  const user = process.env.MYSQL_USER;
  const password = process.env.MYSQL_PASSWORD;
  if (!host || !user || password === undefined) throw new Error('MySQL is not configured.');
  return {
    host,
    port: Number(process.env.MYSQL_PORT || 3306),
    user,
    password,
    database: process.env.MYSQL_DATABASE || 'drift_car_rental',
    waitForConnections: true,
    connectionLimit: Number(process.env.MYSQL_CONNECTION_LIMIT || 6),
    queueLimit: 0,
    enableKeepAlive: true,
    ...(process.env.MYSQL_SSL === 'true' ? { ssl: { rejectUnauthorized: process.env.MYSQL_SSL_REJECT_UNAUTHORIZED !== 'false' } } : {}),
  };
}

export function getPool() {
  if (!pool) pool = mysql.createPool(poolConfig());
  return pool;
}

export async function queryRows<T extends RowDataPacket[]>(sql: string, params: unknown[] = []) {
  const [rows] = await getPool().query<T>(sql, params);
  return rows;
}

export async function withTransaction<T>(work: (connection: PoolConnection) => Promise<T>) {
  const connection = await getPool().getConnection();
  try {
    await connection.beginTransaction();
    const result = await work(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function databaseHealth() {
  if (!databaseConfigured()) return { ok: false, configured: false, source: 'memory' as const, error: 'MySQL credentials are not configured.' };
  const started = Date.now();
  try {
    const rows = await queryRows<RowDataPacket[]>(`SELECT DATABASE() AS database_name, VERSION() AS version, NOW() AS server_time`);
    return {
      ok: true,
      configured: true,
      source: 'mysql' as const,
      latencyMs: Date.now() - started,
      database: String(rows[0]?.database_name || ''),
      version: String(rows[0]?.version || ''),
      serverTime: rows[0]?.server_time,
    };
  } catch (error) {
    return { ok: false, configured: true, source: 'mysql' as const, error: error instanceof Error ? error.message : 'Unable to reach MySQL.' };
  }
}
