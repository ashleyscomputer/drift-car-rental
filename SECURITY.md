# Security policy

## Prototype status

Drift is an educational prototype. It does not currently process real payments, create durable customer accounts or provide authenticated administrator access.

Do not enter real personal, payment or confidential information into a demonstration deployment.

## Supported version

Only the latest commit on `main` is maintained.

## Reporting a vulnerability

Do not open a public issue for a vulnerability that could expose data or enable abuse. Contact the repository owner through their GitHub profile and include a concise description, reproduction steps, potential impact and a suggested mitigation if available.

## Production hardening checklist

- Authentication and server-side role authorization
- Request-schema validation and output encoding
- Rate limiting and abuse protection
- Secret management outside the repository
- Dependency and container scanning
- Secure headers and a restrictive content security policy
- Database transactions, backups and audit logs
- Payment-provider tokenization and webhook verification

