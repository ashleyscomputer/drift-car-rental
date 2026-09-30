# Drift: local MySQL handover

The app now connects to MySQL on this computer. The schema is included at database/Database_Updated.sql. On the original development computer the 21-table schema is already imported; do not run Database_Updated.sql again over it.

## Start the app
Open PowerShell in this project folder and run:
```powershell
Set-Location 'C:\Users\Admin\OneDrive - Sol Plaatje University\Documents\ChatGPT\New project\car-rental-system'
npm start
```
The local build is already prepared. After changing source code, run `npm run build:local` before `npm start`, or use `npm run dev:local` while developing.

Open http://127.0.0.1:3000. Keep that terminal open. MySQL84 must be running in Windows Services. Node.js 22.13 or newer is required.

The local connection is in ignored .env.local. Do not send that file or passwords to GitHub or your group. The app uses the dedicated drift_local account, not root. The setup script now also supports Windows PowerShell 5.1; rerun it only when you need to reset the local connection.

## Create your own administrator
1. Open /register and create your real account (12–128 character password).
2. In PowerShell, in this project folder, run:
```powershell
npm run admin:promote -- YOUR-REGISTERED-EMAIL
```
3. Refresh the homepage. Your account opens the admin area.

Only someone with local database access can promote an account. Registration never grants admin access.

## What the database group must add
Use **Admin > Database** to add the real branch name, province, city and street address. Optional extras need a unique code, name, price and per-day/per-booking pricing.

Use **Admin > Vehicles** to add each actual car:
- Brand, model, year, body type, unique registration
- Branch, tier, daily price, transmission, doors and colour
- Description, actual features and a photograph URL or local public image path

Use MySQL Workbench for additional branch contacts, extra updates, seats, photo galleries and image credits. For additional photographs add VehicleImage rows with the vehicle_id, image_url, alt_text, sort_order and is_primary=0. Supply high-resolution originals; the app cannot turn a low-resolution photo into genuine 4K.

No fleet, branch, customer, booking or review seed data is supplied. Missing records produce an honest empty state. Existing stock image files are not automatically imported as actual rental vehicles. Category/model/feature reference rows are created when an administrator saves real vehicle details.

Do not add plaintext passwords directly to AppUser; use registration. Customer is created together with AppUser in a transaction.

## What now works
- MySQL registration, salted scrypt password hashes and revocable HttpOnly cookie sessions.
- Server-enforced admin access and customer booking ownership.
- Real fleet and branch loading, real stored review averages (no invented ratings).
- Fleet create/edit/archive and database table counts.
- Reservations, extras, status history, cancellation request and admin review.
- Transactional date conflict checks, server price calculation and duplicate checkout protection.
- Only payment is simulated: Payment.status=DemoApproved, method=Demo, is_demo=1. Booking.is_demo=0 because the reservation itself is real. No card details or money are collected. Simulated payments are excluded from paid revenue.
- Booking records survive app restarts.

## Remaining setup
- Register and promote your own admin, then enter your actual branches and fleet.
- Add verified business contact information, images and operational data.
- Email delivery, password reset/email verification, actual payment collection and licence/identity verification are not enabled.
- This connection is local only. Vercel cannot reach this computer using localhost. A public deployment needs a reachable hosted MySQL database with TLS and separate server-side environment variables; never copy local credentials into browser code.
- The existing public Vercel deployment has not been updated by this local setup.

## Verification
```powershell
npx tsc --noEmit
npm run build:local
node --env-file=.env.local scripts/verify-local-mysql.mjs
```
The integration test requires the running local app. It creates uniquely named temporary records and removes them in finally; do not interrupt it during execution. It checks authentication, permissions, server totals, overlap locking, concurrent retry deduplication, cancellation, demo payment status and logout. It never charges a card or sends mail.

The repository-wide linter also reports pre-existing UI/Next.js convention issues. Type checking, local build and database integration checks are the relevant executed validation for this connection.
