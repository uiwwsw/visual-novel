#!/usr/bin/env bash
set -euo pipefail

if ! command -v psql >/dev/null 2>&1; then
  echo "psql is required to verify RLS." >&2
  exit 1
fi

: "${DATABASE_URL:?DATABASE_URL is required}"

psql "$DATABASE_URL" -f scripts/verify_sprint1_rls.sql

echo "Sprint 1 RLS verification passed."
