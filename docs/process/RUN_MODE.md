# Web Service Run Mode

## Topology

- `apps/studio`: authoring app + management APIs
- `apps/player`: runtime/player app
- `packages/*`: shared domain logic (`api-core`, `vn-schema`)

## Dev Mode

Run Studio and Player as separate processes.

- Studio default port: `4321`
- Player default port: `4322`

Recommended env for Studio API integration:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- optional: `STRICT_ACTOR_AUTH=true` (rejects header-only actor context)
- request headers for temporary actor context:
  - `x-user-role: viewer|editor|owner`
  - `x-plan-tier: free|pro`
  - `x-user-id: <uuid>`
  - `x-org-id: <uuid>`

Actor context resolution order in Studio API:

1. If Supabase env exists and `Authorization: Bearer <token>` is provided, role/plan/user are resolved from Supabase (`auth user`, `memberships`, `organizations`).
2. Otherwise, temporary header-based context is used.
3. If `STRICT_ACTOR_AUTH=true`, step 2 is disabled and bearer token is required.

If Supabase env is missing, routes use fallback in-memory handler logic for contract testing.

## Prod Mode

Deploy Studio and Player independently.

1. Apply DB schema and RLS:
   - `DATABASE_URL=... npm run db:apply:sprint1`
2. Verify RLS:
   - `DATABASE_URL=... npm run db:verify:rls`
3. Build and deploy Studio
4. Build and deploy Player

Mandatory env in production (Studio):

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## API Behavior Contract

- `402 PLAN_LIMIT_EXCEEDED`: paid feature requested on free plan
- `403 FORBIDDEN_ROLE`: role does not satisfy endpoint requirement
- `409 VERSION_CONFLICT`: optimistic lock mismatch for scenario save
- `422 SCENARIO_VALIDATION_FAILED`: validator found blocking issues

## CI Gates

- App/API contract tests run in `.github/workflows/ci.yml`
- DB/RLS verification workflow in `.github/workflows/db-verify.yml` (requires `DATABASE_URL` secret)
