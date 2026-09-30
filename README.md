# Drift Car Rental

Drift is a React/Vinext car-rental application backed by MySQL. Accounts, branches, vehicles, reservations and cancellation decisions persist in the database. Payment is the only simulation: checkout saves a real reservation with a DemoApproved payment and never charges money.

## Database and setup

- [MySQL schema](database/Database_Updated.sql): 21 tables, no demo records or credentials.
- [Database setup](database/README.md): installation and import instructions.
- [Group handover](DATABASE_TEAM.md): administrator setup, data entry, checks and limitations.
- [API reference](docs/API.md) and [architecture](docs/ARCHITECTURE.md).

Requires Node.js 22.13+ and MySQL 8.4. Install dependencies with `npm ci`, import the schema into an empty database, and configure ignored `.env.local` using `.env.example`. Never commit actual passwords.

```bash
npm run dev:local
```

Open http://127.0.0.1:3000. For the built local app:

```bash
npm run build:local
npm start
```

Register your own account at /register. To enable its admin role from the project folder:

```bash
npm run admin:promote -- YOUR-REGISTERED-EMAIL
```

Add actual branches, optional extras and cars through the admin area. The catalogue starts empty. Stock image files are not seeded as rental inventory, and ratings appear only when stored published reviews exist.

## Implemented

- Email/password registration and login, salted password hashes and revocable cookie sessions.
- Server-enforced customer ownership and administrator permissions.
- MySQL fleet loading, vehicle create/edit/archive, branch and extra creation.
- Server-calculated booking totals, transactional overlap checks and duplicate-checkout protection.
- Customer cancellation requests and administrator decisions with status history.
- Automatically approved simulated payments, excluded from paid revenue.
- Responsive catalogue, galleries and account pages without forced scrolling.

## Verification

```bash
npx tsc --noEmit
npm run build:local
node --env-file=.env.local scripts/verify-local-mysql.mjs
```

The integration test requires the running local app. It creates temporary verification records and removes them afterward. Local type checking, build, database integration and browser checkout were verified. Repository-wide lint still reports UI/framework convention issues; it is not a clean gate.

## Not yet available

Real fleet/branch records and an administrator must be entered by the project team. Email delivery, password reset, email verification, licence verification and real payment collection are not enabled. Some branch/extra/gallery maintenance is done in MySQL Workbench.

The Vercel site needs a remotely reachable MySQL database with TLS and server environment variables. Uploading this schema to GitHub does not host a database. Local `localhost` credentials cannot work from Vercel. Use `npm run build:vercel` for its build; the local connection has not been deployed online.

Drift Guide's general-knowledge model downloads separately in the browser and depends on browser resources/network access.
