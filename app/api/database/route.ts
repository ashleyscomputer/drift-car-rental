import { vehicles, bookings } from '@/lib/store';
type Table = { name: string; rows: number; fields: string[] };
let tables: Table[] = [
  { name: 'Users', rows: 4, fields: ['user_id', 'name', 'surname', 'email', 'phone', 'password', 'role'] },
  { name: 'Brands', rows: 6, fields: ['brand_id', 'brand_name'] },
  { name: 'Categories', rows: 4, fields: ['category_id', 'category_name'] },
  { name: 'Vehicles', rows: 6, fields: ['vehicle_id', 'brand_id', 'model', 'year', 'category_id', 'registration_no', 'daily_rate', 'transmission', 'doors', 'colour', 'status'] },
  { name: 'Features', rows: 10, fields: ['feature_id', 'feature_name'] },
  { name: 'Vehicle_Features', rows: 20, fields: ['vehicle_id', 'feature_id'] },
  { name: 'Bookings', rows: 4, fields: ['booking_id', 'user_id', 'vehicle_id', 'start_date', 'end_date', 'pickup_city', 'return_city', 'total_cost', 'booking_status'] },
  { name: 'Payments', rows: 4, fields: ['payment_id', 'booking_id', 'amount', 'payment_date', 'payment_status'] },
];

export async function GET() { const counts: Record<string,number> = { Users:new Set(bookings.map(b=>b.email)).size, Brands:new Set(vehicles.map(v=>v.brand)).size, Categories:new Set(vehicles.map(v=>v.type)).size, Vehicles:vehicles.length, Features:new Set(vehicles.flatMap(v=>v.features)).size, Vehicle_Features:vehicles.reduce((n,v)=>n+v.features.length,0), Bookings:bookings.length, Payments:bookings.length }; return Response.json(tables.map(t=>({...t,rows:counts[t.name]??t.rows}))); }
export async function POST(request: Request) {
  const body = await request.json() as {name:string; fields?:string[]};
  const created = { name: body.name, rows: 0, fields: body.fields || ['id'] };
  tables = [...tables, created];
  return Response.json(created, { status: 201 });
}
export async function DELETE(request: Request) {
  const { name } = await request.json() as {name:string};
  tables = tables.filter((table) => table.name !== name);
  return Response.json({ ok: true });
}
