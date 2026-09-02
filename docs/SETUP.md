# Local setup

## Prerequisites

- Node.js 22.13 or newer
- npm (included with Node.js)
- Git
- A current version of Edge, Chrome, Firefox or Safari

Python, Firebase and a database server are not required.

## Installation

```bash
git clone https://github.com/ashleyscomputer/drift-car-rental.git
cd drift-car-rental
npm install
```

## Development

```bash
npm run dev
```

Then visit `http://localhost:3000`.

The development server supports hot reload. The API and admin mutations are stored in process memory, so stopping the server restores the seeded records.

## Production build

```bash
npm run build
npm run start
```

Always run the build before publishing a new version.

## AI assistant

Drift Guide answers app questions immediately using deterministic catalogue logic. General-knowledge questions start a browser Web Worker that downloads `onnx-community/gemma-3-270m-it-ONNX` from Hugging Face on first use. Later requests reuse the browser cache.

No Hugging Face token is required for this public model. The initial download may be slow on limited connections or devices.

## Common issues

### Port 3000 is already in use

Stop the process currently using the port, or follow the alternate-port URL printed by the development server.

### The chatbot cannot load

Confirm that the browser can access Hugging Face model files and that content blockers are not preventing the download. App-specific chatbot answers remain available even when the model cannot start.

### Changes disappeared

This is expected for the current in-memory prototype. Add a database using the [database roadmap](DATABASE_ROADMAP.md) when persistence becomes part of the assignment.

