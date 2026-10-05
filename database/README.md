# MySQL database

Database_Updated.sql is the application's fresh-install schema: 21 InnoDB tables with foreign keys, indexes and checks. It contains no users, passwords, fleet records, bookings or test seeds. This is the database definition, not a running database service or a dump of private account data.

## Import once

Use MySQL 8.4. Open the SQL file in MySQL Workbench while connected to your server, then run the complete script. It creates and selects drift_car_rental. The script deliberately does not drop existing tables.

Do not rerun this CREATE script over an existing installation. Back up existing data and write an ALTER migration if the schema later changes.

On the original development computer this schema is already imported; no second import is needed.

Copy .env.example to .env.local in the project root, set a dedicated application username/password, and grant that user SELECT, INSERT, UPDATE, DELETE on drift_car_rental.*. Use MYSQL_SSL=false only for local development; hosted databases should use TLS.

## Real data

Create accounts through /register. Run npm run admin:promote -- YOUR-REGISTERED-EMAIL locally to enable an administrator. Use Admin > Database for branches and extras, then Admin > Vehicles for inventory.

Booking writes lock the vehicle row before testing overlapping dates. Cancellation requests do not free dates until approved. Booking and payment changes are transactional.

Only payments are simulated: Booking.is_demo=0, Payment.is_demo=1, Payment.method=Demo, Payment.status=DemoApproved. These approvals are not revenue. Passwords are salted scrypt hashes; sessions store token hashes.

See ../DATABASE_TEAM.md for the full handover.
