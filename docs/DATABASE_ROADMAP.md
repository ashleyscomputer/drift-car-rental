# Database roadmap

The project uses an existing MySQL database. Its connection and schema are not yet supplied to this deployment. `.env.example` and `lib/mysql.ts` provide server-side configuration placeholders only; no queries or migrations run. The deployed booking demo still uses the temporary in-memory store. Google and browser demo sign-in are removed; account pages remain unavailable until server-side MySQL authentication is implemented.

Next: supply the existing schema, configure MYSQL_* in Vercel, add a pooled MySQL driver, map the store operations to that schema, and implement hashed passwords plus server-validated sessions. Do not recreate or overwrite the existing database.

## Proposed tables

- `users`
- `brands`
- `categories`
- `vehicles`
- `features`
- `vehicle_features`
- `bookings`
- `payments`

## Recommended constraints

- Unique user email and vehicle registration
- Positive vehicle daily rate and payment amount
- Booking end date later than start date
- Foreign keys for brand, category, customer, vehicle and booking relationships
- Enumerated or checked status values
- Unique `(vehicle_id, feature_id)` pairs
- Timestamps for creation and last update

## Migration sequence

1. Introduce a repository/service interface behind the current store functions.
2. Define the relational schema and migrations.
3. Seed the existing 70 vehicles and their features.
4. Add server-side validation to every mutation.
5. Store bookings transactionally and prevent overlapping active bookings.
6. Add authenticated customer and administrator roles.
7. Connect payments only after booking persistence and idempotency are in place.

## Suggested production additions

- Vehicle-image records and object storage
- Branch and inventory tables
- Insurance products and booking extras
- Payment events and refund records
- Audit trail for administrator actions
- Soft deletion where historical reports require retained records

