/** Server-side integration placeholder. Never import into client components.
 * The existing MySQL schema and credentials must be supplied before wiring
 * a connection pool, repositories, and authenticated account sessions.
 */
export function getMySqlConfiguration() {
  const { MYSQL_HOST, MYSQL_DATABASE, MYSQL_USER, MYSQL_PASSWORD } = process.env;
  if (!MYSQL_HOST || !MYSQL_DATABASE || !MYSQL_USER || !MYSQL_PASSWORD) {
    throw new Error('MySQL is not configured. Set the server-side MYSQL_* variables.');
  }
  return {
    host: MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT || 3306),
    database: MYSQL_DATABASE,
    user: MYSQL_USER,
    password: MYSQL_PASSWORD,
    ssl: process.env.MYSQL_SSL !== 'false',
  };
}
