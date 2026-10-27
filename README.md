# Academic Paper Platform

A comprehensive academic paper platform that combines the best features from multiple platforms:

## Product playbook

Who it's for, the one metric, settings to switch on in Vercel and the non-code plan: [PLAYBOOK.md](./PLAYBOOK.md).

## Development

- `npm run typecheck`, `npm run lint`, `npm run test:unit` (no database needed)
- `npm run test:practice` (needs `DATABASE_URL`)
- Schema changes: edit `prisma/schema.prisma`, then `npm run db:migration -- --name <change>` and commit
  the new folder in `prisma/migrations`. Deploys apply migrations with `scripts/migrate.mjs`.
- CI (`.github/workflows/ci.yml`) runs all of the above plus a build on every push.

## Peer-review practice

A timed, peer-reviewed abstract-critique practice layer lives under `/practice`. See [PRACTICE.md](./PRACTICE.md) for setup, rules, tests and what was left out.
