<div align="center">
  <img src="public/og.png" alt="Drift Car Rental" width="100%" />

  # Drift Car Rental

  **A polished, Apple-inspired car-rental experience for South Africa.**

  [![Live site](https://img.shields.io/badge/Live_Site-Open_Drift-0071e3?style=for-the-badge)](https://drift-car-rental-2026.ashleyvr90.chatgpt.site)
  [![CI](https://img.shields.io/github/actions/workflow/status/ashleyscomputer/drift-car-rental/ci.yml?branch=main&style=for-the-badge&label=Build)](https://github.com/ashleyscomputer/drift-car-rental/actions)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![React](https://img.shields.io/badge/React-19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)

  [Live demo](https://drift-car-rental-2026.ashleyvr90.chatgpt.site) · [Setup](docs/SETUP.md) · [Architecture](docs/ARCHITECTURE.md) · [API reference](docs/API.md)
</div>

---

## Overview

Drift is a full-stack university assignment prototype that makes browsing and booking a rental car feel calm, fast and premium. It combines a responsive customer catalogue, an operations dashboard, in-memory API routes and an on-device Hugging Face assistant—without requiring login, Firebase or a permanent database.

The catalogue contains **40 vehicles** across value, comfort and premium tiers, with four images per vehicle and market-aligned indicative South African daily rates.

## Highlights

- Responsive Apple-inspired interface with glass surfaces and focused typography
- 40-car catalogue spanning hatchbacks, sedans, SUVs, bakkies and a luxury van
- Brand, model, type, year, transmission, feature and rate filtering
- Four-image vehicle gallery and detailed specifications
- Date- and location-based demonstration booking flow
- Customer and admin experiences in one application
- Fleet, booking, customer, payment and reporting dashboards
- Hugging Face Transformers.js chatbot for app help and general knowledge
- Compact AI model that runs in a Web Worker inside the browser
- In-memory REST-style backend ready for a future relational database
- Private production deployment and automated GitHub build verification

## Technology

| Layer | Technology |
| --- | --- |
| Interface | React 19, TypeScript, Tailwind CSS, Base UI, Lucide icons |
| Framework | Vinext / Next-compatible App Router |
| Backend | Route handlers using the Web `Request` and `Response` APIs |
| AI | `@huggingface/transformers`, ONNX, browser Web Worker |
| State | In-memory TypeScript store (database intentionally deferred) |
| Hosting | OpenAI Sites / Cloudflare-compatible output |
| Quality | Oxlint, Oxfmt, GitHub Actions |

## Quick start

Requirements:

- Node.js 22.13 or newer
- npm
- A modern browser; WebGPU support improves local AI performance

```bash
git clone https://github.com/ashleyscomputer/drift-car-rental.git
cd drift-car-rental
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

No environment variables, database, Firebase project or API key are required for the current prototype. See the detailed [setup guide](docs/SETUP.md) for troubleshooting and production commands.

## Available scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Produce the production build |
| `npm run start` | Run the built Cloudflare-compatible server locally |
| `npm run lint` | Check source quality with Oxlint |
| `npm run format` | Format supported project files |

## How the prototype works

```text
Customer catalogue ─┐
Admin dashboard ────┼── React client ── API route handlers ── In-memory store
Drift Guide ────────┘        │
                              └── Web Worker ── Hugging Face model cache
```

The route handlers expose vehicle, booking, database-schema demonstration and reporting data. Mutations are intentionally temporary: restarting the server restores the seeded dataset. This keeps the current assignment database-free while preserving a clear migration path.

## Documentation

- [Local setup and commands](docs/SETUP.md)
- [System architecture](docs/ARCHITECTURE.md)
- [API reference](docs/API.md)
- [Deployment guide](docs/DEPLOYMENT.md)
- [Database roadmap](docs/DATABASE_ROADMAP.md)
- [Asset and image notes](docs/ASSET_SOURCES.md)
- [Contributing guidelines](CONTRIBUTING.md)
- [Security policy](SECURITY.md)

## Current limitations

- Records are stored in memory and reset when the server restarts.
- Login, roles and real customer accounts are not implemented.
- Booking confirmation and payment processing are demonstrations only.
- Displayed prices are indicative “from” rates rather than live supplier quotes.
- The first general-knowledge chatbot request downloads and caches the local model.

## Roadmap

- Relational database and migrations
- Authentication with customer and administrator roles
- Availability conflict detection
- Real payment gateway and transactional email
- Live pricing, branch inventory and insurance options
- Automated unit, integration and accessibility tests

## Academic and asset notice

This repository is an educational and portfolio project. It currently has no open-source licence; copyright remains with the project author. Vehicle photography is used for educational demonstration and is primarily sourced from Wikimedia Commons. Review each original file page and its licence before commercial redistribution.
