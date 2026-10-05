import type { Booking } from '@/lib/store';
import { listBookings, book, changeBooking } from '@/lib/repository';
import { requireUser, sameOrigin, failure } from '@/lib/server-auth';
export async function GET(request: Request) {
  try {
    return Response.json(await listBookings(await requireUser(request)), {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const user = await requireUser(request);
    return Response.json(await book(await request.json(), user), {
      status: 201,
    });
  } catch (e) {
    return failure(e);
  }
}
export async function PATCH(request: Request) {
  try {
    sameOrigin(request);
    const user = await requireUser(request);
    const b = (await request.json()) as {
      id: string;
      status: Booking['status'];
    };
    return Response.json(await changeBooking(b.id, b.status, user));
  } catch (e) {
    return failure(e);
  }
}
