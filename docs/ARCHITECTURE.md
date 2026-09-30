# Architecture

Browser -> Vinext route handlers -> mysql2 connection pool -> MySQL/InnoDB.

- lib/store.ts defines shared types only; there is no seeded in-memory fleet.
- lib/mysql.ts owns parameterized queries and transaction handling.
- lib/server-auth.ts handles password hashes, cookie session lookup, authorization and errors.
- lib/auth-service.ts implements registration/login; new registrations always have customer role.
- lib/repository.ts loads the catalogue and owns booking/cancellation transactions.
- lib/fleet-admin.ts validates and saves operational records.
- database/Database_Updated.sql defines the 21-table fresh-install schema.
- components/rental-app.tsx provides catalogue, booking form and administration.
- components/checkout-page.tsx submits a stable checkout reference and expected total; the server approves only the payment simulation.
- vite.local.config.ts uses Node for local MySQL access; vite.vercel.config.ts uses Nitro's Vercel build.

Booking writers lock the vehicle before checking date overlap. Booking, extras, payment and history are committed together. Session tokens are random, cookies are HttpOnly and only token hashes are stored in MySQL. Passwords use salted scrypt. Role checks and booking ownership checks run on the server.

Only the draft checkout is held in browser storage. Accounts, reservations and payments are database records. Real card processing, email/reset delivery and verified driver checks remain outside the implemented flow.

Drift Guide runs app answers locally and optionally downloads a Transformers.js model into a browser Web Worker. That optional model is separate from the database path.
