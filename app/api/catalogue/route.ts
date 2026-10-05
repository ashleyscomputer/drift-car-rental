import { catalogue } from '@/lib/repository';
import { addCatalogue } from '@/lib/fleet-admin';
import { requireUser, sameOrigin, failure } from '@/lib/server-auth';
export async function GET() {
  try {
    return Response.json(await catalogue(), {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    await requireUser(request, true);
    return Response.json(await addCatalogue(await request.json()), {
      status: 201,
    });
  } catch (e) {
    return failure(e);
  }
}
