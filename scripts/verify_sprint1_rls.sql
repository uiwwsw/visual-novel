\set ON_ERROR_STOP on

begin;

-- Fixed IDs for deterministic checks.
select
  '00000000-0000-0000-0000-000000000001'::uuid as org_id,
  '00000000-0000-0000-0000-000000000011'::uuid as owner_uid,
  '00000000-0000-0000-0000-000000000022'::uuid as editor_uid,
  '00000000-0000-0000-0000-000000000033'::uuid as viewer_uid
\gset

-- Seed minimal tenant data as privileged role.
insert into public.organizations (id, name, slug, owner_user_id, plan_tier)
values (:'org_id', 'RLS Test Org', 'rls-test-org', :'owner_uid', 'pro')
on conflict (id) do nothing;

insert into public.memberships (organization_id, user_id, role, status)
values
  (:'org_id', :'owner_uid', 'owner', 'active'),
  (:'org_id', :'editor_uid', 'editor', 'active'),
  (:'org_id', :'viewer_uid', 'viewer', 'active')
on conflict (organization_id, user_id) do update
set role = excluded.role,
    status = excluded.status,
    deleted_at = null;

-- Ensure authenticated role can exercise table-level privileges for RLS checks.
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.organizations to authenticated;
grant select, insert, update, delete on public.memberships to authenticated;
grant select, insert, update, delete on public.projects to authenticated;
grant select, insert, update, delete on public.scenarios to authenticated;
grant select, insert, update, delete on public.project_versions to authenticated;
grant select on public.audit_logs to authenticated;

set local role authenticated;

-- viewer: insert project must fail.
select set_config('request.jwt.claim.sub', :'viewer_uid', true);
do $$
begin
  begin
    insert into public.projects (organization_id, name, slug, created_by, updated_by)
    values (
      '00000000-0000-0000-0000-000000000001',
      'Viewer Forbidden Project',
      'viewer-forbidden-' || substring(md5(random()::text), 1, 8),
      '00000000-0000-0000-0000-000000000033',
      '00000000-0000-0000-0000-000000000033'
    );
    raise exception 'viewer insert unexpectedly succeeded';
  exception
    when insufficient_privilege then
      null;
  end;
end
$$;

-- editor: insert project must pass.
select set_config('request.jwt.claim.sub', :'editor_uid', true);
insert into public.projects (organization_id, name, slug, created_by, updated_by)
values (
  :'org_id',
  'Editor Allowed Project',
  'editor-allowed-' || substring(md5(random()::text), 1, 8),
  :'editor_uid',
  :'editor_uid'
);

-- owner: can update membership role.
select set_config('request.jwt.claim.sub', :'owner_uid', true);
update public.memberships
set role = 'viewer'
where organization_id = :'org_id'
  and user_id = :'editor_uid';

-- revert role for idempotent re-runs.
update public.memberships
set role = 'editor'
where organization_id = :'org_id'
  and user_id = :'editor_uid';

rollback;
