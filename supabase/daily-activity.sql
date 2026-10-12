-- Internal operational date; never reads or changes finance_workspaces.
create schema if not exists finanzas_internal;
revoke all on schema finanzas_internal from public;
grant usage on schema finanzas_internal to anon, authenticated;
create table finanzas_internal.daily_activity (
  id smallint primary key check (id = 1),
  activity_date date not null,
  updated_at timestamptz not null
);
alter table finanzas_internal.daily_activity enable row level security;
insert into finanzas_internal.daily_activity values
  (1, (now() at time zone 'America/Puerto_Rico')::date, now());
grant select on finanzas_internal.daily_activity to anon, authenticated;
grant update (activity_date, updated_at) on finanzas_internal.daily_activity to anon, authenticated;
create policy heartbeat_read on finanzas_internal.daily_activity
  for select to anon, authenticated using (id = 1);
create policy heartbeat_update on finanzas_internal.daily_activity
  for update to anon, authenticated using (id = 1)
  with check (id = 1 and activity_date = (now() at time zone 'America/Puerto_Rico')::date and updated_at = now());
create function public.finance_daily_activity()
returns date language plpgsql security invoker set search_path = ''
as $$
begin
  update finanzas_internal.daily_activity
    set activity_date = (now() at time zone 'America/Puerto_Rico')::date,
        updated_at = now()
    where id = 1 and activity_date <> (now() at time zone 'America/Puerto_Rico')::date;
  return (select activity_date from finanzas_internal.daily_activity where id = 1);
end;
$$;
revoke all on function public.finance_daily_activity() from public;
grant execute on function public.finance_daily_activity() to anon, authenticated;
