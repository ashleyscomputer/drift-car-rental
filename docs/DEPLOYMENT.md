# Deployment

## Build validation

```bash
npm ci
npm run build
```

The repository CI workflow runs the same production build for pushes and pull requests targeting `main`.

## Current hosted site

The private production version is hosted at:

<https://drift-car-rental-2026.ashleyvr90.chatgpt.site>

## Environment

The current prototype requires no secrets or runtime variables. Do not commit `.env` files. When future integrations are introduced, document placeholder names in `.env.example` and configure real values only in the hosting provider's secret manager.

## Release checklist

1. Confirm `npm ci` succeeds from a clean checkout.
2. Run `npm run build`.
3. Test catalogue filters, one gallery, one booking and admin navigation.
4. Confirm the API returns 40 seeded vehicles.
5. Confirm the chatbot FAQ works without loading the AI model.
6. Check the first general-knowledge request and model-loading message.
7. Verify title, description and social-preview image.
8. Publish the exact reviewed commit.

