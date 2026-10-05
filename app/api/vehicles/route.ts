import { archiveVehicle, createVehicle, listVehicles, saveVehicle } from '@/lib/mysql-store';
import { requireAdmin } from '@/lib/server-auth';
import type { Vehicle } from '@/lib/store';

export const runtime = 'nodejs';

export async function GET() {
  try {
    return Response.json(await listVehicles());
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Unable to load fleet.' }, { status: 503 });
  }
}

export async function POST(request: Request) {
  if (!(await requireAdmin(request))) return Response.json({ error: 'Admin sign-in required.' }, { status: 401 });
  try {
    const vehicle = await request.json() as Omit<Vehicle, 'id'>;
    return Response.json(await createVehicle(vehicle), { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Unable to add vehicle.' }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  if (!(await requireAdmin(request))) return Response.json({ error: 'Admin sign-in required.' }, { status: 401 });
  try {
    const vehicle = await request.json() as Vehicle;
    return Response.json(await saveVehicle(vehicle));
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Unable to update vehicle.' }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  if (!(await requireAdmin(request))) return Response.json({ error: 'Admin sign-in required.' }, { status: 401 });
  try {
    const { id } = await request.json() as { id: number };
    await archiveVehicle(Number(id));
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Unable to archive vehicle.' }, { status: 400 });
  }
}
