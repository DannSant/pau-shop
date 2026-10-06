# Database (Supabase)

| Path | What it is |
|---|---|
| `migrations/20261004000000_baseline.sql` | The complete schema: tables, constraints, functions, views, security rules, permissions, storage bucket. |
| `migrations/` (later files) | Changes made after the baseline, one file per change. |
| `seed.sql` | Starting data (categories). |
| `export-schema.sql` | Read-only query that exports a database's schema, one statement per row. |
| `schema-export.csv` | That export, taken from the live project when the baseline was made. |
| `migrations-archive/` | The migrations from before the baseline (history only; never applied). |
| `config.toml` | Settings for the local copy used by the tests. |

## Changing the schema

1. Add a new file in `migrations/` named `YYYYMMDDHHMMSS_what_it_does.sql`.
2. Run `npm run db:reset` so the local database gets it, then run the tests.
3. Merge it: the "Database migrations" workflow applies it to test (`develop`) and, after your approval, to production (`main`).

## Local database (for tests)

Needs Docker Desktop running. From the repo root:

```
npm run db:start   # first run downloads the images (a few GB)
npm run db:reset   # rebuild from the baseline + later migrations + seed
npm run db:stop
```

Local Studio (a dashboard for the local database): http://127.0.0.1:54323

## Checking that a database matches the repo

Run `export-schema.sql` against the database, save the result, and compare it with `schema-export.csv`. Each row is one object, so differences show exactly what changed.

## Environments and go-live

Test and production each have their own Supabase project. Setup, migrations per environment, syncing data between them and backups are described in [DEPLOYMENT.md](../DEPLOYMENT.md).
