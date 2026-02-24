# Sprint 1 Implementation Status

## Completed

- DB core schema migration SQL
- RLS policy SQL with role hierarchy helpers
- API error contract (`402`, `403`, `409`)
- API permission gates (`viewer/editor/owner`, free/pro)
- Astro API route skeleton wired to shared core handlers
- Supabase REST repository wiring for `projects` and `scenarios` (env-driven)
- SQL apply + RLS verification scripts
- CI workflow for API/RLS test gate
- Run mode guide for dev/prod split operation

## Endpoints Added (Studio)

- `POST /api/projects`
- `POST /api/projects/:id/scenario`
- `POST /api/projects/:id/validate`
- `POST /api/projects/:id/build`
- `POST /api/projects/:id/rollback`

## Header Contract (temporary integration)

- `x-user-role: viewer|editor|owner`
- `x-plan-tier: free|pro`
- `x-user-id: <uuid>`
- `x-org-id: <uuid>`
