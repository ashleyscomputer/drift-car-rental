import { addVehicle, deleteVehicle, updateVehicle, vehicles, type Vehicle } from '@/lib/store';

export async function GET() {
  return Response.json(vehicles);
}

export async function POST(request: Request) {
  return Response.json(addVehicle(await request.json()), { status: 201 });
}

export async function PUT(request: Request) {
  return Response.json(updateVehicle((await request.json()) as Vehicle));
}

export async function DELETE(request: Request) {
  const { id } = await request.json();
  deleteVehicle(Number(id));
  return Response.json({ ok: true });
}
