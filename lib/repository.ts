import { rows, write, transaction } from './mysql';
import { HttpError, type SessionUser } from './server-auth';
import type { Vehicle, Booking, RentalExtra } from './store';
import { randomUUID } from 'node:crypto';
export async function listVehicles(): Promise<Vehicle[]> {
  const vehicles = await rows<Vehicle>(
    `SELECT v.vehicle_id id,m.brand,m.model_name model,v.year,c.category_name type,v.registration_no registration,v.daily_rate dailyRate,v.transmission,v.doors,COALESCE(v.colour,'') colour,v.status,v.tier,COALESCE(v.description,'') description,v.branch_id branchId,b.branch_name branchName,(SELECT AVG(r.rating) FROM VehicleReview r JOIN Booking bk ON bk.booking_id=r.booking_id WHERE bk.vehicle_id=v.vehicle_id AND r.is_published=1) rating FROM Vehicle v JOIN VehicleModel m ON m.model_id=v.model_id JOIN VehicleCategory c ON c.category_id=m.category_id JOIN Branch b ON b.branch_id=v.branch_id WHERE v.is_active=1 ORDER BY v.vehicle_id`,
  );
  const images = await rows<{ vehicleId: number; url: string }>(
    'SELECT vehicle_id vehicleId,image_url url FROM VehicleImage ORDER BY is_primary DESC,sort_order,image_id',
  );
  const features = await rows<{ vehicleId: number; name: string }>(
    'SELECT vf.vehicle_id vehicleId,f.feature_name name FROM VehicleFeature vf JOIN Feature f ON f.feature_id=vf.feature_id',
  );
  return vehicles.map((v) => ({
    ...v,
    rating: v.rating == null ? null : Number(v.rating),
    images: images.filter((i) => i.vehicleId === v.id).map((i) => i.url),
    image: images.find((i) => i.vehicleId === v.id)?.url || '',
    features: features.filter((f) => f.vehicleId === v.id).map((f) => f.name),
  }));
}
export async function catalogue() {
  return {
    branches: await rows<{ id: number; name: string; city: string }>(
      'SELECT b.branch_id id,b.branch_name name,c.city_name city FROM Branch b JOIN City c ON c.city_id=b.city_id WHERE b.is_active=1 ORDER BY b.branch_name',
    ),
    extras: await rows<RentalExtra>(
      `SELECT extra_code id,extra_name label,price,IF(pricing_type='daily','daily','flat') pricing FROM RentalExtra WHERE is_active=1`,
    ),
  };
}
export async function listBookings(user: SessionUser): Promise<Booking[]> {
  const bookings = await rows<Booking & { bookingId: number }>(
    `SELECT bk.booking_id bookingId,bk.booking_reference id,bk.customer_name customer,bk.customer_email email,bk.vehicle_id vehicleId,bk.vehicle_name_snapshot vehicle,bk.start_date startDate,bk.end_date endDate,pc.city_name pickupCity,rc.city_name returnCity,bk.extras_total extrasCost,bk.total_cost totalCost,bk.status,(SELECT p.status FROM Payment p WHERE p.booking_id=bk.booking_id ORDER BY p.payment_id DESC LIMIT 1) paymentStatus FROM Booking bk JOIN Branch pb ON pb.branch_id=bk.pickup_branch_id JOIN City pc ON pc.city_id=pb.city_id JOIN Branch rb ON rb.branch_id=bk.return_branch_id JOIN City rc ON rc.city_id=rb.city_id ${user.role === 'admin' ? '' : 'WHERE bk.customer_id=?'} ORDER BY bk.created_at DESC`,
    user.role === 'admin' ? [] : [user.customerId],
  );
  if (!bookings.length) return [];
  const extras = await rows<{ bookingId: number; label: string }>(
    'SELECT booking_id bookingId,extra_name_snapshot label FROM BookingExtra',
  );
  return bookings.map((b) => ({
    ...b,
    extras: extras
      .filter((e) => e.bookingId === b.bookingId)
      .map((e) => e.label),
  }));
}
export type BookingInput = {
  vehicleId: number;
  startDate: string;
  endDate: string;
  pickupBranchId: number;
  returnBranchId: number;
  extras: string[];
  idempotencyKey: string;
  expectedTotal: number;
};
export async function book(input: BookingInput, user: SessionUser) {
  if (
    !Number.isInteger(input.vehicleId) ||
    !Number.isInteger(input.pickupBranchId) ||
    !Number.isInteger(input.returnBranchId) ||
    !Array.isArray(input.extras) ||
    input.extras.length > 50 ||
    !Number.isFinite(input.expectedTotal)
  )
    throw new HttpError(400, 'Invalid checkout details.');
  if (!user.customerId)
    throw new HttpError(400, 'Use a customer account to make a booking.');
  if (!/^[0-9a-f-]{36}$/i.test(input.idempotencyKey || ''))
    throw new HttpError(400, 'Invalid checkout reference.');
  const validDate = (value: string) =>
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value;
  if (
    !validDate(input.startDate) ||
    !validDate(input.endDate) ||
    input.endDate < input.startDate ||
    input.startDate < new Date().toISOString().slice(0, 10)
  )
    throw new HttpError(400, 'Choose valid current or future rental dates.');
  const result = await transaction(async (c) => {
    const [vehicle] = await rows<{
      daily_rate: number;
      status: string;
      branch_id: number;
      name: string;
    }>(
      `SELECT v.daily_rate,v.status,v.branch_id,CONCAT(m.brand,' ',m.model_name) name FROM Vehicle v JOIN VehicleModel m ON m.model_id=v.model_id WHERE v.vehicle_id=? AND v.is_active=1 FOR UPDATE`,
      [input.vehicleId],
      c,
    );
    const previous = await rows<{
      customer_id: number;
      booking_reference: string;
      total_cost: number;
      vehicle_id: number;
      start_date: string;
      end_date: string;
      pickup_branch_id: number;
      return_branch_id: number;
      vehicle_name_snapshot: string;
      extras_total: number;
    }>(
      'SELECT customer_id,booking_reference,total_cost,vehicle_id,start_date,end_date,pickup_branch_id,return_branch_id,vehicle_name_snapshot,extras_total FROM Booking WHERE idempotency_key=? FOR UPDATE',
      [input.idempotencyKey],
      c,
    );
    if (previous[0]) {
      if (
        previous[0].customer_id !== user.customerId ||
        previous[0].vehicle_id !== input.vehicleId ||
        previous[0].start_date !== input.startDate ||
        previous[0].end_date !== input.endDate ||
        previous[0].pickup_branch_id !== input.pickupBranchId ||
        previous[0].return_branch_id !== input.returnBranchId ||
        previous[0].total_cost !== input.expectedTotal
      )
        throw new HttpError(409, 'Checkout reference is already used.');
      return {
        id: previous[0].booking_reference,
        totalCost: previous[0].total_cost,
        vehicle: previous[0].vehicle_name_snapshot,
        extrasCost: previous[0].extras_total,
      };
    }
    if (
      !vehicle ||
      vehicle.status === 'Maintenance' ||
      vehicle.status === 'Rented'
    )
      throw new HttpError(409, 'Vehicle unavailable.');
    if (vehicle.branch_id !== Number(input.pickupBranchId))
      throw new HttpError(400, 'Select the vehicle pickup branch.');
    const branches = await rows<{ branch_id: number }>(
      'SELECT branch_id FROM Branch WHERE is_active=1 AND branch_id IN (?,?)',
      [input.pickupBranchId, input.returnBranchId],
      c,
    );
    if (
      !branches.some((b) => b.branch_id === Number(input.returnBranchId)) ||
      !branches.some((b) => b.branch_id === Number(input.pickupBranchId))
    )
      throw new HttpError(400, 'Select valid branches.');
    const conflicts = await rows(
      "SELECT booking_id FROM Booking WHERE vehicle_id=? AND status NOT IN ('Cancelled','Completed') AND start_date<=? AND end_date>=? FOR UPDATE",
      [input.vehicleId, input.endDate, input.startDate],
      c,
    );
    if (conflicts.length)
      throw new HttpError(
        409,
        'The vehicle is already booked for these dates.',
      );
    const ids = [...new Set(Array.isArray(input.extras) ? input.extras : [])];
    const available = await rows<{
      extra_id: number;
      extra_code: string;
      extra_name: string;
      price: number;
      pricing_type: string;
    }>('SELECT * FROM RentalExtra WHERE is_active=1', [], c);
    const extras = ids.map((id) => available.find((e) => e.extra_code === id));
    if (extras.some((e) => !e))
      throw new HttpError(400, 'Invalid rental extra.');
    const days = Math.max(
      1,
      (Date.parse(input.endDate) - Date.parse(input.startDate)) / 86400000,
    );
    const extrasCost = extras.reduce(
      (sum, e) => sum + e!.price * (e!.pricing_type === 'daily' ? days : 1),
      0,
    );
    const id = 'BK-' + randomUUID();
    if (
      Math.abs(
        input.expectedTotal -
          Number((vehicle.daily_rate * days + extrasCost).toFixed(2)),
      ) > 0.001
    )
      throw new HttpError(
        409,
        'The price has changed. Return to the fleet and review your booking before paying.',
      );
    const created = await write(
      `INSERT INTO Booking(booking_reference,idempotency_key,customer_id,customer_name,customer_email,vehicle_id,vehicle_name_snapshot,pickup_branch_id,return_branch_id,start_date,end_date,daily_rate_applied,extras_total,status,is_demo) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,'Confirmed',0)`,
      [
        id,
        input.idempotencyKey,
        user.customerId,
        user.name,
        user.email,
        input.vehicleId,
        vehicle.name,
        input.pickupBranchId,
        input.returnBranchId,
        input.startDate,
        input.endDate,
        vehicle.daily_rate,
        extrasCost,
      ],
      c,
    );
    for (const e of extras)
      await write(
        'INSERT INTO BookingExtra(booking_id,extra_id,extra_name_snapshot,pricing_type,unit_price,charged_days) VALUES(?,?,?,?,?,?)',
        [
          created.insertId,
          e!.extra_id,
          e!.extra_name,
          e!.pricing_type,
          e!.price,
          e!.pricing_type === 'daily' ? days : 1,
        ],
        c,
      );
    const total = Number((vehicle.daily_rate * days + extrasCost).toFixed(2));
    await write(
      `INSERT INTO Payment(booking_id,idempotency_key,amount,method,status,is_demo) VALUES(?,?,?,'Demo','DemoApproved',1)`,
      [created.insertId, input.idempotencyKey, total],
      c,
    );
    await write(
      `INSERT INTO BookingStatusHistory(booking_id,new_status,changed_by) VALUES(?,'Confirmed',?)`,
      [created.insertId, user.id],
      c,
    );
    return {
      id,
      totalCost: total,
      vehicle: vehicle.name,
      extrasCost,
      extras: extras.map((e) => e!.extra_name),
    };
  });
  return { ...result, paymentStatus: 'DemoApproved', emailSent: false };
}
export async function changeBooking(
  id: string,
  status: Booking['status'],
  user: SessionUser,
) {
  return transaction(async (c) => {
    const [b] = await rows<{
      booking_id: number;
      customer_id: number;
      status: string;
      vehicle_id: number;
    }>(
      'SELECT booking_id,customer_id,status,vehicle_id FROM Booking WHERE booking_reference=? FOR UPDATE',
      [id],
      c,
    );
    if (!b) throw new HttpError(404, 'Booking not found.');
    if (
      user.role !== 'admin' &&
      (b.customer_id !== user.customerId || status !== 'Cancellation Requested')
    )
      throw new HttpError(403, 'Not allowed.');
    const transitions: Record<string, string[]> = {
      Pending: ['Confirmed', 'Cancelled', 'Cancellation Requested'],
      Confirmed: ['Completed', 'Cancelled', 'Cancellation Requested'],
      'Cancellation Requested': ['Cancelled', 'Confirmed'],
      Completed: [],
      Cancelled: [],
    };
    if (!transitions[b.status]?.includes(status))
      throw new HttpError(400, 'Invalid booking status change.');
    if (status === 'Cancellation Requested')
      await write(
        `INSERT INTO CancellationRequest(booking_id,reason) VALUES(?,'Requested by customer')`,
        [b.booking_id],
        c,
      );
    if (b.status === 'Cancellation Requested')
      await write(
        `UPDATE CancellationRequest SET status=?,reviewed_by=?,reviewed_at=UTC_TIMESTAMP() WHERE booking_id=? AND status='Pending'`,
        [
          status === 'Cancelled' ? 'Approved' : 'Rejected',
          user.id,
          b.booking_id,
        ],
        c,
      );
    await write(
      'UPDATE Booking SET status=? WHERE booking_id=?',
      [status, b.booking_id],
      c,
    );
    await write(
      'INSERT INTO BookingStatusHistory(booking_id,old_status,new_status,changed_by) VALUES(?,?,?,?)',
      [b.booking_id, b.status, status, user.id],
      c,
    );
    return { id, status };
  });
}
