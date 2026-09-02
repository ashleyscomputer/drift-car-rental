import { addBooking, bookings } from '@/lib/store';

export async function GET() {
  return Response.json(bookings);
}

export async function POST(request: Request) {
  return Response.json(addBooking(await request.json()), { status: 201 });
}
