# Database status

The local MySQL integration is implemented, with 40 catalogue vehicles and an administrator account. Use [the schema](../database/Database_Updated.sql), [database setup](../database/README.md) and [team handover](../DATABASE_TEAM.md).

Working: registration/login, role-based access, catalogue management, saved bookings and extras, overlap protection, cancellation decisions, and the live Database Studio with schema export.

Payments automatically approve without charging money. The UI uses ordinary booking and approval labels; internal `DemoApproved` and `is_demo` fields remain unchanged so these records stay excluded from collected revenue. Database Studio shows the actual schema, including these technical identifiers.

Before assignment submission: rehearse a booking and cancellation with your own account, review the catalogue rates and branch details, and prepare the schema/relationship explanation and SQL queries required by your rubric.

Not implemented: email delivery, password reset, email verification, driving-licence verification and real payment collection. Some branch, extra and gallery maintenance requires MySQL Workbench. Repository-wide lint has existing failures. Online hosting is not part of the current requested scope.
