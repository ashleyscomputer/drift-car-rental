import { addBooking, bookings, vehicles } from '@/lib/store';
export async function GET() { return Response.json(bookings); }
export async function POST(request: Request) {
  try {
    const body = await request.json() as {vehicleId:number; customer:string; email:string; startDate:string; endDate:string; pickupCity:string; returnCity:string};
    const vehicle = vehicles.find(v => v.id === body.vehicleId);
    if (!vehicle || vehicle.status !== 'Available') return Response.json({error:'This vehicle is unavailable.'},{status:400});
    const start = Date.parse(body.startDate), end = Date.parse(body.endDate);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return Response.json({error:'Choose valid rental dates.'},{status:400});
    if (typeof body.customer !== 'string' || !body.customer.trim() || typeof body.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) return Response.json({error:'Enter your name and email.'},{status:400});
    const cities = ['Kimberley','Upington','Bloemfontein','Johannesburg','Cape Town'];
    if (!cities.includes(body.pickupCity) || !cities.includes(body.returnCity)) return Response.json({error:'Choose valid branches.'},{status:400});
    const totalCost = Math.max(1, Math.ceil((end-start)/86400000))*vehicle.dailyRate;
    return Response.json(addBooking({customer:body.customer.trim(),email:body.email,vehicleId:vehicle.id,vehicle:`${vehicle.brand} ${vehicle.model}`,startDate:body.startDate,endDate:body.endDate,pickupCity:body.pickupCity,returnCity:body.returnCity,totalCost}),{status:201});
  } catch { return Response.json({error:'Invalid booking request.'},{status:400}); }
}
