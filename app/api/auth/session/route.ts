import { session, failure } from '@/lib/server-auth';
export async function GET(request: Request) {
  try {
    return Response.json(
      { user: await session(request) },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (e) {
    return failure(e);
  }
}
