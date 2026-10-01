# Database Systems Project 2026: alignment

Source: the supplied one-page **Database Systems project 2026.pdf**. The brief allocates 40 marks to the report, 50 to implementation and 10 to extra effort; it does not provide finer scoring criteria. No mark is guaranteed.

## Implementation evidence

| Requirement | Where to demonstrate | Evidence / qualification |
| --- | --- | --- |
| Create/add a table (items 1 and 4 repeat this requirement) | Admin > Database > Manage your tables | Creates a real `custom_` MySQL table with an automatic primary key and chosen columns. Requires CREATE permission. |
| Add/update data | Admin > Vehicles; Database > Manage your tables | Vehicle forms and custom-table record forms persist changes. |
| Remove/delete data | Database > Manage your tables > Delete | Physically deletes the chosen custom-table row. Vehicle removal archives the vehicle to preserve reservation history. |
| Remove a table | Database > Manage your tables > Remove table permanently | Actual DROP TABLE after typing the full name. Core rental/authentication tables cannot be targeted. Requires DROP permission. |
| At least four reports | Admin > Reports | Booking value, fleet status, booking status and top vehicles; each downloads as a PDF. Full summary is additional. |
| Easy-to-use interface | Customer and admin views | Labelled forms, responsive layout, confirmation for destructive actions and visible errors. |

## Report evidence

The revised `output/pdf/Drift_Database_Project_Report.pdf` contains the service overview, all 21 core tables, a complete 24-relationship ER model presented as labelled relationship panels, and a worked UNF -> 1NF -> 2NF -> 3NF decomposition. Panels repeat an entity when it participates in multiple relationships; they do not introduce duplicate tables.

The report explicitly distinguishes normalized logical relations from intentional physical historical snapshots and generated/cached totals. Do not claim that every physical column is a strict 3NF design: these implementation exceptions should be explained to the lecturer. The added appendix makes the normalization process explicit, but the group's explanation of those exceptions remains important for the report mark.

## Presentation sequence

1. Explain the rental setting and the customer/admin roles.
2. Open Database Studio and show keys, constraints and relationships.
3. Create `service_notes` with `note` (Text), `cost` (Decimal) and `service_date` (Date). These are real MySQL columns; `id` is generated automatically.
4. Add a record, edit it and confirm the result after selecting the table again.
5. Delete the record, then remove the table by typing `custom_service_notes`.
6. Register/sign in, book a vehicle and show the persisted reservation and cancellation approval. Payments approve automatically without collecting money.
7. Download each of the four reports. Explain why booking value and collected payments are different.
8. Present the normalization example and full ER relationship panels.

## Required local setup

The dedicated application account initially had SELECT/INSERT/UPDATE/DELETE only. On the database computer, run `scripts/enable-table-management.ps1` and enter the root password locally. It grants CREATE and DROP to the app account; it does not reset passwords or replace records. Application endpoints permit only the `custom_` namespace, but the database grant itself covers the schema. Use this configuration only for the intended trusted local assignment environment.

Verification command after starting the rebuilt app:

```powershell
node --env-file=.env.local scripts/verify-table-management.mjs
node --env-file=.env.local scripts/verify-local-mysql.mjs
```

The scripts clean up their own temporary accounts, rows and tables. A permissions error means table creation/removal is not yet ready for presentation; it must not be reported as passed.

## Group-owned submission tasks

- Confirm five members and at least one from each stream: ICT, Data Science, Computer Science.
- Add actual member names, student numbers, streams and contributions to the report. These have not been supplied.
- Moodle submission: 12 October 2026. A GitHub push does not constitute submission.
- Presentations: 11-12 October 2026, 09:00-17:00, according to the supplied brief. Confirm your assigned slot with the lecturer.
- Include the report, source/schema, setup instructions and required institutional cover/declaration. Do not submit `.env.local`, passwords or private account records.
- Rehearse on the presentation computer and confirm that Node, MySQL, the imported schema and app permissions are available.

## Extra-effort evidence (not a promise of marks)

Live schema explorer; downloadable PDF reports; transaction locks and duplicate-checkout protection; hashed passwords and revocable sessions; role/ownership checks; cancellation audit history; responsive design; repeatable integration checks.

## Verification completed on 1 October 2026

Type checking, local build and targeted lint passed. The full table-management integration cycle passed after enabling the database privileges: create table, insert/read/update/delete row, drop table, invalid-input rejection, administrator restriction and protected-table rejection. The existing booking/authentication integration suite and all five PDF exports also passed. All test records and tables were removed.
