# API reference

Responses are JSON. Mutations require a matching Origin header. Authenticated routes use the HttpOnly drift_session cookie; browser storage roles are never authoritative.

| Endpoint | Access | Behavior |
| --- | --- | --- |
| POST /api/auth/register | Public | firstName, lastName, email, password (12–128 characters), optional phone; creates customer and account |
| POST /api/auth/login | Public | email/password; starts a server session |
| GET /api/auth/session | Public | Current user or null |
| POST /api/auth/logout | Session | Revokes session and expires cookie |
| GET /api/vehicles | Public | Active stored fleet with actual images/features/review averages |
| POST /api/vehicles | Admin | Creates a vehicle |
| PUT /api/vehicles | Admin | Updates the vehicle identified by id |
| DELETE /api/vehicles | Admin | Archives id; refuses vehicles with active bookings |
| GET /api/catalogue | Public | Active branches and extras |
| POST /api/catalogue | Admin | Adds kind=branch (name, city, province, address) or kind=extra (code, name, price, pricing=daily/once) |
| GET /api/bookings | Signed in | Own bookings; administrators see all. Email query parameters do not bypass ownership. |
| POST /api/bookings | Customer-linked account | Saves reservation, extras, history and simulated payment transactionally |
| PATCH /api/bookings | Owner/admin | Owner requests cancellation; admin makes valid status transitions |
| GET /api/database/schema | Admin | Live schema: exact counts, column types, keys, indexes, CHECK constraints, FK rules and CREATE TABLE definitions; no row contents |
| GET /api/database | Admin | Real table names, fields and row counts; no table mutation endpoint |
| GET /api/reports | Admin | Paid non-demo revenue totals/months |

Booking requests contain vehicleId, startDate, endDate, pickupBranchId, returnBranchId, extras (codes), idempotencyKey (UUID), expectedTotal. Identity and prices come from the server. A changed price or overlap returns 409. Dates are inclusive for availability; charged days are max(1, end minus start).

POST /api/bookings returns paymentStatus=DemoApproved. It never accepts card information or charges money. Booking.is_demo=0 and Payment.is_demo=1. Do not represent simulated approval as paid revenue.

See lib/fleet-admin.ts for full vehicle validation and lib/repository.ts for booking transitions. Error responses expose a message, not SQL details or credentials.

GET /api/reports/pdf is admin-only and returns a downloadable PDF from a fresh database snapshot. Optional kind: summary (default), booking-value, fleet-utilisation, booking-status, top-vehicles. Reports cover all-time reservations, including cancellations; fleet counts include active vehicles only. Automatic approvals are excluded from collected payments. Invalid kinds return 400.

## Administrator-created tables

`/api/database/tables` requires an administrator session for every method; writes also require a matching Origin. Core tables cannot be accessed through this record editor.

- GET: list `custom_` tables; optional `?table=custom_name` returns columns and latest 100 records.
- POST: `{name, columns:[{name,type}]}` creates a real prefixed table with an automatic `id` primary key. Types: text, number, decimal, date; 1-8 columns.
- PATCH: `{table, values, id?}` inserts or updates a record. Blank fields become NULL. Identifiers and numeric/date values are validated; values are SQL parameters.
- DELETE: `{table,id}` deletes a record; `{table,confirm:table}` drops the table after exact name confirmation.

The app account needs CREATE/DROP permissions for table operations. Run `scripts/enable-table-management.ps1` locally using the root password prompt. This is an assignment table builder, not an unrestricted SQL console or a migration editor for the protected core schema.
