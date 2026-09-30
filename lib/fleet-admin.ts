import { rows, write, transaction } from './mysql';
import { HttpError } from './server-auth';
import type { Vehicle } from './store';
export function textField(value: unknown, max: number, label: string) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max)
    throw new HttpError(400, 'Enter a valid ' + label + '.');
  return value.trim();
}
export async function saveVehicle(v: Vehicle, updating: boolean) {
  const brand = textField(v.brand, 50, 'brand'),
    model = textField(v.model, 100, 'model'),
    registration = textField(v.registration, 20, 'registration');
  if (
    !['Hatchback', 'Sedan', 'SUV', 'Bakkie', 'Van'].includes(v.type) ||
    !['Manual', 'Automatic'].includes(v.transmission) ||
    !['Available', 'Reserved', 'Rented', 'Maintenance'].includes(v.status) ||
    !['Value', 'Comfort', 'Premium'].includes(v.tier || '')
  )
    throw new HttpError(400, 'Select valid vehicle options.');
  if (
    !Number.isInteger(v.year) ||
    v.year < 1886 ||
    v.year > 2155 ||
    !Number.isInteger(v.doors) ||
    v.doors < 2 ||
    v.doors > 6 ||
    !Number.isFinite(v.dailyRate) ||
    v.dailyRate <= 0 ||
    v.dailyRate > 99999999
  )
    throw new HttpError(400, 'Enter valid year, doors and daily rate.');
  if (!Number.isInteger(v.branchId) || !v.branchId)
    throw new HttpError(400, 'Select a branch.');
  if (
    typeof v.colour !== 'string' ||
    v.colour.length > 60 ||
    typeof v.description !== 'string' ||
    v.description.length > 10000
  )
    throw new HttpError(400, 'Check the colour and description.');
  if (
    typeof v.image !== 'string' ||
    v.image.length > 2048 ||
    (v.image && !v.image.startsWith('https://') && !/^\/(?!\/)/.test(v.image))
  )
    throw new HttpError(400, 'Use an HTTPS image URL or a local image path.');
  if (
    !Array.isArray(v.features) ||
    v.features.length > 50 ||
    v.features.some((f) => typeof f !== 'string' || !f.trim() || f.length > 100)
  )
    throw new HttpError(400, 'Check vehicle features.');
  return transaction(async (c) => {
    if (updating) {
      const existing = await rows(
        'SELECT vehicle_id FROM Vehicle WHERE vehicle_id=? AND is_active=1 FOR UPDATE',
        [v.id],
        c,
      );
      if (!existing.length) throw new HttpError(404, 'Vehicle not found.');
    }
    const branch = await rows(
      'SELECT branch_id FROM Branch WHERE branch_id=? AND is_active=1',
      [v.branchId!],
      c,
    );
    if (!branch.length) throw new HttpError(400, 'Branch not found.');
    await write(
      'INSERT INTO VehicleCategory(category_name) VALUES(?) ON DUPLICATE KEY UPDATE category_name=VALUES(category_name)',
      [v.type],
      c,
    );
    const [category] = await rows<{ id: number }>(
      'SELECT category_id id FROM VehicleCategory WHERE category_name=?',
      [v.type],
      c,
    );
    await write(
      'INSERT INTO VehicleModel(brand,model_name,category_id) VALUES(?,?,?) ON DUPLICATE KEY UPDATE model_name=VALUES(model_name)',
      [brand, model, category.id],
      c,
    );
    const [m] = await rows<{ id: number; category_id: number }>(
      'SELECT model_id id,category_id FROM VehicleModel WHERE brand=? AND model_name=?',
      [brand, model],
      c,
    );
    if (m.category_id !== category.id)
      throw new HttpError(409, 'This model already has a different body type.');
    const values = [
      m.id,
      v.branchId!,
      registration,
      v.year,
      v.transmission,
      v.doors,
      v.colour,
      v.description,
      v.tier!,
      v.dailyRate,
      v.status,
    ];
    const result = updating
      ? await write(
          'UPDATE Vehicle SET model_id=?,branch_id=?,registration_no=?,year=?,transmission=?,doors=?,colour=?,description=?,tier=?,daily_rate=?,status=? WHERE vehicle_id=?',
          [...values, v.id],
          c,
        )
      : await write(
          'INSERT INTO Vehicle(model_id,branch_id,registration_no,year,transmission,doors,colour,description,tier,daily_rate,status) VALUES(?,?,?,?,?,?,?,?,?,?,?)',
          values,
          c,
        );
    const id = updating ? v.id : result.insertId;
    // Preserve all additional photographs and their credits when the main image is unchanged.
    const [primary] = await rows<{ image_url: string }>(
      'SELECT image_url FROM VehicleImage WHERE vehicle_id=? AND is_primary=1',
      [id],
      c,
    );
    if (primary?.image_url !== v.image) {
      await write(
        'DELETE FROM VehicleImage WHERE vehicle_id=? AND is_primary=1',
        [id],
        c,
      );
      if (v.image)
        await write(
          'INSERT INTO VehicleImage(vehicle_id,image_url,alt_text,is_primary) VALUES(?,?,?,1)',
          [id, v.image, brand + ' ' + model],
          c,
        );
    }
    await write('DELETE FROM VehicleFeature WHERE vehicle_id=?', [id], c);
    for (const feature of new Set(v.features.map((f) => f.trim()))) {
      await write(
        'INSERT INTO Feature(feature_name) VALUES(?) ON DUPLICATE KEY UPDATE feature_name=VALUES(feature_name)',
        [feature],
        c,
      );
      await write(
        'INSERT INTO VehicleFeature(vehicle_id,feature_id) SELECT ?,feature_id FROM Feature WHERE feature_name=?',
        [id, feature],
        c,
      );
    }
    return { id };
  });
}
export async function archiveVehicle(id: number) {
  if (!Number.isInteger(id) || id < 1)
    throw new HttpError(400, 'Invalid vehicle.');
  return transaction(async (c) => {
    const found = await rows(
      'SELECT vehicle_id FROM Vehicle WHERE vehicle_id=? FOR UPDATE',
      [id],
      c,
    );
    if (!found.length) throw new HttpError(404, 'Vehicle not found.');
    const active = await rows(
      "SELECT booking_id FROM Booking WHERE vehicle_id=? AND status NOT IN ('Completed','Cancelled')",
      [id],
      c,
    );
    if (active.length)
      throw new HttpError(
        409,
        'Finish or cancel active bookings before archiving this vehicle.',
      );
    await write('UPDATE Vehicle SET is_active=0 WHERE vehicle_id=?', [id], c);
    return { ok: true };
  });
}
export async function addCatalogue(body: Record<string, unknown>) {
  return transaction(async (c) => {
    if (body.kind === 'branch') {
      const name = textField(body.name, 100, 'branch name'),
        city = textField(body.city, 80, 'city'),
        province = textField(body.province, 50, 'province'),
        address = textField(body.address, 255, 'address');
      await write(
        'INSERT INTO Province(province_name) VALUES(?) ON DUPLICATE KEY UPDATE province_name=VALUES(province_name)',
        [province],
        c,
      );
      const [p] = await rows<{ id: number }>(
        'SELECT province_id id FROM Province WHERE province_name=?',
        [province],
        c,
      );
      await write(
        'INSERT INTO City(city_name,province_id) VALUES(?,?) ON DUPLICATE KEY UPDATE city_name=VALUES(city_name)',
        [city, p.id],
        c,
      );
      const [cityRow] = await rows<{ id: number }>(
        'SELECT city_id id FROM City WHERE city_name=? AND province_id=?',
        [city, p.id],
        c,
      );
      const b = await write(
        'INSERT INTO Branch(branch_name,city_id,address_line1) VALUES(?,?,?)',
        [name, cityRow.id, address],
        c,
      );
      return { id: b.insertId };
    }
    if (body.kind === 'extra') {
      const code = textField(body.code, 50, 'extra code'),
        name = textField(body.name, 100, 'extra name');
      const price = Number(body.price);
      if (
        !Number.isFinite(price) ||
        price < 0 ||
        price > 99999999 ||
        !['daily', 'once'].includes(String(body.pricing))
      )
        throw new HttpError(400, 'Enter a valid price and pricing type.');
      const e = await write(
        'INSERT INTO RentalExtra(extra_code,extra_name,price,pricing_type) VALUES(?,?,?,?)',
        [code, name, price, String(body.pricing)],
        c,
      );
      return { id: e.insertId };
    }
    throw new HttpError(400, 'Choose a branch or rental extra.');
  });
}
