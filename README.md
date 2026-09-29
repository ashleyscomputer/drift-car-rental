<div align="center">
  <img src="public/og.png" alt="Drift Car Rental" width="100%" />

  # Drift Car Rental

  **A polished, Apple-inspired car-rental experience for South Africa.**
</div>

---

## Overview

Drift is a full-stack university assignment that demonstrates a complete rental workflow without requiring a production database or payment gateway.

The application includes a responsive 70-vehicle catalogue, guest booking, role-based temporary login, client booking management, an admin operations dashboard, booking calendar, rental extras, availability checks, cancellation approval workflow, support/policy pages, and optional Hostinger booking confirmation email support.

## Core features

- Responsive value-to-premium vehicle catalogue
- 70 vehicles across hatchbacks, sedans, SUVs, bakkies and passenger vans
- Brand, model, type, year, transmission, feature and price filtering
- Dedicated vehicle detail pages with specifications, ratings and gallery support
- Guest-friendly booking flow
- Optional rental extras with server-calculated totals
- Server-side date conflict protection to prevent overlapping bookings
- Five branch locations: Kimberley, Upington, Bloemfontein, Johannesburg and Cape Town
- Temporary admin/client login layer for the pre-database assignment phase
- My Drift client dashboard with upcoming bookings, history, extras and payment status
- Client cancellation requests that require admin approval
- Admin dashboard with fleet, bookings, customers, reports and database preparation
- Calendar and table booking views
- Vehicle states: Available, Reserved, Rented and Maintenance
- Booking states: Confirmed, Pending, Cancellation Requested, Completed and Cancelled
- Contact, FAQ, Rental Terms, Privacy and Cancellation Policy pages
- Wikimedia Commons photo credits for model-specific replacement photography
- Drift Guide browser AI assistant
- Optional Hostinger booking confirmation email adapter

## Checkout and payments

No real payment gateway is connected because this is a university assignment.

Bookings are validated server-side, pricing and extras are recalculated by the server, and confirmed reservations are stored with payment marked as **Pending**. No card details are collected.

## Authentication

The current assignment version includes temporary server-checked admin and client accounts. This layer is intentionally replaceable so persistent users, sessions and stronger authorization can be connected during the database/security phase.

Production security is not considered complete until the persistent database and session layer are added.

## Email confirmations

The project includes a Hostinger Mail adapter.

Expected environment variables:

```env
HOSTINGER_MAIL_API_TOKEN=
HOSTINGER_MAILBOX_ID=
HOSTINGER_MAIL_FROM_ADDRESS=ashley@kickstreet.store
HOSTINGER_MAIL_FROM_NAME=Drift Car Rental
```

The mailbox resource ID must belong to `ashley@kickstreet.store`. If the mailbox is not configured, bookings still succeed and email sending remains disabled.

## Technology

| Layer | Technology |
| --- | --- |
| Interface | React 19, TypeScript, Tailwind CSS, Base UI, Lucide icons |
| Framework | Vinext / Next-compatible App Router |
| Backend | Route handlers using Web Request/Response APIs |
| AI | @huggingface/transformers, ONNX, browser Web Worker |
| State | In-memory TypeScript store, ready for a persistent database |
| Hosting | Vercel |
| Quality | Oxlint, Oxfmt, production build checks |

## Quick start

Requirements:

- Node.js 22.13 or newer
- npm
- A modern browser

```bash
git clone https://github.com/ashleyscomputer/drift-car-rental.git
cd drift-car-rental
npm install
npm run dev
```

Open `http://localhost:3000`.

## Available scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Produce the production build |
| `npm run start` | Run the built application locally |
| `npm run lint` | Run repository lint checks |
| `npm run format` | Format supported project files |

## Main user flows

### Customer

```text
Browse fleet
→ View vehicle details
→ Choose dates and branches
→ Add optional extras
→ Review checkout
→ Confirm booking
→ Booking reference + payment pending
```

Signed-in clients can then manage bookings from **My Drift**.

### Cancellation

```text
Client requests cancellation
→ Booking becomes Cancellation Requested
→ Admin sees request on dashboard
→ Admin keeps booking OR approves cancellation
```

### Admin

```text
Dashboard
├── Fleet
├── Bookings
│   ├── Calendar
│   └── Table
├── Customers
├── Reports
└── Database preparation
```

## Current limitations

- Application records are stored in memory and can reset when the server restarts.
- Persistent database storage is not connected yet.
- Production-grade session enforcement and authorization are deferred to the database/security phase.
- No real payment gateway is connected.
- Booking confirmation email requires an authorized `ashley@kickstreet.store` Hostinger mailbox.
- Rates are assignment catalogue values rather than live rental-company inventory pricing.

## Next backend phase

- Connect persistent database storage
- Replace temporary account/session handling
- Enforce production server-side authorization
- Store booking, customer, vehicle and cancellation data persistently
- Configure the Hostinger sender mailbox
- Perform final cross-device deployment QA

## Academic and asset notice

This repository is an educational project. Vehicle photography is used for educational demonstration. Model-specific replacement photography for vehicles 41–70 is sourced from Wikimedia Commons, with source/licence links available on the in-app **Photo Credits** page.


<!-- vercel-deploy-trigger -->

<!-- vercel-nitro-deploy-trigger -->
