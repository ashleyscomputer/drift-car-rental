import { createSessionCookie } from '@/lib/server-auth';

type Account = {
  email: string;
  passwordHash: string;
  user: { name: string; email: string; role: 'admin' | 'client' };
};

const accounts: Account[] = [
  {
    email: '202103070@spu.ac.za',
    passwordHash: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918',
    user: { name: 'Ashley Van Rooyen', email: '202103070@spu.ac.za', role: 'admin' },
  },
  {
    email: 'ashleyvr90@gmail.com',
    passwordHash: '264c8c381bf16c982a4e59b0dd4c6f7808c51a05f64c35db42cc78a2a72875bb',
    user: { name: 'Ashley Van Rooyen', email: 'ashleyvr90@gmail.com', role: 'client' },
  },
];

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { email?: string; password?: string };
    const email = body.email?.trim().toLowerCase() || '';
    const password = body.password || '';
    if (!email || !password) return Response.json({ error: 'Enter your email and password.' }, { status: 400 });

    const account = accounts.find((item) => item.email === email);
    if (!account || (await sha256(password)) !== account.passwordHash) {
      return Response.json({ error: 'Incorrect email or password.' }, { status: 401 });
    }

    const headers = new Headers({ 'Content-Type': 'application/json' });
    headers.append('Set-Cookie', await createSessionCookie(account.user));
    return new Response(JSON.stringify({ user: account.user }), { status: 200, headers });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Unable to sign in right now.' }, { status: 400 });
  }
}
