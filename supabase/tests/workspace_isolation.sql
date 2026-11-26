-- Run as postgres in a transaction. The test accounts and data roll back.
begin;
insert into auth.users (id, email, email_confirmed_at, is_anonymous) values
  ('b1111111-1111-4111-8111-111111111111', 'owner-a@billora.invalid', now(), false),
  ('b2222222-2222-4222-8222-222222222222', 'owner-b@billora.invalid', now(), false),
  ('b3333333-3333-4333-8333-333333333333', 'staff@billora.invalid', now(), false);

set local role authenticated;
do $$
declare
  owner_a uuid := 'b1111111-1111-4111-8111-111111111111';
  owner_b uuid := 'b2222222-2222-4222-8222-222222222222';
  staff uuid := 'b3333333-3333-4333-8333-333333333333';
  ws_a uuid;
  ws_b uuid;
  category integer;
  food integer;
  employee uuid;
  invitation uuid;
  checked_out public.billora_bills;
  sale_key uuid := gen_random_uuid();
  lines jsonb;
  other_category integer;
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
  insert into public.billora_members (workspace_id, name, email, role_id)
    values (ws_a, 'Cashier', 'staff@billora.invalid', 'employee') returning id, invite_code into employee, invitation;

  perform set_config('request.jwt.claim.sub', owner_b::text, true);
  begin
    perform public.billora_enroll(null, null, invitation);
    raise exception 'Wrong email accepted the invitation';
  exception when sqlstate 'P0001' then
    if sqlerrm not like 'This invitation is unavailable.%' then raise; end if;
  end;
  perform public.billora_enroll('Owner B', 'Test workspace', null);
  select id into strict ws_b from public.billora_workspaces;
  if ws_a = ws_b or exists (select 1 from public.billora_foods) or exists (select 1 from public.billora_members where id = employee) then
    raise exception 'Cross-workspace data visible';
  end if;
  begin
    insert into public.billora_foods (workspace_id, category_id, name, price_paise, quantity, status)
      values (ws_b, category, 'Wrong category', 10000, 2, 'Available');
    raise exception 'Cross-workspace category accepted';
  exception when foreign_key_violation then null;
  end;

  insert into public.billora_categories (workspace_id, name) values (ws_b, 'Meals') returning id into other_category;
  insert into public.billora_foods (workspace_id, category_id, name, price_paise, quantity, status)
    values (ws_b, other_category, 'Thali', 10000, 1, 'Available') returning id into other_food;
  select * into checked_out from public.billora_checkout(gen_random_uuid(),
    jsonb_build_array(jsonb_build_object('id', other_food, 'quantity', 1, 'pricePaise', 10000)),
    '', 'Dine In', 'Cash', 10000, 'INR', 0);
  if checked_out.number <> 1 then raise exception 'New workspace did not get its own bill numbering'; end if;

  perform set_config('request.jwt.claim.sub', staff::text, true);
  perform public.billora_enroll(null, null, invitation);
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
