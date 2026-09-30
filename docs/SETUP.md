# Setup

Follow [database installation](../database/README.md), then [the group handover](../DATABASE_TEAM.md).

A fresh clone requires Node.js 22.13+, npm and MySQL 8.4:
1. Run `npm ci`.
2. Import `database/Database_Updated.sql` into an empty MySQL installation.
3. Configure `.env.local` from `.env.example`.
4. Run `npm run dev:local` and open http://127.0.0.1:3000.
5. Register your actual account and promote it using `npm run admin:promote -- YOUR-REGISTERED-EMAIL`.
6. Add real branches and vehicles.

For a local production build, run `npm run build:local` then `npm start`. The local server binds to 127.0.0.1. Do not run two servers on port 3000.

Vercel uses `vite.vercel.config.ts` via vercel.json. It needs a hosted MySQL database and its own server environment variables. A GitHub SQL file or your computer's localhost does not supply that service.
