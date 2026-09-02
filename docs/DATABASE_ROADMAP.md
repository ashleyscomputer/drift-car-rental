# Database roadmap

The current app deliberately uses in-memory data. A future relational implementation can preserve the existing API surface while replacing `lib/store.ts`.

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
3. Seed the existing 40 vehicles and their features.
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

