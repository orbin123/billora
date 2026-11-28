-- Run as postgres in a transaction. The test accounts and data roll back.
begin;
insert into auth.users (id, email, email_confirmed_at, is_anonymous, raw_app_meta_data, raw_user_meta_data) values
  ('b1111111-1111-4111-8111-111111111111', 'admin@billora.invalid', now(), false, '{"billora_admin": true}', '{}'),
  ('b2222222-2222-4222-8222-222222222222', 'other@billora.invalid', now(), false, '{}', '{"billora_admin": true}'),
  ('b4444444-4444-4444-8444-444444444444', 'second@billora.invalid', now(), false, '{"billora_admin": true}', '{}');

-- Seed a separate legacy workspace so tenant isolation stays covered.
insert into public.billora_workspaces (id, name)
  values ('b2222222-2222-4222-8222-222222222222', 'Other workspace');
insert into public.billora_roles (workspace_id, id, name, permissions)
  values ('b2222222-2222-4222-8222-222222222222', 'employee', 'Employee', array['View bills','Create bills']::public.billora_permission[]);
insert into public.billora_members (workspace_id, auth_user_id, name, email, role_id, invite_code, invite_expires_at)
  values ('b2222222-2222-4222-8222-222222222222', 'b2222222-2222-4222-8222-222222222222', 'Other cashier', 'other@billora.invalid', 'employee', null, null);
with category as (
  insert into public.billora_categories (workspace_id, name)
  values ('b2222222-2222-4222-8222-222222222222', 'Meals') returning id, workspace_id
)
insert into public.billora_foods (workspace_id, category_id, name, price_paise, quantity, status)
  select workspace_id, id, 'Thali', 10000, 1, 'Available' from category;

set local role authenticated;
do $$
declare
  owner_a uuid := 'b1111111-1111-4111-8111-111111111111';
  other_cashier uuid := 'b2222222-2222-4222-8222-222222222222';
  staff uuid := 'b3333333-3333-4333-8333-333333333333';
  ws_a uuid;
  ws_b uuid;
  category integer;
  food integer;
  employee uuid;
  owner_member uuid;
  checked_out public.billora_bills;
  sale_key uuid := gen_random_uuid();
  lines jsonb;
  other_food integer;
begin
  perform set_config('request.jwt.claim.sub', owner_a::text, true);
  perform public.billora_enroll('Owner A', 'Test workspace', null);
  perform public.billora_enroll('Owner A', 'Test workspace', null);
  select id into strict ws_a from public.billora_workspaces;
  update public.billora_workspaces set gst_component_bps = 250 where id = ws_a;

  insert into public.billora_categories (workspace_id, name) values (ws_a, 'Meals') returning id into category;
  insert into public.billora_foods (workspace_id, category_id, name, price_paise, quantity, status)
    values (ws_a, category, 'Thali', 10000, 2, 'Available') returning id into food;
  select id into strict owner_member from public.billora_members where auth_user_id = owner_a;
  perform public.billora_check_employee_login(null, 'staff@employees.billora.invalid', 'employee');
  begin
    perform public.billora_check_employee_login(null, 'staff@employees.billora.invalid', 'manager');
    raise exception 'The admin role was accepted for an employee';
  exception when sqlstate 'P0001' then
    if sqlerrm not like 'Choose an employee role%' then raise; end if;
  end;

  reset role;
  insert into auth.users (id, email, email_confirmed_at, is_anonymous, raw_app_meta_data)
    values (staff, 'staff@employees.billora.invalid', now(), false, '{}');
  update auth.users set raw_app_meta_data = jsonb_build_object('billora_employee', jsonb_build_object(
    'workspace_id', ws_a, 'owner_id', owner_member, 'role_id', 'employee', 'name', 'Cashier', 'active', true
  )) where id = staff;
  set local role authenticated;
  select id into strict employee from public.billora_members where auth_user_id = staff;

  perform set_config('request.jwt.claim.sub', 'b4444444-4444-4444-8444-444444444444', true);
  begin
    perform public.billora_enroll('Second admin', 'Other workspace', null);
    raise exception 'A second trusted account became admin';
  exception when insufficient_privilege then null;
  end;

  perform set_config('request.jwt.claim.sub', other_cashier::text, true);
  begin
    perform public.billora_enroll('Other cashier', 'Other workspace', null);
    raise exception 'User-controlled metadata enabled admin enrollment';
  exception when insufficient_privilege then null;
  end;
  select id into strict ws_b from public.billora_workspaces;
  if ws_a = ws_b or exists (select 1 from public.billora_foods where id = food) or exists (select 1 from public.billora_members where id = employee) then
    raise exception 'Cross-workspace data visible';
  end if;
  select id into strict other_food from public.billora_foods;
  begin
    perform public.billora_check_employee_login(null, 'staff@employees.billora.invalid', 'employee');
    raise exception 'An employee could provision a login';
  exception when insufficient_privilege then null;
  end;

  select * into checked_out from public.billora_checkout(gen_random_uuid(),
    jsonb_build_array(jsonb_build_object('id', other_food, 'quantity', 1, 'pricePaise', 10000)),
    '', 'Dine In', 'Cash', 10000, 'INR', 0);
  if checked_out.number <> 1 then raise exception 'New workspace did not get its own bill numbering'; end if;

  perform set_config('request.jwt.claim.sub', staff::text, true);
  begin
    perform public.billora_enroll(null, null, gen_random_uuid());
    raise exception 'The old invitation enrollment path is still open';
  exception when insufficient_privilege then null;
  end;
  if (select count(*) from public.billora_foods) <> 1 or exists (select 1 from public.billora_members where id <> employee) then
    raise exception 'Employee did not receive the expected scoped data';
  end if;
  update public.billora_foods set quantity = 100 where id = food;
  if found then raise exception 'Cashier edited stock directly'; end if;
  update public.billora_members set role_id = 'manager' where id = employee;
  if found then raise exception 'Cashier promoted their own account'; end if;

  insert into public.billora_held_bills (member_id, draft) values (employee, '{"customerName":"Held test"}')
    on conflict (member_id) do update set member_id = excluded.member_id, draft = excluded.draft;
  if (select count(*) from public.billora_held_bills) <> 1 then raise exception 'Cashier could not hold a bill'; end if;

  lines := jsonb_build_array(jsonb_build_object('id', food, 'quantity', 2, 'pricePaise', 10000));
  begin
    perform public.billora_checkout(gen_random_uuid(), lines, '', 'Dine In', 'Cash', 1, 'INR', 250);
    raise exception 'Invalid cash amount accepted';
  exception when sqlstate 'P0001' then
    if sqlerrm not like 'Enter a valid cash amount%' then raise; end if;
  end;
  if (select quantity from public.billora_foods where id = food) <> 2 then
    raise exception 'Failed checkout changed stock';
  end if;

  select * into checked_out from public.billora_checkout(sale_key, lines, '', 'Dine In', 'Cash', 22000, 'INR', 250);
  if checked_out.number <> 1 or checked_out.total_paise <> 21000 or checked_out.cashier_id <> employee then
    raise exception 'Incorrect bill number, financial total, or cashier';
  end if;
  if exists (select 1 from public.billora_held_bills) then raise exception 'Checkout retained the held draft'; end if;
  perform public.billora_checkout(sale_key, lines, '', 'Dine In', 'Cash', 22000, 'INR', 250);
  if (select count(*) from public.billora_bills) <> 1 or (select quantity from public.billora_foods where id = food) <> 0 then
    raise exception 'Retry duplicated sale or stock adjustment';
  end if;
  begin
    perform public.billora_report('Today');
    raise exception 'Cashier accessed an unauthorized report';
  exception when insufficient_privilege then null;
  end;

  perform set_config('request.jwt.claim.sub', owner_a::text, true);
  if (public.billora_report('Today')->>'count')::integer <> 1 then
    raise exception 'Report is missing the sale';
  end if;
  perform public.billora_remove_bills(array[checked_out.number], null);
  if (public.billora_report('Today')->>'count')::integer <> 0 or exists (select 1 from public.billora_bills) then
    raise exception 'Deleted bill still appears';
  end if;
  update public.billora_members set active = false where id = employee;

  perform set_config('request.jwt.claim.sub', staff::text, true);
  if exists (select 1 from public.billora_workspaces) or exists (select 1 from public.billora_foods) then
    raise exception 'Inactive employee retained workspace access';
  end if;
end;
$$;
rollback;
