-- Run once in a new Supabase project's SQL editor. No browser access to applicant data.
begin;
create table public.application_seasons (
  id text primary key, label text not null, accepting boolean not null default true
);
insert into public.application_seasons values
  ('late-2026', 'Late 2026 — dates to be announced', true),
  ('2027', '2027 — dates to be announced', true);

create table public.applications (
  id uuid primary key,
  created_at timestamptz not null default now(),
  season text not null references public.application_seasons(id),
  type text not null check (type in ('vendor','artist','music','performance','partner','idea')),
  email text not null,
  status text not null default 'pending' check (status in ('pending','reviewing','accepted','declined','waitlisted','archived')),
  payload jsonb not null,
  payload_hash text not null,
  internal_notes text not null default ''
);
create index applications_review on public.applications(status, created_at desc);
create table public.application_rate_limits (
  key text not null, bucket_start timestamptz not null, count integer not null,
  primary key(key, bucket_start)
);
create table public.application_email_outbox (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  kind text not null check (kind in ('owner','receipt')),
  state text not null default 'pending' check (state in ('pending','sending','sent','needs_review')),
  attempts integer not null default 0,
  first_attempt_at timestamptz,
  available_at timestamptz not null default now(),
  lease_token uuid,
  sent_at timestamptz,
  unique(application_id, kind)
);

alter table public.application_seasons enable row level security;
alter table public.applications enable row level security;
alter table public.application_rate_limits enable row level security;
alter table public.application_email_outbox enable row level security;
revoke all on public.application_seasons, public.applications, public.application_rate_limits, public.application_email_outbox from anon, authenticated;
grant all on public.application_seasons, public.applications, public.application_rate_limits, public.application_email_outbox to service_role;

create function public.submit_application(p_id uuid, p_payload jsonb, p_hash text, p_ip_key text, p_email_key text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare existing text; ip_count integer; email_count integer; bucket timestamptz := date_trunc('hour', now());
begin
  -- Serialize duplicate requests before quota checks. Network retries don't consume quota.
  perform pg_advisory_xact_lock(hashtextextended(p_id::text, 0));
  select payload_hash into existing from public.applications where id = p_id;
  if found then
    return jsonb_build_object('status', case when existing = p_hash then 'saved' else 'conflict' end);
  end if;
  if not exists(select 1 from public.application_seasons where id = p_payload->>'season' and accepting) then
    return jsonb_build_object('status','closed');
  end if;
  insert into public.application_rate_limits(key, bucket_start, count) values (p_ip_key, bucket, 1)
    on conflict(key, bucket_start) do update set count = public.application_rate_limits.count + 1 returning count into ip_count;
  insert into public.application_rate_limits(key, bucket_start, count) values (p_email_key, bucket, 1)
    on conflict(key, bucket_start) do update set count = public.application_rate_limits.count + 1 returning count into email_count;
  if ip_count > 10 or email_count > 3 then return jsonb_build_object('status','limited'); end if;
  insert into public.applications(id, season, type, email, payload, payload_hash)
    values(p_id, p_payload->>'season', p_payload->>'type', p_payload->>'email', p_payload, p_hash);
  insert into public.application_email_outbox(application_id, kind) values(p_id,'owner'),(p_id,'receipt');
  return jsonb_build_object('status','saved');
end $$;

create function public.claim_application_emails(p_application_id uuid default null)
returns table(id uuid, application_id uuid, kind text, lease_token uuid, email text, payload jsonb)
language plpgsql security definer set search_path = '' as $$
begin
  -- Resend deduplicates for 24h. Stop uncertain deliveries before that bucket_start expires.
  update public.application_email_outbox o set state = 'needs_review'
    where o.state in ('pending','sending') and (o.first_attempt_at < now() - interval '23 hours' or o.attempts >= 5)
      and o.available_at <= now();
  return query
    with picked as (
      select o.id from public.application_email_outbox o
      where o.state in ('pending','sending') and o.available_at <= now()
        and (p_application_id is null or o.application_id = p_application_id)
      order by o.available_at, o.id for update skip locked limit 2
    ), leased as (
      update public.application_email_outbox o set state = 'sending', attempts = o.attempts + 1,
        first_attempt_at = coalesce(o.first_attempt_at, now()), available_at = now() + interval '5 minutes', lease_token = gen_random_uuid()
      from picked where o.id = picked.id returning o.*
    )
    select l.id, l.application_id, l.kind, l.lease_token, a.email, a.payload
    from leased l join public.applications a on a.id = l.application_id;
end $$;

create function public.finish_application_email(p_id uuid, p_lease uuid, p_sent boolean)
returns void language sql security definer set search_path = '' as $$
  update public.application_email_outbox set state = case when p_sent then 'sent' else 'pending' end,
    sent_at = case when p_sent then now() else null end, available_at = now() + interval '5 minutes'
  where id = p_id and lease_token = p_lease and state = 'sending';
$$;
create function public.prune_application_rate_limits()
returns void language sql security definer set search_path = '' as $$
  delete from public.application_rate_limits where bucket_start < now() - interval '2 days';
$$;

revoke all on function public.submit_application(uuid,jsonb,text,text,text) from public, anon, authenticated;
revoke all on function public.claim_application_emails(uuid) from public, anon, authenticated;
revoke all on function public.finish_application_email(uuid,uuid,boolean) from public, anon, authenticated;
revoke all on function public.prune_application_rate_limits() from public, anon, authenticated;
grant execute on function public.submit_application(uuid,jsonb,text,text,text) to service_role;
grant execute on function public.claim_application_emails(uuid) to service_role;
grant execute on function public.finish_application_email(uuid,uuid,boolean) to service_role;
grant execute on function public.prune_application_rate_limits() to service_role;
commit;
