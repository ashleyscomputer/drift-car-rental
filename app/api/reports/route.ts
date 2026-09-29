import { bookings, vehicles } from '@/lib/store';

export async function GET() {
  const totalRevenue = bookings.filter((b) => b.status !== 'Cancelled').reduce((sum, b) => sum + b.totalCost, 0);
  const available = vehicles.filter((v) => v.status === 'Available').length;
  return Response.json({
    revenue: { total: totalRevenue, monthly: bookings.reduce<Record<string,number>>((acc,b)=>({...acc,[b.startDate.slice(0,7)]:(acc[b.startDate.slice(0,7)]||0)+b.totalCost}),{}) },
    fleet: { total: vehicles.length, available, utilisation: Math.round(((vehicles.length - available) / vehicles.length) * 100) },
    bookingStatus: bookings.reduce<Record<string, number>>((acc, b) => ({ ...acc, [b.status]: (acc[b.status] || 0) + 1 }), {}),
    topVehicles: vehicles.map(v=>({name:`${v.brand} ${v.model}`,bookings:bookings.filter(b=>b.vehicleId===v.id).length})).filter(v=>v.bookings>0).sort((a,b)=>b.bookings-a.bookings).slice(0,4),
  });
}
