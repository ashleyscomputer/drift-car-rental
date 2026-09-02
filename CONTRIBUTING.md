# Contributing

Thanks for improving Drift Car Rental.

## Workflow

1. Create a branch from `main`.
2. Keep each change focused and avoid committing generated output or secrets.
3. Run `npm run build` before opening a pull request.
4. Describe the user-visible result and how it was verified.
5. Include screenshots only when a visual change needs review.

## Style

- Use TypeScript and preserve strict type checking.
- Reuse components from `components/ui`.
- Follow the established accessible, responsive visual system.
- Keep API handlers Cloudflare-compatible and avoid Node-only server APIs.
- Validate new mutation inputs before introducing persistent data.

## Commit messages

Use short, imperative messages such as `Add availability validation` or `Improve mobile catalogue filters`.

## Reporting problems

Use the provided GitHub issue templates. For vulnerabilities or privacy concerns, follow [SECURITY.md](SECURITY.md) instead of opening a public issue.

