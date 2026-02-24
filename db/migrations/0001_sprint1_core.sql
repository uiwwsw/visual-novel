-- Sprint 1 core schema (Supabase/PostgreSQL)
-- Date: 2026-02-24

create extension if not exists "pgcrypto";

-- Update helper for updated_at columns.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  owner_user_id uuid not null,
  plan_tier text not null default 'free' check (plan_tier in ('free', 'pro')),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  user_id uuid not null,
  role text not null check (role in ('owner', 'editor', 'viewer')),
  status text not null default 'active' check (status in ('active', 'invited', 'disabled')),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  name text not null,
  slug text not null,
  description text,
  visibility text not null default 'private' check (visibility in ('private', 'unlisted', 'public')),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_by uuid not null,
  updated_by uuid not null,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, slug)
);

create table if not exists public.scenarios (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete restrict,
  schema_version text not null,
  content_jsonb jsonb not null,
  entry_node_id text not null,
  stats_jsonb jsonb not null default '{}'::jsonb,
  version_no int not null default 1 check (version_no >= 1),
  updated_by uuid not null,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_versions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete restrict,
  scenario_id uuid not null references public.scenarios(id) on delete restrict,
  version_no int not null check (version_no >= 1),
  change_note text,
  is_release boolean not null default false,
  created_by uuid not null,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  unique (project_id, version_no)
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  actor_user_id uuid not null,
  action text not null,
  target_type text not null,
  target_id uuid not null,
  before_jsonb jsonb,
  after_jsonb jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_memberships_org_role
  on public.memberships (organization_id, role);

create index if not exists idx_projects_org_updated_at
  on public.projects (organization_id, updated_at desc);

create index if not exists idx_scenarios_content_jsonb
  on public.scenarios using gin (content_jsonb);

create index if not exists idx_scenarios_project_id
  on public.scenarios (project_id);

create index if not exists idx_audit_logs_org_created_at
  on public.audit_logs (organization_id, created_at desc);

create index if not exists idx_audit_logs_actor_created_at
  on public.audit_logs (actor_user_id, created_at desc);

drop trigger if exists trg_organizations_updated_at on public.organizations;
create trigger trg_organizations_updated_at
before update on public.organizations
for each row execute function public.set_updated_at();

drop trigger if exists trg_memberships_updated_at on public.memberships;
create trigger trg_memberships_updated_at
before update on public.memberships
for each row execute function public.set_updated_at();

drop trigger if exists trg_projects_updated_at on public.projects;
create trigger trg_projects_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

drop trigger if exists trg_scenarios_updated_at on public.scenarios;
create trigger trg_scenarios_updated_at
before update on public.scenarios
for each row execute function public.set_updated_at();
