# API reference

All endpoints return JSON. The current implementation uses in-memory records and is intended for demonstration, not untrusted production traffic.

## Vehicles

### `GET /api/vehicles`

Returns the complete fleet.

### `POST /api/vehicles`

Creates a vehicle. The server assigns the numeric `id`.

### `PUT /api/vehicles`

Replaces a vehicle matching the supplied `id`.

### `DELETE /api/vehicles`

```json
{ "id": 21 }
```

Removes the matching vehicle and returns `{ "ok": true }`.

## Bookings

### `GET /api/bookings`

Returns all demonstration bookings.

### `POST /api/bookings`

Creates a booking, assigns a reference and sets its initial status to `Confirmed`.

Example body:

```json
{
  "customer": "Demo Customer",
  "email": "demo@example.com",
  "vehicleId": 1,
  "vehicle": "Volkswagen Polo TDI",
  "startDate": "2026-09-05",
  "endDate": "2026-09-08",
  "pickupCity": "Kimberley",
  "returnCity": "Kimberley",
  "totalCost": 1185
}
```

## Demonstration database schema

### `GET /api/database`

Returns the proposed assignment tables, row counts and fields.

### `POST /api/database`

Creates an in-memory schema entry with `name` and `fields`.

### `DELETE /api/database`

```json
{ "name": "ExampleTable" }
```

## Reports

### `GET /api/reports`

Returns calculated revenue, fleet utilisation, booking-status totals and a demonstration top-vehicle list.

## Production requirements

Before exposing these endpoints publicly with persistent data, add schema validation, authentication, role authorization, rate limiting, audit logging, structured errors and database transactions.
