# Architecture

## System context

Drift is a single Vinext application containing both the browser interface and lightweight backend route handlers.

```text
Browser
├── Customer catalogue and booking flow
├── Admin operations dashboard
└── Drift Guide
    ├── Instant application FAQ and fleet recommendations
    └── Web Worker → Transformers.js → ONNX model

Application server
├── /api/vehicles
├── /api/bookings
├── /api/database
├── /api/reports
└── lib/store.ts (seeded in-memory state)
```

## Important modules

| Path | Responsibility |
| --- | --- |
| `app/page.tsx` | Application entry route |
| `app/layout.tsx` | Metadata, fonts and global document layout |
| `components/rental-app.tsx` | Customer and administrator experiences |
| `components/chatbot.tsx` | Chat interface, app FAQ and worker coordination |
| `workers/hf-chat.worker.ts` | Lazy browser inference with Transformers.js |
| `lib/store.ts` | Types, seeded fleet, bookings and mutation functions |
| `app/api/*/route.ts` | JSON endpoints used by the interface |
| `public/vehicles` | Main and gallery vehicle imagery |

## Data flow

1. `RentalApp` requests vehicles, bookings and the demonstration schema.
2. Route handlers return data from module-level arrays.
3. Customer or admin actions call POST, PUT or DELETE handlers.
4. The handler applies a store function and returns JSON.
5. The client refreshes its view from the same endpoints.

This structure deliberately resembles a persistent backend while keeping database work out of the current assignment phase.

## AI flow

Application questions are matched locally and can use the current fleet list for recommendations. Unmatched questions are posted to a dedicated Web Worker. The worker lazily creates one text-generation pipeline and reuses it until the page closes. Inference does not block the React main thread.

## Database migration boundary

The API contracts and `Vehicle`/`Booking` types form the main migration boundary. A future persistence layer can replace the arrays and mutation functions without redesigning the customer interface. See [DATABASE_ROADMAP.md](DATABASE_ROADMAP.md).

## Security boundary

No authentication or real financial operation exists. Admin controls, bookings and payments are demonstrations. A production version must authenticate every protected API route and validate all request bodies server-side.

