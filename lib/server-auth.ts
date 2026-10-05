import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
  createHash,
} from 'node:crypto';
import { promisify } from 'node:util';
import { rows, write } from './mysql';
import type { AuthUser } from './auth';
const scrypt = promisify(scryptCallback);
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function failure(error: unknown) {
  if (error instanceof SyntaxError)
    return Response.json({ error: 'Invalid request.' }, { status: 400 });
  if ((error as { code?: string })?.code === 'ER_DUP_ENTRY')
    return Response.json(
      { error: 'This record already exists. Refresh and retry.' },
      { status: 409 },
    );
  if (error instanceof HttpError)
    return Response.json({ error: error.message }, { status: error.status });
  console.error(
    'Drift request failed',
    error instanceof Error ? error.name : 'Unknown',
  );
  return Response.json(
    {
      error:
        'Unable to complete this request. Check the local database connection.',
    },
    { status: 503 },
  );
}
export function sameOrigin(request: Request) {
  if (request.headers.get('origin') !== new URL(request.url).origin)
    throw new HttpError(403, 'Request origin is not allowed.');
}
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const key = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt:${salt}:${key.toString('hex')}`;
}
export async function verifyPassword(password: string, hash: string) {
  const [algorithm, salt, expected] = hash.split(':');
  if (algorithm !== 'scrypt' || !salt || !expected) return false;
  const key = (await scrypt(password, salt, 64)) as Buffer;
  const value = Buffer.from(expected, 'hex');
  return value.length === key.length && timingSafeEqual(value, key);
}
const digest = (token: string) =>
  createHash('sha256').update(token).digest('hex');
export type SessionUser = AuthUser & { id: number; customerId: number | null };
export async function session(request: Request): Promise<SessionUser | null> {
  const token = request.headers
    .get('cookie')
    ?.split(';')
    .map((v) => v.trim())
    .find((v) => v.startsWith('drift_session='))
    ?.slice(14);
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const found = await rows<{
    id: number;
    customerId: number | null;
    email: string;
    role: string;
    name: string;
  }>(
    `SELECT u.user_id id,u.customer_id customerId,u.login_email email,u.role, COALESCE(CONCAT(c.first_name,' ',c.last_name),u.login_email) name FROM UserSession s JOIN AppUser u ON u.user_id=s.user_id LEFT JOIN Customer c ON c.customer_id=u.customer_id WHERE s.token_hash=? AND s.expires_at>UTC_TIMESTAMP() AND s.revoked_at IS NULL AND u.is_active=1`,
    [digest(token)],
  );
  return found[0]
    ? { ...found[0], role: found[0].role === 'Admin' ? 'admin' : 'client' }
    : null;
}
export async function requireUser(request: Request, admin = false) {
  const user = await session(request);
  if (!user) throw new HttpError(401, 'Sign in to continue.');
  if (admin && user.role !== 'admin')
    throw new HttpError(403, 'Administrator access required.');
  return user;
}
export async function createSession(userId: number, request: Request) {
  const token = randomBytes(32).toString('hex');
  await write(
    'INSERT INTO UserSession(user_id,token_hash,expires_at) VALUES(?,?,DATE_ADD(UTC_TIMESTAMP(),INTERVAL 7 DAY))',
    [userId, digest(token)],
  );
  return `drift_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800${new URL(request.url).protocol === 'https:' ? '; Secure' : ''}`;
}
export async function revokeSession(request: Request) {
  const token = request.headers
    .get('cookie')
    ?.split(';')
    .map((v) => v.trim())
    .find((v) => v.startsWith('drift_session='))
    ?.slice(14);
  if (token)
    await write(
      'UPDATE UserSession SET revoked_at=UTC_TIMESTAMP() WHERE token_hash=?',
      [digest(token)],
    );
}


/** Compatibility helpers for routes migrated from the earlier persistence layer. */
export async function readServerSession(request: Request) {
  return session(request);
}

export async function requireAdmin(request: Request) {
  const user = await session(request);
  return user?.role === 'admin';
}
