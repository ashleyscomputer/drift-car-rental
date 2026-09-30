import { listVehicles } from '@/lib/repository';
import { saveVehicle, archiveVehicle } from '@/lib/fleet-admin';
import { requireUser, sameOrigin, failure } from '@/lib/server-auth';
export async function GET() {
  try {
    return Response.json(await listVehicles(), {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (e) {
    return failure(e);
  }
}
async function save(request: Request, updating: boolean) {
  try {
    sameOrigin(request);
    await requireUser(request, true);
    return Response.json(await saveVehicle(await request.json(), updating), {
      status: updating ? 200 : 201,
    });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(request: Request) {
  return save(request, false);
}
export async function PUT(request: Request) {
  return save(request, true);
}
export async function DELETE(request: Request) {
  try {
    sameOrigin(request);
    await requireUser(request, true);
    return Response.json(
      await archiveVehicle(
        Number(((await request.json()) as { id: number }).id),
      ),
    );
  } catch (e) {
    return failure(e);
  }
}
