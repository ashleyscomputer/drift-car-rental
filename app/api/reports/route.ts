import { bookings, vehicles } from '@/lib/store';

export async function GET() {
  const totalRevenue = bookings.filter((b) => b.status !== 'Cancelled').reduce((sum, b) => sum + b.totalCost, 0);
  const available = vehicles.filter((v) => v.status === 'Available').length;
  return Response.json({
    revenue: { total: totalRevenue, monthly: [8200, 12400, 11350, 15910] },
    fleet: { total: vehicles.length, available, utilisation: Math.round(((vehicles.length - available) / vehicles.length) * 100) },
    bookingStatus: bookings.reduce<Record<string, number>>((acc, b) => ({ ...acc, [b.status]: (acc[b.status] || 0) + 1 }), {}),
    topVehicles: vehicles.slice().sort((a, b) => b.dailyRate - a.dailyRate).slice(0, 4).map((v, i) => ({ name: `${v.brand} ${v.model}`, bookings: 12 - i * 2 })),
  });
}
