#!/usr/bin/env bash
set -euo pipefail

if ! command -v psql >/dev/null 2>&1; then
  echo "psql is required to apply migrations." >&2
  exit 1
fi

: "${DATABASE_URL:?DATABASE_URL is required}"

psql "$DATABASE_URL" -f db/migrations/0001_sprint1_core.sql
psql "$DATABASE_URL" -f db/policies/0001_rls_policies.sql

echo "Sprint 1 schema + RLS applied successfully."
