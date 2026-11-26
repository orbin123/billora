drop policy billora_category_manage on public.billora_categories;

create policy billora_category_create on public.billora_categories for insert to authenticated
  with check (workspace_id = (select billora_private.workspace_id()) and (select billora_private.is_owner()));
create policy billora_category_edit on public.billora_categories for update to authenticated
  using (workspace_id = (select billora_private.workspace_id()) and (select billora_private.is_owner()))
  with check (workspace_id = (select billora_private.workspace_id()) and (select billora_private.is_owner()));
create policy billora_category_remove on public.billora_categories for delete to authenticated
  using (workspace_id = (select billora_private.workspace_id()) and (select billora_private.is_owner()));

-- PostgREST upsert sets the conflict key as well as the draft. Both RLS checks
-- tie that key to the active cashier, including on direct Data API requests.
grant update (member_id) on public.billora_held_bills to authenticated;
