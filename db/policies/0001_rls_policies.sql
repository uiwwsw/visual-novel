-- Sprint 1 RLS policies
-- Date: 2026-02-24

alter table public.organizations enable row level security;
alter table public.memberships enable row level security;
alter table public.projects enable row level security;
alter table public.scenarios enable row level security;
alter table public.project_versions enable row level security;
alter table public.audit_logs enable row level security;

-- Helper: is active member of org.
create or replace function public.is_org_member(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.memberships m
    where m.organization_id = org_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.deleted_at is null
  );
$$;

-- Helper: exact role check.
create or replace function public.has_org_role(org_id uuid, required_role text)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.memberships m
    where m.organization_id = org_id
      and m.user_id = auth.uid()
      and m.role = required_role
      and m.status = 'active'
      and m.deleted_at is null
  );
$$;

-- Helper: minimum role check (owner > editor > viewer).
create or replace function public.has_min_role(org_id uuid, min_role text)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  with me as (
    select
      case m.role
        when 'viewer' then 1
        when 'editor' then 2
        when 'owner' then 3
        else 0
      end as role_rank
    from public.memberships m
    where m.organization_id = org_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.deleted_at is null
    limit 1
  ), required as (
    select
      case min_role
        when 'viewer' then 1
        when 'editor' then 2
        when 'owner' then 3
        else 99
      end as role_rank
  )
  select coalesce((select me.role_rank >= required.role_rank from me, required), false);
$$;

-- Organizations
drop policy if exists org_select_member on public.organizations;
create policy org_select_member
on public.organizations
for select
using (
  deleted_at is null and public.is_org_member(id)
);

drop policy if exists org_update_owner on public.organizations;
create policy org_update_owner
on public.organizations
for update
using (
  deleted_at is null and public.has_org_role(id, 'owner')
)
with check (
  deleted_at is null and public.has_org_role(id, 'owner')
);

-- Memberships
drop policy if exists memberships_select_member on public.memberships;
create policy memberships_select_member
on public.memberships
for select
using (
  deleted_at is null and public.is_org_member(organization_id)
);

drop policy if exists memberships_insert_owner on public.memberships;
create policy memberships_insert_owner
on public.memberships
for insert
with check (
  deleted_at is null and public.has_org_role(organization_id, 'owner')
);

drop policy if exists memberships_update_owner on public.memberships;
create policy memberships_update_owner
on public.memberships
for update
using (
  deleted_at is null and public.has_org_role(organization_id, 'owner')
)
with check (
  public.has_org_role(organization_id, 'owner')
);

-- Projects
drop policy if exists projects_select_member on public.projects;
create policy projects_select_member
on public.projects
for select
using (
  deleted_at is null and public.is_org_member(organization_id)
);

drop policy if exists projects_insert_editor on public.projects;
create policy projects_insert_editor
on public.projects
for insert
with check (
  deleted_at is null and public.has_min_role(organization_id, 'editor')
);

drop policy if exists projects_update_editor on public.projects;
create policy projects_update_editor
on public.projects
for update
using (
  deleted_at is null and public.has_min_role(organization_id, 'editor')
)
with check (
  public.has_min_role(organization_id, 'editor')
  and deleted_at is null
);

drop policy if exists projects_delete_owner on public.projects;
create policy projects_delete_owner
on public.projects
for delete
using (
  public.has_org_role(organization_id, 'owner')
);

-- Scenarios
drop policy if exists scenarios_select_member on public.scenarios;
create policy scenarios_select_member
on public.scenarios
for select
using (
  deleted_at is null and exists (
    select 1
    from public.projects p
    where p.id = project_id
      and p.deleted_at is null
      and public.is_org_member(p.organization_id)
  )
);

drop policy if exists scenarios_insert_editor on public.scenarios;
create policy scenarios_insert_editor
on public.scenarios
for insert
with check (
  deleted_at is null and exists (
    select 1
    from public.projects p
    where p.id = project_id
      and p.deleted_at is null
      and public.has_min_role(p.organization_id, 'editor')
  )
);

drop policy if exists scenarios_update_editor on public.scenarios;
create policy scenarios_update_editor
on public.scenarios
for update
using (
  deleted_at is null and exists (
    select 1
    from public.projects p
    where p.id = project_id
      and p.deleted_at is null
      and public.has_min_role(p.organization_id, 'editor')
  )
)
with check (
  deleted_at is null and exists (
    select 1
    from public.projects p
    where p.id = project_id
      and p.deleted_at is null
      and public.has_min_role(p.organization_id, 'editor')
  )
);

drop policy if exists scenarios_delete_owner on public.scenarios;
create policy scenarios_delete_owner
on public.scenarios
for delete
using (
  exists (
    select 1
    from public.projects p
    where p.id = project_id
      and public.has_org_role(p.organization_id, 'owner')
  )
);

-- Project versions
drop policy if exists project_versions_select_member on public.project_versions;
create policy project_versions_select_member
on public.project_versions
for select
using (
  deleted_at is null and exists (
    select 1
    from public.projects p
    where p.id = project_id
      and p.deleted_at is null
      and public.is_org_member(p.organization_id)
  )
);

drop policy if exists project_versions_insert_editor on public.project_versions;
create policy project_versions_insert_editor
on public.project_versions
for insert
with check (
  deleted_at is null and exists (
    select 1
    from public.projects p
    where p.id = project_id
      and p.deleted_at is null
      and public.has_min_role(p.organization_id, 'editor')
  )
);

drop policy if exists project_versions_update_owner on public.project_versions;
create policy project_versions_update_owner
on public.project_versions
for update
using (
  deleted_at is null and exists (
    select 1
    from public.projects p
    where p.id = project_id
      and public.has_org_role(p.organization_id, 'owner')
  )
)
with check (
  exists (
    select 1
    from public.projects p
    where p.id = project_id
      and public.has_org_role(p.organization_id, 'owner')
  )
);

-- Audit logs are readable by active members in the same org.
drop policy if exists audit_logs_select_member on public.audit_logs;
create policy audit_logs_select_member
on public.audit_logs
for select
using (
  public.is_org_member(organization_id)
);

-- Inserts should only be done by backend role. Keep client blocked by default.
revoke insert, update, delete on public.audit_logs from authenticated;
