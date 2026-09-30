# MySQL database

Database_Updated.sql is the application's fresh-install schema: 21 InnoDB tables with foreign keys, indexes and checks. It contains no users, passwords, fleet records, bookings or test seeds. This is the database definition, not a running database service or a dump of private account data.

## Import once

Use MySQL 8.4. Open the SQL file in MySQL Workbench while connected to your server, then run the complete script. It creates and selects drift_car_rental. The script deliberately does not drop existing tables.

Do not rerun this CREATE script over an existing installation. Back up existing data and write an ALTER migration if the schema later changes.

On the original development computer this schema is already imported; no second import is needed.

Copy .env.example to .env.local in the project root, set a dedicated application username/password, and grant that user SELECT, INSERT, UPDATE, DELETE on drift_car_rental.*. Use MYSQL_SSL=false only for local development; hosted databases should use TLS. The Windows helper scripts/setup-local-mysql.ps1 can create a local app user against MySQL Server 8.4; it prompts privately for root's password and writes the generated app password only to ignored .env.local.

## Real data

Create accounts through /register. Run npm run admin:promote -- YOUR-REGISTERED-EMAIL locally to enable an administrator. Use Admin > Database for branches and extras, then Admin > Vehicles for inventory. Further branch contacts, extra updates and image galleries can be edited in Workbench.

Booking writes lock the vehicle row before testing overlapping dates. Cancellation requests do not free dates until approved. Booking and payment changes are transactional.

Only payments are simulated: Booking.is_demo=0, Payment.is_demo=1, Payment.method=Demo, Payment.status=DemoApproved. These approvals are not revenue. Passwords are salted scrypt hashes; sessions store token hashes.

See ../DATABASE_TEAM.md for the full handover.

## Restore the approved fleet

After importing the schema and configuring .env.local, run `npm run fleet:import` from the project root. It reads database/fleet.json and adds 40 vehicles recovered from GitHub commit 61c5a20, 160 bundled gallery images, their features and rates, a Drift Kimberley branch, and six rental extras. The catalogue was restored at the project owner's request. Registrations/specifications are retained from that catalogue; verify them before any real-world rental operation.

All newly imported cars begin Available. Historic sample Rented/Maintenance states, generated ratings, customers, bookings and payments are not imported. Existing registrations and extra codes are skipped, so repeating the import preserves edits and bookings. The entire import is transactional and protected against concurrent imports. Branch address/contact fields are left unset rather than invented.
