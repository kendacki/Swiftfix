# Contributing

This project is maintained with a "readable-first" workflow: changes should be easy to review, reason about, and reproduce.

## Branch and PR Workflow

1. Create a branch from `master`.
2. Keep PRs scoped to one concern (feature, bug fix, docs, infra).
3. Open a PR with a concise summary and test notes.

## Commit Message Style

Use short, specific, imperative commit titles.

Preferred format:

```text
type(scope): action summary
```

Examples:

- `feat(wallet): add usdt balance polling fallback`
- `fix(request): handle missing artisan location`
- `docs(repo): add recreate and structure guides`

Common types:

- `feat`, `fix`, `refactor`, `docs`, `chore`, `test`

## Local Quality Gate

Git hooks run on both commit and push:

- `pnpm predeploy` (lint + build)

Run this manually before committing to avoid hook failures:

```bash
pnpm predeploy
```

## Coding Boundaries

- UI and presentation: `components/`
- Route-level composition: `app/`
- Server business logic: `actions/`
- Shared infra/utilities: `lib/`
- Schema and migrations: `prisma/`

## PR Checklist

- [ ] Scope is focused and intentional
- [ ] README/docs updated if behavior or setup changed
- [ ] No unrelated file edits
- [ ] `pnpm predeploy` passes locally
- [ ] Screenshots included for UI changes
