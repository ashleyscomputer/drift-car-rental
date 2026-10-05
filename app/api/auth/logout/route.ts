import { revokeSession, sameOrigin, failure } from '@/lib/server-auth';
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    await revokeSession(request);
    return Response.json(
      { ok: true },
      {
        headers: {
          'Set-Cookie':
            'drift_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0',
          'Cache-Control': 'no-store',
        },
      },
    );
  } catch (e) {
    return failure(e);
  }
}
