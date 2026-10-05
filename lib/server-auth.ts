const COOKIE_NAME = 'drift_session';
const encoder = new TextEncoder();

type SessionUser = { name: string; email: string; role: 'admin' | 'client'; exp: number };

function base64UrlEncode(input: Uint8Array | string) {
  const bytes = typeof input === 'string' ? encoder.encode(input) : input;
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlDecode(input: string) {
  const value = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = value + '='.repeat((4 - (value.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function secret() {
  const value = process.env.DRIFT_SESSION_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'drift-local-dev-session-secret');
  if (!value) throw new Error('DRIFT_SESSION_SECRET is required in production.');
  return value;
}

async function hmac(value: string) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret()), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(value)));
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a[i] ^ b[i];
  return diff === 0;
}

export async function createSessionCookie(user: Omit<SessionUser, 'exp'>) {
  const payload: SessionUser = { ...user, exp: Date.now() + 1000 * 60 * 60 * 12 };
  const encoded = base64UrlEncode(JSON.stringify(payload));
  const signature = base64UrlEncode(await hmac(encoded));
  return `${COOKIE_NAME}=${encoded}.${signature}; Path=/; HttpOnly; SameSite=Lax; Max-Age=43200${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
}

function cookieValue(request: Request) {
  const header = request.headers.get('cookie') || '';
  const pair = header.split(';').map((item) => item.trim()).find((item) => item.startsWith(`${COOKIE_NAME}=`));
  return pair?.slice(COOKIE_NAME.length + 1) || '';
}

export async function readServerSession(request: Request): Promise<SessionUser | null> {
  try {
    const value = cookieValue(request);
    if (!value) return null;
    const [encoded, signature] = value.split('.');
    if (!encoded || !signature) return null;
    const actual = base64UrlDecode(signature);
    const expected = await hmac(encoded);
    if (!constantTimeEqual(actual, expected)) return null;
    const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(encoded))) as SessionUser;
    if (!payload.email || !payload.role || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function requireAdmin(request: Request) {
  const session = await readServerSession(request);
  if (!session || session.role !== 'admin') return null;
  return session;
}
