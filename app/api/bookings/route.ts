import { addBooking, bookings, rentalExtras, updateBookingStatus, vehicles } from '@/lib/store';
import { sendBookingConfirmation } from '@/lib/hostinger-mail';

export async function GET(request: Request) {
  const email = new URL(request.url).searchParams.get('email')?.trim().toLowerCase();
  return Response.json(email ? bookings.filter((booking) => booking.email.toLowerCase() === email) : bookings);
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { vehicleId:number; customer:string; email:string; startDate:string; endDate:string; pickupCity:string; returnCity:string; extras?:string[] };
    const vehicle = vehicles.find((item) => item.id === body.vehicleId);
    if (!vehicle || vehicle.status !== 'Available') return Response.json({error:'This vehicle is currently unavailable.'},{status:400});

    const start = Date.parse(body.startDate);
    const end = Date.parse(body.endDate);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return Response.json({error:'Choose valid rental dates.'},{status:400});

    const hasConflict = bookings.some((booking) => booking.vehicleId === body.vehicleId && booking.status !== 'Cancelled' && Date.parse(booking.startDate) <= end && Date.parse(booking.endDate) >= start);
    if (hasConflict) return Response.json({error:'This vehicle is already reserved for part of those dates. Choose different dates.'},{status:409});

    if (typeof body.customer !== 'string' || !body.customer.trim() || typeof body.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) return Response.json({error:'Enter your name and email.'},{status:400});
    const cities = ['Kimberley','Upington','Bloemfontein','Johannesburg','Cape Town'];
    if (!cities.includes(body.pickupCity) || !cities.includes(body.returnCity)) return Response.json({error:'Choose valid branches.'},{status:400});

    const days = Math.max(1, Math.ceil((end-start)/86400000));
    const selectedIds = [...new Set(Array.isArray(body.extras) ? body.extras : [])];
    const selectedExtras = selectedIds.map((id) => rentalExtras.find((extra) => extra.id === id)).filter((extra): extra is NonNullable<typeof extra> => Boolean(extra));
    if (selectedExtras.length !== selectedIds.length) return Response.json({error:'One or more rental extras are invalid.'},{status:400});
    const extrasCost = selectedExtras.reduce((sum, extra) => sum + (extra.pricing === 'daily' ? extra.price * days : extra.price), 0);
    const totalCost = days * vehicle.dailyRate + extrasCost;

    const booking = addBooking({
      customer:body.customer.trim(),
      email:body.email.toLowerCase(),
      vehicleId:vehicle.id,
      vehicle:`${vehicle.brand} ${vehicle.model}`,
      startDate:body.startDate,
      endDate:body.endDate,
      pickupCity:body.pickupCity,
      returnCity:body.returnCity,
      extras:selectedExtras.map((extra) => extra.label),
      extrasCost,
      totalCost,
    });
    const emailSent = await sendBookingConfirmation(booking).catch(() => false);
    return Response.json({...booking,emailSent},{status:201});
  } catch {
    return Response.json({error:'Invalid booking request.'},{status:400});
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json() as { id?: string; status?: 'Confirmed' | 'Pending' | 'Completed' | 'Cancelled' };
    const allowed = ['Confirmed','Pending','Completed','Cancelled'] as const;
    if (!body.id || !body.status || !allowed.includes(body.status)) return Response.json({error:'Choose a valid booking status.'},{status:400});
    const booking = updateBookingStatus(body.id, body.status);
    if (!booking) return Response.json({error:'Booking not found.'},{status:404});
    return Response.json(booking);
  } catch {
    return Response.json({error:'Invalid booking update.'},{status:400});
  }
}