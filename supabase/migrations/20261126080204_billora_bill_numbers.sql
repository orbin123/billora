-- Bill numbers are scoped to each business. A private counter serializes
-- numbering within a workspace as part of the checkout transaction.
begin;

lock table public.billora_bills in access exclusive mode;

create table billora_private.bill_counters (
  workspace_id uuid primary key references public.billora_workspaces(id),
  last_number bigint not null check (last_number > 0)
);
alter table billora_private.bill_counters enable row level security;

insert into billora_private.bill_counters (workspace_id, last_number)
select workspace_id, max(number) from public.billora_bills group by workspace_id;

alter table public.billora_bills alter column number drop identity;

create function billora_private.assign_bill_number() returns trigger
language plpgsql set search_path = ''
as $$
begin
  insert into billora_private.bill_counters as counters (workspace_id, last_number) values (new.workspace_id, 1)
    on conflict (workspace_id) do update set last_number = counters.last_number + 1
    returning last_number into new.number;
  return new;
end;
$$;
revoke execute on function billora_private.assign_bill_number() from public, anon, authenticated;
create trigger billora_assign_bill_number before insert on public.billora_bills
for each row execute function billora_private.assign_bill_number();

commit;
