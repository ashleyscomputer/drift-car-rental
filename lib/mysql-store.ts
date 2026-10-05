import type { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { databaseConfigured, getPool, queryRows, withTransaction } from '@/lib/db';
import {
  addBooking as addMemoryBooking,
  addVehicle as addMemoryVehicle,
  bookings as memoryBookings,
  deleteVehicle as deleteMemoryVehicle,
  rentalExtras as seedRentalExtras,
  updateBookingStatus as updateMemoryBookingStatus,
  updateVehicle as updateMemoryVehicle,
  vehicles as seedVehicles,
  type Booking,
  type Vehicle,
} from '@/lib/store';

const cities = ['Kimberley', 'Upington', 'Bloemfontein', 'Johannesburg', 'Cape Town'] as const;
const cityProvince: Record<(typeof cities)[number], string> = {
  Kimberley: 'Northern Cape',
  Upington: 'Northern Cape',
  Bloemfontein: 'Free State',
  Johannesburg: 'Gauteng',
  'Cape Town': 'Western Cape',
};

let seeded = false;

function deriveTier(rate: number): 'Value' | 'Comfort' | 'Premium' {
  if (rate < 600) return 'Value';
  if (rate < 1500) return 'Comfort';
  return 'Premium';
}

function normalizeType(value: string): Vehicle['type'] {
  return ['Hatchback', 'Sedan', 'SUV', 'Bakkie', 'Van'].includes(value) ? value as Vehicle['type'] : 'Sedan';
}

async function idFor(connection: import('mysql2/promise').PoolConnection, sql: string, params: unknown[], idColumn: string) {
  const [rows] = await connection.query<RowDataPacket[]>(sql, params);
  const id = Number(rows[0]?.[idColumn]);
  if (!id) throw new Error(`Could not resolve ${idColumn}.`);
  return id;
}

export async function ensureReferenceData() {
  if (!databaseConfigured() || seeded || process.env.DRIFT_DB_AUTO_SEED === 'false') return;
  await withTransaction(async (connection) => {
    const [countRows] = await connection.query<RowDataPacket[]>(`SELECT COUNT(*) AS total FROM vehicle`);
    if (Number(countRows[0]?.total || 0) > 0) {
      seeded = true;
      return;
    }

    for (const province of [...new Set(Object.values(cityProvince))]) {
      await connection.execute(`INSERT INTO province (province_name) VALUES (?) ON DUPLICATE KEY UPDATE province_name = VALUES(province_name)`, [province]);
    }

    const branchIds = new Map<string, number>();
    for (const city of cities) {
      const provinceId = await idFor(connection, `SELECT province_id FROM province WHERE province_name = ? LIMIT 1`, [cityProvince[city]], 'province_id');
      await connection.execute(`INSERT INTO city (city_name, province_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE province_id = VALUES(province_id)`, [city, provinceId]);
      const cityId = await idFor(connection, `SELECT city_id FROM city WHERE city_name = ? AND province_id = ? LIMIT 1`, [city, provinceId], 'city_id');
      const branchName = `${city} Branch`;
      await connection.execute(
        `INSERT INTO branch (branch_name, city_id, is_active) VALUES (?, ?, 1)
         ON DUPLICATE KEY UPDATE is_active = 1`,
        [branchName, cityId],
      );
      const branchId = await idFor(connection, `SELECT branch_id FROM branch WHERE branch_name = ? AND city_id = ? LIMIT 1`, [branchName, cityId], 'branch_id');
      branchIds.set(city, branchId);
    }

    for (const extra of seedRentalExtras) {
      await connection.execute(
        `INSERT INTO rentalextra (extra_code, extra_name, description, price, pricing_type, is_active)
         VALUES (?, ?, ?, ?, ?, 1)
         ON DUPLICATE KEY UPDATE extra_name = VALUES(extra_name), price = VALUES(price), pricing_type = VALUES(pricing_type), is_active = 1`,
        [extra.id, extra.label, `${extra.label} rental option`, extra.price, extra.pricing === 'daily' ? 'daily' : 'once'],
      );
    }

    for (const vehicle of seedVehicles) {
      await connection.execute(`INSERT INTO vehiclecategory (category_name) VALUES (?) ON DUPLICATE KEY UPDATE category_name = VALUES(category_name)`, [vehicle.type]);
      const categoryId = await idFor(connection, `SELECT category_id FROM vehiclecategory WHERE category_name = ? LIMIT 1`, [vehicle.type], 'category_id');
      await connection.execute(
        `INSERT INTO vehiclemodel (brand, model_name, category_id) VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE category_id = VALUES(category_id)`,
        [vehicle.brand, vehicle.model, categoryId],
      );
      const modelId = await idFor(connection, `SELECT model_id FROM vehiclemodel WHERE brand = ? AND model_name = ? LIMIT 1`, [vehicle.brand, vehicle.model], 'model_id');
      const branchCity = cities[(vehicle.id - 1) % cities.length];
      const branchId = branchIds.get(branchCity)!;
      await connection.execute(
        `INSERT INTO vehicle
          (vehicle_id, model_id, branch_id, registration_no, year, transmission, doors, colour, description, tier, daily_rate, status, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
         ON DUPLICATE KEY UPDATE
          model_id = VALUES(model_id), branch_id = VALUES(branch_id), registration_no = VALUES(registration_no), year = VALUES(year),
          transmission = VALUES(transmission), doors = VALUES(doors), colour = VALUES(colour), description = VALUES(description),
          tier = VALUES(tier), daily_rate = VALUES(daily_rate), status = VALUES(status), is_active = 1`,
        [vehicle.id, modelId, branchId, vehicle.registration, vehicle.year, vehicle.transmission, vehicle.doors, vehicle.colour, vehicle.description, deriveTier(vehicle.dailyRate), vehicle.dailyRate, vehicle.status],
      );
      await connection.execute(
        `INSERT INTO vehicleimage (vehicle_id, image_url, alt_text, is_primary, sort_order)
         VALUES (?, ?, ?, 1, 0)
         ON DUPLICATE KEY UPDATE image_url = VALUES(image_url), alt_text = VALUES(alt_text)`,
        [vehicle.id, vehicle.image, `${vehicle.brand} ${vehicle.model}`],
      );
      for (const feature of vehicle.features) {
        await connection.execute(`INSERT INTO feature (feature_name) VALUES (?) ON DUPLICATE KEY UPDATE feature_name = VALUES(feature_name)`, [feature]);
        const featureId = await idFor(connection, `SELECT feature_id FROM feature WHERE feature_name = ? LIMIT 1`, [feature], 'feature_id');
        await connection.execute(`INSERT IGNORE INTO vehiclefeature (vehicle_id, feature_id) VALUES (?, ?)`, [vehicle.id, featureId]);
      }
    }
    seeded = true;
  });
}

type VehicleRow = RowDataPacket & {
  vehicle_id: number;
  brand: string;
  model_name: string;
  category_name: string;
  registration_no: string;
  year: number;
  transmission: Vehicle['transmission'];
  doors: number;
  colour: string | null;
  description: string | null;
  daily_rate: string | number;
  status: Vehicle['status'];
  image_url: string | null;
  features: string | null;
};

function rowToVehicle(row: VehicleRow): Vehicle {
  return {
    id: Number(row.vehicle_id),
    brand: row.brand,
    model: row.model_name,
    year: Number(row.year),
    type: normalizeType(row.category_name),
    registration: row.registration_no,
    dailyRate: Number(row.daily_rate),
    transmission: row.transmission,
    doors: Number(row.doors),
    colour: row.colour || '',
    status: row.status,
    features: row.features ? row.features.split('||').filter(Boolean) : [],
    image: row.image_url || '/og.png',
    description: row.description || '',
  };
}

export async function listVehicles(): Promise<Vehicle[]> {
  if (!databaseConfigured()) return seedVehicles;
  await ensureReferenceData();
  const rows = await queryRows<VehicleRow[]>(`
    SELECT v.vehicle_id, vm.brand, vm.model_name, vc.category_name, v.registration_no, v.year, v.transmission,
           v.doors, v.colour, v.description, v.daily_rate, v.status,
           (SELECT vi.image_url FROM vehicleimage vi WHERE vi.vehicle_id = v.vehicle_id ORDER BY vi.is_primary DESC, vi.sort_order ASC, vi.image_id ASC LIMIT 1) AS image_url,
           (SELECT GROUP_CONCAT(f.feature_name ORDER BY f.feature_name SEPARATOR '||')
              FROM vehiclefeature vf JOIN feature f ON f.feature_id = vf.feature_id
             WHERE vf.vehicle_id = v.vehicle_id) AS features
      FROM vehicle v
      JOIN vehiclemodel vm ON vm.model_id = v.model_id
      JOIN vehiclecategory vc ON vc.category_id = vm.category_id
     WHERE v.is_active = 1
     ORDER BY v.vehicle_id ASC
  `);
  return rows.map(rowToVehicle);
}

async function resolveCategoryAndModel(connection: import('mysql2/promise').PoolConnection, vehicle: Omit<Vehicle, 'id'> | Vehicle) {
  await connection.execute(`INSERT INTO vehiclecategory (category_name) VALUES (?) ON DUPLICATE KEY UPDATE category_name = VALUES(category_name)`, [vehicle.type]);
  const categoryId = await idFor(connection, `SELECT category_id FROM vehiclecategory WHERE category_name = ? LIMIT 1`, [vehicle.type], 'category_id');
  await connection.execute(
    `INSERT INTO vehiclemodel (brand, model_name, category_id) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE category_id = VALUES(category_id)`,
    [vehicle.brand, vehicle.model, categoryId],
  );
  return idFor(connection, `SELECT model_id FROM vehiclemodel WHERE brand = ? AND model_name = ? LIMIT 1`, [vehicle.brand, vehicle.model], 'model_id');
}

async function firstBranchId(connection: import('mysql2/promise').PoolConnection) {
  const [rows] = await connection.query<RowDataPacket[]>(`SELECT branch_id FROM branch WHERE is_active = 1 ORDER BY branch_id LIMIT 1`);
  const id = Number(rows[0]?.branch_id);
  if (!id) throw new Error('Create at least one active branch before adding vehicles.');
  return id;
}

async function saveVehicleRelations(connection: import('mysql2/promise').PoolConnection, id: number, vehicle: Omit<Vehicle, 'id'> | Vehicle) {
  await connection.execute(`DELETE FROM vehiclefeature WHERE vehicle_id = ?`, [id]);
  for (const feature of vehicle.features || []) {
    await connection.execute(`INSERT INTO feature (feature_name) VALUES (?) ON DUPLICATE KEY UPDATE feature_name = VALUES(feature_name)`, [feature]);
    const featureId = await idFor(connection, `SELECT feature_id FROM feature WHERE feature_name = ? LIMIT 1`, [feature], 'feature_id');
    await connection.execute(`INSERT IGNORE INTO vehiclefeature (vehicle_id, feature_id) VALUES (?, ?)`, [id, featureId]);
  }
  await connection.execute(`DELETE FROM vehicleimage WHERE vehicle_id = ? AND is_primary = 1`, [id]);
  await connection.execute(
    `INSERT INTO vehicleimage (vehicle_id, image_url, alt_text, is_primary, sort_order) VALUES (?, ?, ?, 1, 0)`,
    [id, vehicle.image || '/og.png', `${vehicle.brand} ${vehicle.model}`],
  );
}

export async function createVehicle(vehicle: Omit<Vehicle, 'id'>) {
  if (!databaseConfigured()) return addMemoryVehicle(vehicle);
  await ensureReferenceData();
  const id = await withTransaction(async (connection) => {
    const modelId = await resolveCategoryAndModel(connection, vehicle);
    const branchId = await firstBranchId(connection);
    const [result] = await connection.execute<ResultSetHeader>(
      `INSERT INTO vehicle (model_id, branch_id, registration_no, year, transmission, doors, colour, description, tier, daily_rate, status, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [modelId, branchId, vehicle.registration, vehicle.year, vehicle.transmission, vehicle.doors, vehicle.colour, vehicle.description, deriveTier(vehicle.dailyRate), vehicle.dailyRate, vehicle.status],
    );
    await saveVehicleRelations(connection, result.insertId, vehicle);
    return result.insertId;
  });
  return (await listVehicles()).find((item) => item.id === id)!;
}

export async function saveVehicle(vehicle: Vehicle) {
  if (!databaseConfigured()) return updateMemoryVehicle(vehicle);
  await ensureReferenceData();
  await withTransaction(async (connection) => {
    const modelId = await resolveCategoryAndModel(connection, vehicle);
    await connection.execute(
      `UPDATE vehicle SET model_id = ?, registration_no = ?, year = ?, transmission = ?, doors = ?, colour = ?, description = ?, tier = ?, daily_rate = ?, status = ?, is_active = 1
       WHERE vehicle_id = ?`,
      [modelId, vehicle.registration, vehicle.year, vehicle.transmission, vehicle.doors, vehicle.colour, vehicle.description, deriveTier(vehicle.dailyRate), vehicle.dailyRate, vehicle.status, vehicle.id],
    );
    await saveVehicleRelations(connection, vehicle.id, vehicle);
  });
  return (await listVehicles()).find((item) => item.id === vehicle.id) || vehicle;
}

export async function archiveVehicle(id: number) {
  if (!databaseConfigured()) {
    deleteMemoryVehicle(id);
    return;
  }
  await getPool().execute(`UPDATE vehicle SET is_active = 0 WHERE vehicle_id = ?`, [id]);
}

type BookingRow = RowDataPacket & {
  booking_id: number;
  booking_reference: string;
  customer_name: string;
  customer_email: string;
  vehicle_id: number;
  vehicle_name_snapshot: string;
  start_date: string | Date;
  end_date: string | Date;
  pickup_city: string;
  return_city: string;
  extras: string | null;
  extras_total: string | number;
  total_cost: string | number;
  status: Booking['status'];
};

const dateOnly = (value: string | Date) => value instanceof Date ? value.toISOString().slice(0, 10) : String(value).slice(0, 10);

function rowToBooking(row: BookingRow): Booking {
  return {
    id: row.booking_reference,
    customer: row.customer_name,
    email: row.customer_email,
    vehicleId: Number(row.vehicle_id),
    vehicle: row.vehicle_name_snapshot,
    startDate: dateOnly(row.start_date),
    endDate: dateOnly(row.end_date),
    pickupCity: row.pickup_city,
    returnCity: row.return_city,
    extras: row.extras ? row.extras.split('||').filter(Boolean) : [],
    extrasCost: Number(row.extras_total || 0),
    totalCost: Number(row.total_cost || 0),
    status: row.status,
  };
}

const BOOKING_SELECT = `
  SELECT b.booking_id, b.booking_reference, b.customer_name, b.customer_email, b.vehicle_id, b.vehicle_name_snapshot,
         b.start_date, b.end_date, pc.city_name AS pickup_city, rc.city_name AS return_city,
         b.extras_total, b.total_cost, b.status,
         (SELECT GROUP_CONCAT(be.extra_name_snapshot ORDER BY be.booking_extra_id SEPARATOR '||') FROM bookingextra be WHERE be.booking_id = b.booking_id) AS extras
    FROM booking b
    JOIN branch pb ON pb.branch_id = b.pickup_branch_id
    JOIN city pc ON pc.city_id = pb.city_id
    JOIN branch rb ON rb.branch_id = b.return_branch_id
    JOIN city rc ON rc.city_id = rb.city_id`;

export async function listBookings(email?: string): Promise<Booking[]> {
  if (!databaseConfigured()) return email ? memoryBookings.filter((item) => item.email.toLowerCase() === email.toLowerCase()) : memoryBookings;
  await ensureReferenceData();
  const params: unknown[] = [];
  let where = '';
  if (email) {
    where = ` WHERE LOWER(b.customer_email) = LOWER(?)`;
    params.push(email);
  }
  const rows = await queryRows<BookingRow[]>(`${BOOKING_SELECT}${where} ORDER BY b.created_at DESC`, params);
  return rows.map(rowToBooking);
}

function splitName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return { first: parts.shift() || 'Customer', last: parts.join(' ') || 'Customer' };
}

function reference() {
  return `DRIFT-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0, 4).toUpperCase()}`;
}

export type BookingInput = {
  vehicleId: number;
  customer: string;
  email: string;
  startDate: string;
  endDate: string;
  pickupCity: string;
  returnCity: string;
  extras?: string[];
};

export async function createBooking(input: BookingInput): Promise<Booking> {
  if (!databaseConfigured()) {
    const vehicle = seedVehicles.find((item) => item.id === input.vehicleId);
    if (!vehicle) throw new Error('Vehicle not found.');
    const start = Date.parse(input.startDate);
    const end = Date.parse(input.endDate);
    const days = Math.max(1, Math.ceil((end - start) / 86400000));
    const selectedExtras = seedRentalExtras.filter((extra) => (input.extras || []).includes(extra.id));
    const extrasCost = selectedExtras.reduce((sum, extra) => sum + (extra.pricing === 'daily' ? extra.price * days : extra.price), 0);
    return addMemoryBooking({ customer: input.customer, email: input.email, vehicleId: vehicle.id, vehicle: `${vehicle.brand} ${vehicle.model}`, startDate: input.startDate, endDate: input.endDate, pickupCity: input.pickupCity, returnCity: input.returnCity, extras: selectedExtras.map((item) => item.label), extrasCost, totalCost: vehicle.dailyRate * days + extrasCost });
  }

  await ensureReferenceData();
  const bookingReference = reference();
  return withTransaction(async (connection) => {
    const [vehicleRows] = await connection.query<RowDataPacket[]>(`
      SELECT v.vehicle_id, v.daily_rate, v.status, vm.brand, vm.model_name
      FROM vehicle v JOIN vehiclemodel vm ON vm.model_id = v.model_id
      WHERE v.vehicle_id = ? AND v.is_active = 1 FOR UPDATE`, [input.vehicleId]);
    const vehicle = vehicleRows[0];
    if (!vehicle || vehicle.status !== 'Available') throw new Error('This vehicle is currently unavailable.');

    const [conflicts] = await connection.query<RowDataPacket[]>(`
      SELECT booking_id FROM booking
      WHERE vehicle_id = ? AND status <> 'Cancelled' AND start_date <= ? AND end_date >= ? LIMIT 1 FOR UPDATE`,
      [input.vehicleId, input.endDate, input.startDate],
    );
    if (conflicts.length) throw new Error('This vehicle is already reserved for part of those dates. Choose different dates.');

    const [pickupRows] = await connection.query<RowDataPacket[]>(`
      SELECT b.branch_id FROM branch b JOIN city c ON c.city_id = b.city_id WHERE b.is_active = 1 AND c.city_name = ? ORDER BY b.branch_id LIMIT 1`, [input.pickupCity]);
    const [returnRows] = await connection.query<RowDataPacket[]>(`
      SELECT b.branch_id FROM branch b JOIN city c ON c.city_id = b.city_id WHERE b.is_active = 1 AND c.city_name = ? ORDER BY b.branch_id LIMIT 1`, [input.returnCity]);
    if (!pickupRows[0] || !returnRows[0]) throw new Error('Choose valid rental branches.');

    const names = splitName(input.customer);
    await connection.execute(
      `INSERT INTO customer (first_name, last_name, email) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE first_name = VALUES(first_name), last_name = VALUES(last_name)`,
      [names.first, names.last, input.email.toLowerCase()],
    );
    const customerId = await idFor(connection, `SELECT customer_id FROM customer WHERE email = ? LIMIT 1`, [input.email.toLowerCase()], 'customer_id');

    const start = new Date(`${input.startDate}T00:00:00Z`);
    const end = new Date(`${input.endDate}T00:00:00Z`);
    const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000));
    const selectedCodes = [...new Set(input.extras || [])];
    let extraRows: RowDataPacket[] = [];
    if (selectedCodes.length) {
      const placeholders = selectedCodes.map(() => '?').join(',');
      const [rows] = await connection.query<RowDataPacket[]>(`SELECT extra_id, extra_code, extra_name, price, pricing_type FROM rentalextra WHERE is_active = 1 AND extra_code IN (${placeholders})`, selectedCodes);
      extraRows = rows;
      if (rows.length !== selectedCodes.length) throw new Error('One or more rental extras are invalid.');
    }
    const extrasTotal = extraRows.reduce((sum, extra) => sum + Number(extra.price) * (extra.pricing_type === 'daily' ? days : 1), 0);
    const [insert] = await connection.execute<ResultSetHeader>(
      `INSERT INTO booking
       (booking_reference, idempotency_key, customer_id, customer_name, customer_email, vehicle_id, vehicle_name_snapshot,
        pickup_branch_id, return_branch_id, start_date, end_date, daily_rate_applied, extras_total, status, is_demo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Confirmed', 0)`,
      [bookingReference, crypto.randomUUID(), customerId, input.customer.trim(), input.email.toLowerCase(), input.vehicleId, `${vehicle.brand} ${vehicle.model_name}`, pickupRows[0].branch_id, returnRows[0].branch_id, input.startDate, input.endDate, Number(vehicle.daily_rate), extrasTotal],
    );
    for (const extra of extraRows) {
      await connection.execute(
        `INSERT INTO bookingextra (booking_id, extra_id, extra_name_snapshot, pricing_type, unit_price, quantity, charged_days)
         VALUES (?, ?, ?, ?, ?, 1, ?)`,
        [insert.insertId, extra.extra_id, extra.extra_name, extra.pricing_type, Number(extra.price), extra.pricing_type === 'daily' ? days : 1],
      );
    }
    await connection.execute(`INSERT INTO bookingstatushistory (booking_id, old_status, new_status, reason) VALUES (?, NULL, 'Confirmed', 'Booking created')`, [insert.insertId]);
    const [rows] = await connection.query<BookingRow[]>(`${BOOKING_SELECT} WHERE b.booking_id = ? LIMIT 1`, [insert.insertId]);
    return rowToBooking(rows[0]);
  });
}

export async function setBookingStatus(id: string, status: Booking['status']) {
  if (!databaseConfigured()) return updateMemoryBookingStatus(id, status);
  return withTransaction(async (connection) => {
    const [rows] = await connection.query<RowDataPacket[]>(`SELECT booking_id, status FROM booking WHERE booking_reference = ? FOR UPDATE`, [id]);
    if (!rows[0]) return null;
    const oldStatus = rows[0].status as Booking['status'];
    await connection.execute(`UPDATE booking SET status = ? WHERE booking_id = ?`, [status, rows[0].booking_id]);
    await connection.execute(`INSERT INTO bookingstatushistory (booking_id, old_status, new_status, reason) VALUES (?, ?, ?, ?)`, [rows[0].booking_id, oldStatus, status, 'Status changed in Drift admin/client workflow']);
    if (status === 'Cancellation Requested') {
      await connection.execute(
        `INSERT INTO cancellationrequest (booking_id, reason, status) VALUES (?, 'Customer requested cancellation', 'Pending')
         ON DUPLICATE KEY UPDATE reason = VALUES(reason)`,
        [rows[0].booking_id],
      ).catch(() => undefined);
    }
    const [updated] = await connection.query<BookingRow[]>(`${BOOKING_SELECT} WHERE b.booking_id = ? LIMIT 1`, [rows[0].booking_id]);
    return rowToBooking(updated[0]);
  });
}

export async function getBookingByReference(id: string) {
  if (!databaseConfigured()) return memoryBookings.find((item) => item.id === id) || null;
  const rows = await queryRows<BookingRow[]>(`${BOOKING_SELECT} WHERE b.booking_reference = ? LIMIT 1`, [id]);
  return rows[0] ? rowToBooking(rows[0]) : null;
}

export async function getReportSnapshot() {
  const [bookings, vehicles] = await Promise.all([listBookings(), listVehicles()]);
  const validBookings = bookings.filter((booking) => booking.status !== 'Cancelled');
  const totalRevenue = validBookings.reduce((sum, booking) => sum + booking.totalCost, 0);
  const available = vehicles.filter((vehicle) => vehicle.status === 'Available').length;
  const monthly = validBookings.reduce<Record<string, number>>((acc, booking) => {
    const key = booking.startDate.slice(0, 7);
    acc[key] = (acc[key] || 0) + booking.totalCost;
    return acc;
  }, {});
  const bookingStatus = bookings.reduce<Record<string, number>>((acc, booking) => {
    acc[booking.status] = (acc[booking.status] || 0) + 1;
    return acc;
  }, {});
  const topVehicles = vehicles
    .map((vehicle) => ({ name: `${vehicle.brand} ${vehicle.model}`, bookings: bookings.filter((booking) => booking.vehicleId === vehicle.id).length }))
    .filter((item) => item.bookings > 0)
    .sort((a, b) => b.bookings - a.bookings)
    .slice(0, 6);
  return {
    generatedAt: new Date().toISOString(),
    revenue: { total: totalRevenue, monthly },
    fleet: { total: vehicles.length, available, utilisation: Math.round(((vehicles.length - available) / Math.max(vehicles.length, 1)) * 100) },
    bookingStatus,
    topVehicles,
    bookingCount: bookings.length,
    activeBookings: bookings.filter((booking) => ['Confirmed', 'Pending', 'Cancellation Requested'].includes(booking.status)).length,
  };
}
