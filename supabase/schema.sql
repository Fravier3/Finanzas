create table public.finance_workspaces (
 user_id uuid primary key references auth.users(id) on delete cascade,
 data jsonb not null default '{"items":[]}'::jsonb,
 revision integer not null default 0 check (revision >= 0),
 updated_at timestamptz not null default now(),
 constraint finance_document_object check (jsonb_typeof(data) = 'object' and jsonb_typeof(data->'items') = 'array')
);
alter table public.finance_workspaces enable row level security;
create policy finance_owner_select on public.finance_workspaces for select to authenticated using ((select auth.uid()) = user_id);
create policy finance_owner_insert on public.finance_workspaces for insert to authenticated with check ((select auth.uid()) = user_id);
create policy finance_owner_update on public.finance_workspaces for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
grant select, insert, update on public.finance_workspaces to authenticated;
revoke all on public.finance_workspaces from anon;
