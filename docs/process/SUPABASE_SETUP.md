# Supabase Setup (Sprint 1)

## Required Environment Variables (Studio API)

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Optional request headers used by current API layer:

- `x-user-role: viewer|editor|owner`
- `x-plan-tier: free|pro`
- `x-user-id: <auth user uuid>`
- `x-org-id: <organization uuid>`

## Apply SQL

```bash
DATABASE_URL='postgres://...' ./scripts/apply_sprint1_sql.sh
```

or

```bash
DATABASE_URL='postgres://...' npm run db:apply:sprint1
```

## Verify RLS

```bash
DATABASE_URL='postgres://...' ./scripts/verify_sprint1_rls.sh
```

or

```bash
DATABASE_URL='postgres://...' npm run db:verify:rls
```

GitHub Actions:

- `DB Verify` workflow runs on `main` DB/script changes or manual trigger.
- It executes only when repository secret `DATABASE_URL` is configured.

## Notes

- If `SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` is missing, Studio API routes fall back to in-memory handler logic for local contract testing.
- In production, always set both values so project/scenario writes use Supabase.
