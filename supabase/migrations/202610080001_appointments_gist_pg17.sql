-- Postgres 17: expression indexes/constraints require IMMUTABLE functions.
-- The original exclusion used `scheduled_at + duration_minutes * interval '1 minute'`,
-- which is not IMMUTABLE on PG 17. SENTRA AI (Postgres 17) applies this helper instead.

create or replace function public.appointment_tstzrange(
  p_scheduled_at timestamptz,
  p_duration_minutes integer
)
returns tstzrange
language sql
immutable
as $$
  select tstzrange(
    p_scheduled_at,
    p_scheduled_at + make_interval(mins => p_duration_minutes),
    '[)'
  );
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'appointments_no_confirmed_overlap'
      and conrelid = 'public.appointments'::regclass
  ) then
    alter table public.appointments
      add constraint appointments_no_confirmed_overlap
      exclude using gist (
        tenant_id with =,
        public.appointment_tstzrange(scheduled_at, duration_minutes) with &&
      )
      where (status = 'confirmed');
  end if;
end $$;
