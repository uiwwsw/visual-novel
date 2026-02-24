import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const policyFile = "db/policies/0001_rls_policies.sql";

test("RLS policy file enables RLS on all Sprint 1 tables", () => {
  const sql = fs.readFileSync(policyFile, "utf8");
  const required = [
    "alter table public.organizations enable row level security;",
    "alter table public.memberships enable row level security;",
    "alter table public.projects enable row level security;",
    "alter table public.scenarios enable row level security;",
    "alter table public.project_versions enable row level security;",
    "alter table public.audit_logs enable row level security;"
  ];

  for (const statement of required) {
    assert.match(sql, new RegExp(statement.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("RLS helper functions are security definer to avoid policy recursion", () => {
  const sql = fs.readFileSync(policyFile, "utf8");
  assert.match(sql, /create or replace function public\.is_org_member[\s\S]*security definer/i);
  assert.match(sql, /create or replace function public\.has_org_role[\s\S]*security definer/i);
  assert.match(sql, /create or replace function public\.has_min_role[\s\S]*security definer/i);
});

test("owner/editor/viewer policy anchors exist", () => {
  const sql = fs.readFileSync(policyFile, "utf8");
  const policyNames = [
    "projects_insert_editor",
    "projects_update_editor",
    "projects_delete_owner",
    "memberships_update_owner",
    "scenarios_update_editor",
    "project_versions_update_owner"
  ];

  for (const name of policyNames) {
    assert.match(sql, new RegExp(`create policy ${name}`, "i"));
  }
});
