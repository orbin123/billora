create schema billora_private;
revoke all on schema billora_private from public;
grant usage on schema billora_private to authenticated;

create type public.billora_permission as enum (
  'View products', 'Add products', 'Edit products', 'Delete products', 'Upload product images',
  'View bills', 'Create bills', 'Edit bills', 'Delete bills', 'Print bills',
  'View daily reports', 'View weekly reports', 'View monthly reports', 'Export reports'
);

create table public.billora_workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 80),
  address_lines text[] not null default '{}',
  gstin text not null default '' check (char_length(gstin) <= 30),
  phone text not null default '' check (char_length(phone) <= 35),
  fssai_license text not null default '' check (char_length(fssai_license) <= 30),
  currency text not null default 'INR' check (currency in ('INR', 'USD', 'GBP', 'EUR', 'AED', 'SGD', 'AUD', 'CAD')),
  time_zone text not null default 'Asia/Kolkata' check (time_zone in ('Asia/Kolkata', 'Asia/Dubai', 'Asia/Singapore', 'Europe/London', 'Europe/Paris', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'America/Toronto', 'Australia/Sydney', 'UTC')),
  gst_component_bps integer not null default 0 check (gst_component_bps between 0 and 5000),
  paper smallint not null default 58 check (paper in (58, 80)),
  check (cardinality(address_lines) <= 5 and char_length(array_to_string(address_lines, '')) <= 600)
);

create table public.billora_roles (
  workspace_id uuid not null references public.billora_workspaces(id),
  id text not null default gen_random_uuid()::text,
  name text not null check (char_length(btrim(name)) between 1 and 60),
  permissions public.billora_permission[] not null default '{}'
    check (cardinality(permissions) <= 14 and array_position(permissions, null) is null),
  primary key (workspace_id, id),
  check (id not in ('manager', 'employee') or name = case id when 'manager' then 'Owner' else 'Employee' end)
);
create unique index billora_role_name on public.billora_roles (workspace_id, lower(btrim(name)));

create table public.billora_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  auth_user_id uuid unique references auth.users(id),
  name text not null check (char_length(btrim(name)) between 1 and 60),
  email text not null check (char_length(email) <= 254 and email = lower(btrim(email)) and email ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'),
  role_id text not null,
  active boolean not null default true,
  invite_code uuid unique default gen_random_uuid(),
  invite_expires_at timestamptz default now() + interval '7 days',
  foreign key (workspace_id, role_id) references public.billora_roles(workspace_id, id),
  check ((auth_user_id is null) = (invite_code is not null)),
  check ((auth_user_id is null) = (invite_expires_at is not null)),
  check (role_id <> 'manager' or (auth_user_id is not null and active))
);
create unique index billora_member_email on public.billora_members (workspace_id, email);
create index billora_member_role on public.billora_members (workspace_id, role_id);

create table public.billora_categories (
  workspace_id uuid not null references public.billora_workspaces(id),
  id integer generated always as identity,
  name text not null check (char_length(btrim(name)) between 1 and 60),
  status text not null default 'Active' check (status in ('Active', 'Inactive')),
  color text not null default 'special' check (color in ('rice', 'curry', 'fish', 'bread', 'drink', 'special')),
  primary key (workspace_id, id)
);
create unique index billora_category_name on public.billora_categories (workspace_id, lower(btrim(name)));

create table public.billora_foods (
  workspace_id uuid not null,
  id integer generated always as identity,
  category_id integer not null,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  price_paise integer not null check (price_paise between 1 and 99999999),
  quantity integer not null check (quantity between 0 and 999999),
  status text not null check (status in ('Available', 'Unavailable')),
  emoji text not null default '🍽️' check (char_length(emoji) <= 16),
  tone text not null default 'rice' check (tone in ('rice', 'curry', 'fish', 'bread', 'drink', 'special')),
  image text check (char_length(image) <= 2796250 and image ~ '^data:image/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$'),
  image_revision uuid,
  version integer not null default 1,
  primary key (workspace_id, id),
  foreign key (workspace_id, category_id) references public.billora_categories(workspace_id, id)
);
create index billora_food_category on public.billora_foods (workspace_id, category_id);

create table public.billora_held_bills (
  member_id uuid primary key references public.billora_members(id) on delete cascade,
  draft jsonb not null check (jsonb_typeof(draft) = 'object' and octet_length(draft::text) <= 75000)
);

create table public.billora_bills (
  workspace_id uuid not null references public.billora_workspaces(id),
  number bigint generated always as identity,
  checkout_id uuid not null,
  cashier_id uuid not null,
  cashier text not null,
  created_at timestamptz not null default now(),
  business_day date not null,
  customer_name text not null check (char_length(customer_name) <= 120),
  order_type text not null check (order_type in ('Pick Up', 'Dine In')),
  payment text not null check (payment in ('Cash', 'UPI', 'GPay', 'PhonePe', 'Card')),
  lines jsonb not null,
  subtotal_paise bigint not null,
  tax_component_paise bigint not null,
  round_off_paise bigint not null,
  total_paise bigint not null,
  received_paise bigint,
  receipt_profile jsonb not null,
  deleted_at timestamptz,
  primary key (workspace_id, number),
  unique (workspace_id, checkout_id)
);
create index billora_bills_day on public.billora_bills (workspace_id, business_day, number) where deleted_at is null;

create function billora_private.workspace_id() returns uuid
language sql stable security definer set search_path = ''
as $$
  select m.workspace_id from public.billora_members m
  where m.auth_user_id = (select auth.uid()) and m.active
$$;

create function billora_private.member_id() returns uuid
language sql stable security definer set search_path = ''
as $$
  select m.id from public.billora_members m
  where m.auth_user_id = (select auth.uid()) and m.active
$$;

create function billora_private.is_owner() returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.billora_members m
    where m.auth_user_id = (select auth.uid()) and m.active and m.role_id = 'manager')
$$;

create function billora_private.can(p_permissions public.billora_permission[]) returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.billora_members m
    join public.billora_roles r on r.workspace_id = m.workspace_id and r.id = m.role_id
    where m.auth_user_id = (select auth.uid()) and m.active
      and (m.role_id = 'manager' or r.permissions && p_permissions))
$$;

alter table public.billora_workspaces enable row level security;
alter table public.billora_roles enable row level security;
alter table public.billora_members enable row level security;
alter table public.billora_categories enable row level security;
alter table public.billora_foods enable row level security;
alter table public.billora_held_bills enable row level security;
alter table public.billora_bills enable row level security;

revoke all on public.billora_workspaces, public.billora_roles, public.billora_members,
  public.billora_categories, public.billora_foods, public.billora_held_bills, public.billora_bills
  from public, anon, authenticated;
grant select on public.billora_workspaces, public.billora_roles, public.billora_members, public.billora_categories,
  public.billora_foods, public.billora_held_bills, public.billora_bills to authenticated;
grant update (name, address_lines, gstin, phone, fssai_license, currency, time_zone, gst_component_bps, paper)
  on public.billora_workspaces to authenticated;
grant insert (workspace_id, name, permissions), update (name, permissions), delete on public.billora_roles to authenticated;
grant insert (workspace_id, name, email, role_id, active), update (name, role_id, active), delete
  on public.billora_members to authenticated;
grant insert (workspace_id, name, status), update (name, status), delete on public.billora_categories to authenticated;
grant insert (workspace_id, category_id, name, price_paise, quantity, status, emoji, tone, image),
  update (category_id, name, price_paise, quantity, status, emoji, tone, image), delete on public.billora_foods to authenticated;
grant insert (member_id, draft), update (draft), delete on public.billora_held_bills to authenticated;
grant update (customer_name, order_type) on public.billora_bills to authenticated;

create policy billora_workspace_read on public.billora_workspaces for select to authenticated
  using (id = (select billora_private.workspace_id()));
create policy billora_workspace_update on public.billora_workspaces for update to authenticated
  using (id = (select billora_private.workspace_id()) and (select billora_private.is_owner()))
  with check (id = (select billora_private.workspace_id()) and (select billora_private.is_owner()));

create policy billora_member_read on public.billora_members for select to authenticated
  using (auth_user_id = (select auth.uid()) or (workspace_id = (select billora_private.workspace_id()) and (select billora_private.is_owner())));
create policy billora_member_create on public.billora_members for insert to authenticated
  with check (workspace_id = (select billora_private.workspace_id()) and (select billora_private.is_owner()) and role_id <> 'manager');
create policy billora_member_edit on public.billora_members for update to authenticated
  using (workspace_id = (select billora_private.workspace_id()) and (select billora_private.is_owner()) and role_id <> 'manager')
  with check (workspace_id = (select billora_private.workspace_id()) and (select billora_private.is_owner()) and role_id <> 'manager');
create policy billora_member_remove on public.billora_members for delete to authenticated
  using (workspace_id = (select billora_private.workspace_id()) and (select billora_private.is_owner()) and role_id <> 'manager');

create policy billora_role_read on public.billora_roles for select to authenticated
  using (workspace_id = (select billora_private.workspace_id()) and ((select billora_private.is_owner()) or
    exists (select 1 from public.billora_members m where m.id = (select billora_private.member_id()) and m.role_id = billora_roles.id)));
create policy billora_role_create on public.billora_roles for insert to authenticated
  with check (workspace_id = (select billora_private.workspace_id()) and (select billora_private.is_owner()));
create policy billora_role_edit on public.billora_roles for update to authenticated
  using (workspace_id = (select billora_private.workspace_id()) and (select billora_private.is_owner()) and id <> 'manager')
  with check (workspace_id = (select billora_private.workspace_id()) and (select billora_private.is_owner()) and id <> 'manager');
create policy billora_role_remove on public.billora_roles for delete to authenticated
  using (workspace_id = (select billora_private.workspace_id()) and (select billora_private.is_owner()) and id not in ('manager', 'employee'));

create policy billora_category_read on public.billora_categories for select to authenticated
  using (workspace_id = (select billora_private.workspace_id()) and (
    (select billora_private.can(array['View products','Add products','Edit products','Delete products']::public.billora_permission[]))
    or (status = 'Active' and (select billora_private.can(array['Create bills']::public.billora_permission[])))));
create policy billora_category_manage on public.billora_categories for all to authenticated
  using (workspace_id = (select billora_private.workspace_id()) and (select billora_private.is_owner()))
  with check (workspace_id = (select billora_private.workspace_id()) and (select billora_private.is_owner()));

create policy billora_food_read on public.billora_foods for select to authenticated
  using (workspace_id = (select billora_private.workspace_id()) and (
    (select billora_private.can(array['View products','Add products','Edit products','Delete products']::public.billora_permission[]))
    or (status = 'Available' and (select billora_private.can(array['Create bills']::public.billora_permission[])) and
      exists (select 1 from public.billora_categories c where c.workspace_id = billora_foods.workspace_id and c.id = billora_foods.category_id and c.status = 'Active'))));
create policy billora_food_create on public.billora_foods for insert to authenticated
  with check (workspace_id = (select billora_private.workspace_id()) and (select billora_private.can(array['Add products']::public.billora_permission[])));
create policy billora_food_edit on public.billora_foods for update to authenticated
  using (workspace_id = (select billora_private.workspace_id()) and (select billora_private.can(array['Edit products']::public.billora_permission[])))
  with check (workspace_id = (select billora_private.workspace_id()) and (select billora_private.can(array['Edit products']::public.billora_permission[])));
create policy billora_food_remove on public.billora_foods for delete to authenticated
  using (workspace_id = (select billora_private.workspace_id()) and (select billora_private.can(array['Delete products']::public.billora_permission[])));

create policy billora_held_manage on public.billora_held_bills for all to authenticated
  using (member_id = (select billora_private.member_id()) and (select billora_private.can(array['Create bills']::public.billora_permission[])))
  with check (member_id = (select billora_private.member_id()) and (select billora_private.can(array['Create bills']::public.billora_permission[])));

create policy billora_bill_read on public.billora_bills for select to authenticated
  using (workspace_id = (select billora_private.workspace_id()) and deleted_at is null and
    (select billora_private.can(array['View bills']::public.billora_permission[])));
create policy billora_bill_edit on public.billora_bills for update to authenticated
  using (workspace_id = (select billora_private.workspace_id()) and deleted_at is null and
    (select billora_private.can(array['Edit bills']::public.billora_permission[])))
  with check (workspace_id = (select billora_private.workspace_id()) and deleted_at is null and
    (select billora_private.can(array['Edit bills']::public.billora_permission[])));

create function billora_private.food_revision() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    new.version := old.version + 1;
    if new.image is not distinct from old.image then return new; end if;
  elsif new.image is null then
    return new;
  end if;

  if not billora_private.can(array['Upload product images']::public.billora_permission[]) then
    raise exception 'You do not have permission to change product images.' using errcode = '42501';
  end if;
  new.image_revision := case when new.image is not null then gen_random_uuid() end;
  return new;
end;
$$;
create trigger billora_food_revision before insert or update on public.billora_foods
for each row execute function billora_private.food_revision();

create function billora_private.enroll(p_name text, p_business text, p_invite uuid) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  account uuid := (select auth.uid());
  verified_email text;
  workspace uuid;
begin
  select lower(email) into verified_email
  from auth.users where id = account and email_confirmed_at is not null and not is_anonymous;
  if verified_email is null then
    raise exception 'Verify your email and sign in first.' using errcode = '42501';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(account::text, 0));

  if exists (select 1 from public.billora_members where auth_user_id = account) then
    if p_invite is not null then
      raise exception 'This account already belongs to a workspace.' using errcode = 'P0001';
    end if;
    return;
  end if;

  if p_invite is not null then
    update public.billora_members
      set auth_user_id = account, invite_code = null, invite_expires_at = null
      where invite_code = p_invite and invite_expires_at > now()
        and email = verified_email and active and auth_user_id is null;
    if not found then
      raise exception 'This invitation is unavailable. Sign in with the invited email or ask the owner for a new link.' using errcode = 'P0001';
    end if;
    return;
  end if;

  insert into public.billora_workspaces (name) values (btrim(p_business)) returning id into workspace;
  insert into public.billora_roles (workspace_id, id, name, permissions) values
    (workspace, 'manager', 'Owner', enum_range(null::public.billora_permission)),
    (workspace, 'employee', 'Employee', array['View bills','Create bills','Print bills']::public.billora_permission[]);
  insert into public.billora_members (workspace_id, auth_user_id, name, email, role_id, invite_code, invite_expires_at)
    values (workspace, account, btrim(p_name), verified_email, 'manager', null, null);
end;
$$;

create function billora_private.renew_invite(p_member uuid) returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not billora_private.is_owner() then
    raise exception 'Only the workspace owner can renew invitations.' using errcode = '42501';
  end if;
  update public.billora_members set invite_code = gen_random_uuid(), invite_expires_at = now() + interval '7 days'
    where workspace_id = billora_private.workspace_id() and id = p_member and auth_user_id is null;
  if not found then raise exception 'This employee no longer has a pending invitation.' using errcode = 'P0001'; end if;
end;
$$;

create function billora_private.checkout(
  p_key uuid, p_lines jsonb, p_customer text, p_order_type text, p_payment text, p_received bigint, p_currency text, p_gst_bps integer
) returns public.billora_bills
language plpgsql security definer set search_path = ''
as $$
declare
  member public.billora_members;
  shop public.billora_workspaces;
  completed public.billora_bills;
  item record;
  product record;
  line_count integer := 0;
  saved_lines jsonb := '[]';
  subtotal bigint := 0;
  raw_component bigint;
  tax_component bigint;
  before_round bigint;
  charged bigint;
begin
  select * into member from public.billora_members
    where auth_user_id = (select auth.uid()) and active;
  if member.id is null or not billora_private.can(array['Create bills']::public.billora_permission[]) then
    raise exception 'You do not have permission to create bills.' using errcode = '42501';
  end if;
  if p_key is null or p_lines is null or jsonb_typeof(p_lines) <> 'array'
    or jsonb_array_length(p_lines) not between 1 and 200 then
    raise exception 'Add between 1 and 200 items before checkout.' using errcode = 'P0001';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(member.workspace_id::text || ':' || p_key::text, 1));
  select * into completed from public.billora_bills where workspace_id = member.workspace_id and checkout_id = p_key;
  if found then
    if completed.cashier_id <> member.id or completed.deleted_at is not null then
      raise exception 'This checkout reference is unavailable.' using errcode = 'P0001';
    end if;
    return completed;
  end if;

  select * into shop from public.billora_workspaces where id = member.workspace_id for share;
  if p_currency is distinct from shop.currency or p_gst_bps is distinct from shop.gst_component_bps then
    raise exception 'Tax or currency settings changed. Review the updated total before checkout.' using errcode = 'P0001';
  end if;

  -- Lock in item order so simultaneous checkouts cannot oversell or deadlock each other.
  for item in select * from jsonb_to_recordset(p_lines) as input(id integer, quantity integer, "pricePaise" integer) order by id
  loop
    if item.id is null or item.quantity is null or item.quantity not between 1 and 999999
      or item."pricePaise" is null or saved_lines @> jsonb_build_array(jsonb_build_object('id', item.id)) then
      raise exception 'The bill contains invalid or duplicate items.' using errcode = 'P0001';
    end if;
    select f.name, f.price_paise, f.quantity into product
      from public.billora_foods f
      join public.billora_categories c on c.workspace_id = f.workspace_id and c.id = f.category_id
      where f.workspace_id = member.workspace_id and f.id = item.id and f.status = 'Available' and c.status = 'Active'
      for update of f for share of c;
    if not found or product.quantity < item.quantity then
      raise exception 'An item is unavailable or there is not enough stock. Review the bill and try again.' using errcode = 'P0001';
    end if;
    if product.price_paise <> item."pricePaise" then
      raise exception 'A food price changed. Review the updated price before checkout.' using errcode = 'P0001';
    end if;
    update public.billora_foods set quantity = quantity - item.quantity
      where workspace_id = member.workspace_id and id = item.id;
    subtotal := subtotal + product.price_paise::bigint * item.quantity;
    saved_lines := saved_lines || jsonb_build_array(jsonb_build_object(
      'id', item.id, 'name', product.name, 'price', product.price_paise / 100.0, 'quantity', item.quantity));
    line_count := line_count + 1;
  end loop;

  if line_count = 0 or subtotal > 99999999999 then
    raise exception 'This bill exceeds the supported checkout amount.' using errcode = 'P0001';
  end if;
  raw_component := subtotal * shop.gst_component_bps;
  tax_component := raw_component / 10000;
  if raw_component % 10000 > 5000 or (raw_component % 10000 = 5000 and tax_component % 2 = 1) then
    tax_component := tax_component + 1;
  end if;
  before_round := subtotal + 2 * tax_component;
  charged := case when shop.currency = 'INR' then ((before_round + 50) / 100) * 100 else before_round end;

  if p_payment = 'Cash' and (p_received is null or p_received < charged or p_received > 999999999999) then
    raise exception 'Enter a valid cash amount that covers the bill total.' using errcode = 'P0001';
  end if;
  insert into public.billora_bills (
    workspace_id, checkout_id, cashier_id, cashier, business_day, customer_name, order_type, payment, lines,
    subtotal_paise, tax_component_paise, round_off_paise, total_paise, received_paise, receipt_profile
  ) values (
    member.workspace_id, p_key, member.id, member.name, (now() at time zone shop.time_zone)::date,
    btrim(p_customer), p_order_type, p_payment, saved_lines, subtotal, tax_component, charged - before_round, charged,
    case when p_payment = 'Cash' then p_received end,
    jsonb_build_object('name', shop.name, 'addressLines', shop.address_lines, 'gstin', shop.gstin,
      'phone', shop.phone, 'fssaiLicense', shop.fssai_license, 'currency', shop.currency, 'timeZone', shop.time_zone,
      'gstComponentRate', shop.gst_component_bps / 100.0)
  ) returning * into completed;

  delete from public.billora_held_bills where member_id = member.id;
  return completed;
end;
$$;

create function billora_private.remove_bills(p_numbers bigint[], p_day date) returns integer
language plpgsql security definer set search_path = ''
as $$
declare
  removed integer;
begin
  if not billora_private.can(array['View bills']::public.billora_permission[]) or
    not billora_private.can(array['Delete bills']::public.billora_permission[]) then
    raise exception 'You do not have permission to delete bills.' using errcode = '42501';
  end if;
  if (p_numbers is null) = (p_day is null) then
    raise exception 'Choose a day or select bills to delete.' using errcode = 'P0001';
  end if;
  update public.billora_bills set deleted_at = now()
    where workspace_id = billora_private.workspace_id() and deleted_at is null
      and (number = any(p_numbers) or business_day = p_day);
  get diagnostics removed = row_count;
  return removed;
end;
$$;

create function billora_private.report(p_period text) returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  workspace uuid := billora_private.workspace_id();
  permission public.billora_permission;
  today date;
  start_day date;
begin
  permission := case p_period when 'Today' then 'View daily reports' when 'This week' then 'View weekly reports'
    when 'This month' then 'View monthly reports' else null end;
  if permission is null or not billora_private.can(array[permission]) then
    raise exception 'You do not have permission to view this report.' using errcode = '42501';
  end if;
  select (now() at time zone time_zone)::date into today from public.billora_workspaces where id = workspace;
  start_day := case p_period when 'This month' then date_trunc('month', today)::date
    when 'This week' then date_trunc('week', today)::date else today end;
  return (
    with bills as materialized (
      select business_day, payment, total_paise, lines, receipt_profile->>'currency' as currency
      from public.billora_bills
      where workspace_id = workspace and deleted_at is null and business_day between start_day and today
    ),
    quantities as (
      select line->>'name' as name, sum((line->>'quantity')::integer) as items
      from bills cross join lateral jsonb_array_elements(lines) as line group by 1
    ),
    daily as (select business_day, currency, sum(total_paise) as amount from bills group by 1, 2),
    payments as (select payment, currency, sum(total_paise) as amount from bills group by 1, 2),
    totals as (select currency, sum(total_paise) as amount from bills group by 1)
    select jsonb_build_object(
      'count', (select count(*) from bills), 'items', (select coalesce(sum(items), 0) from quantities),
      'revenue', coalesce((select jsonb_agg(to_jsonb(daily) order by business_day, currency) from daily), '[]'),
      'payments', coalesce((select jsonb_agg(to_jsonb(payments) order by payment, currency) from payments), '[]'),
      'foods', coalesce((select jsonb_agg(to_jsonb(quantities) order by items desc, name) from quantities), '[]'),
      'totals', coalesce((select jsonb_agg(to_jsonb(totals) order by currency) from totals), '[]')
    )
  );
end;
$$;

-- PostgREST exposes these invoker wrappers. Privileged implementations stay in a private schema.
create function public.billora_enroll(p_name text, p_business text, p_invite uuid) returns void
language sql set search_path = '' as $$ select billora_private.enroll(p_name, p_business, p_invite) $$;
create function public.billora_renew_invite(p_member uuid) returns void
language sql set search_path = '' as $$ select billora_private.renew_invite(p_member) $$;
create function public.billora_checkout(
  p_key uuid, p_lines jsonb, p_customer text, p_order_type text, p_payment text, p_received bigint, p_currency text, p_gst_bps integer
) returns public.billora_bills
language sql set search_path = '' as $$
  select * from billora_private.checkout(p_key, p_lines, p_customer, p_order_type, p_payment, p_received, p_currency, p_gst_bps)
$$;
create function public.billora_remove_bills(p_numbers bigint[], p_day date) returns integer
language sql set search_path = '' as $$ select billora_private.remove_bills(p_numbers, p_day) $$;
create function public.billora_report(p_period text) returns jsonb
language sql stable set search_path = '' as $$ select billora_private.report(p_period) $$;

revoke execute on all functions in schema billora_private from public, anon, authenticated;
grant execute on function billora_private.workspace_id(), billora_private.member_id(), billora_private.is_owner(),
  billora_private.can(public.billora_permission[]), billora_private.enroll(text, text, uuid), billora_private.renew_invite(uuid),
  billora_private.checkout(uuid, jsonb, text, text, text, bigint, text, integer),
  billora_private.remove_bills(bigint[], date), billora_private.report(text) to authenticated;
revoke execute on function public.billora_enroll(text, text, uuid), public.billora_renew_invite(uuid),
  public.billora_checkout(uuid, jsonb, text, text, text, bigint, text, integer),
  public.billora_remove_bills(bigint[], date), public.billora_report(text) from public, anon, authenticated;
grant execute on function public.billora_enroll(text, text, uuid), public.billora_renew_invite(uuid),
  public.billora_checkout(uuid, jsonb, text, text, text, bigint, text, integer),
  public.billora_remove_bills(bigint[], date), public.billora_report(text) to authenticated;
