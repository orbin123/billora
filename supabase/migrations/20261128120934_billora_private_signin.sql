begin;

create function billora_private.check_employee_login(
  p_workspace uuid, p_owner uuid, p_member uuid, p_email text, p_role text
) returns void
language plpgsql set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.billora_members
    where id = p_owner and workspace_id = p_workspace and role_id = 'manager' and active
  ) then
    raise exception 'Only the workspace owner can create employee logins.' using errcode = '42501';
  end if;

  if p_role = 'manager' or not exists (
    select 1 from public.billora_roles where workspace_id = p_workspace and id = p_role
  ) then
    raise exception 'Choose an employee role from this workspace.' using errcode = 'P0001';
  end if;

  if p_member is null then
    if exists (select 1 from public.billora_members where workspace_id = p_workspace and email = p_email) then
      raise exception 'This email already has a team record. Edit that employee to set up their login.' using errcode = 'P0001';
    end if;
  elsif not exists (
    select 1 from public.billora_members
    where id = p_member and workspace_id = p_workspace and email = p_email and auth_user_id is null
  ) then
    raise exception 'This employee no longer has a pending invitation. Reload the workspace.' using errcode = 'P0001';
  end if;
end;
$$;

create function public.billora_check_employee_login(p_member uuid, p_email text, p_role text) returns void
language sql set search_path = ''
as $$
  select billora_private.check_employee_login(
    billora_private.workspace_id(), billora_private.member_id(), p_member, p_email, p_role
  )
$$;

revoke execute on function billora_private.check_employee_login(uuid, uuid, uuid, text, text),
  public.billora_check_employee_login(uuid, text, text) from public, anon, authenticated;
grant execute on function billora_private.check_employee_login(uuid, uuid, uuid, text, text),
  public.billora_check_employee_login(uuid, text, text) to authenticated;

-- Auth Admin can attach app metadata after inserting the user in the same transaction.
create function billora_private.attach_password_employee() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  assignment jsonb := new.raw_app_meta_data -> 'billora_employee';
  workspace uuid;
  pending_member uuid;
  employee_role text;
  address text;
begin
  if assignment is null then return new; end if;
  if tg_op = 'UPDATE' and old.raw_app_meta_data -> 'billora_employee' is not distinct from assignment then
    return new;
  end if;

  workspace := (assignment ->> 'workspace_id')::uuid;
  pending_member := (assignment ->> 'member_id')::uuid;
  employee_role := assignment ->> 'role_id';
  address := lower(new.email);
  perform billora_private.check_employee_login(
    workspace, (assignment ->> 'owner_id')::uuid, pending_member, address, employee_role
  );

  if pending_member is null then
    insert into public.billora_members (
      workspace_id, auth_user_id, name, email, role_id, active, invite_code, invite_expires_at
    ) values (
      workspace, new.id, assignment ->> 'name', address, employee_role,
      (assignment ->> 'active')::boolean, null, null
    );
  else
    update public.billora_members
      set auth_user_id = new.id, name = assignment ->> 'name', role_id = employee_role,
        active = (assignment ->> 'active')::boolean, invite_code = null, invite_expires_at = null
      where workspace_id = workspace and id = pending_member and email = address and auth_user_id is null;
    if not found then
      raise exception 'The employee invitation changed while the login was being created.' using errcode = 'P0001';
    end if;
  end if;
  return new;
end;
$$;

revoke execute on function billora_private.attach_password_employee() from public, anon, authenticated;
create trigger billora_attach_password_employee after insert or update of raw_app_meta_data on auth.users
for each row execute function billora_private.attach_password_employee();

-- There is one admin per installation. Only a trusted Auth Admin can set billora_admin.
create unique index billora_single_admin on public.billora_members (role_id) where role_id = 'manager';

create or replace function billora_private.enroll(p_name text, p_business text, p_invite uuid) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  account uuid := (select auth.uid());
  verified_email text;
  workspace uuid;
begin
  select lower(email) into verified_email from auth.users
  where id = account and email_confirmed_at is not null and not is_anonymous
    and raw_app_meta_data -> 'billora_admin' = 'true'::jsonb;
  if verified_email is null or p_invite is not null then
    raise exception 'Only the designated admin can set up Billora.' using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('billora.admin.enrollment', 0));
  if exists (select 1 from public.billora_members where auth_user_id = account and role_id = 'manager') then
    return;
  end if;
  if exists (select 1 from public.billora_members where role_id = 'manager' or auth_user_id = account) then
    raise exception 'Billora already has an admin.' using errcode = '42501';
  end if;

  insert into public.billora_workspaces (name) values (btrim(p_business)) returning id into workspace;
  insert into public.billora_roles (workspace_id, id, name, permissions) values
    (workspace, 'manager', 'Owner', enum_range(null::public.billora_permission)),
    (workspace, 'employee', 'Employee', array['View bills','Create bills','Print bills']::public.billora_permission[]);
  insert into public.billora_members (workspace_id, auth_user_id, name, email, role_id, invite_code, invite_expires_at)
    values (workspace, account, btrim(p_name), verified_email, 'manager', null, null);
end;
$$;

revoke execute on function public.billora_renew_invite(uuid), billora_private.renew_invite(uuid) from authenticated;
revoke insert on public.billora_members from authenticated;
revoke insert (workspace_id, name, email, role_id, active) on public.billora_members from authenticated;
drop policy billora_member_create on public.billora_members;

commit;
