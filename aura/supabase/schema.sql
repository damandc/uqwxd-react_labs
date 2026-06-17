-- AURA schema — Row-Level Security ON for every table.
-- The whole security model: the anonymous voter's identity is PHYSICALLY
-- unreadable from the client. Reveal is computed server-side (service role)
-- only after an AURA+ entitlement is verified.

-- ── auras: one row per selfie-generated aura card ──────────────────────────
create table public.auras (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null,                     -- anonymous device identity
  verdict     text not null,                     -- e.g. "MAGNETIC"
  gradient    jsonb not null,                    -- ["#ff0080","#7928ca",...]
  vibe        text,
  created_at  timestamptz not null default now()
);
alter table public.auras enable row level security;

-- Anyone can read an aura card by id (it's the shareable artifact).
create policy auras_public_read on public.auras
  for select using (true);

-- Only the BFF (service role) writes auras. No client INSERT policy = no client writes.

-- ── votes: anonymous one-word verdicts from friends ───────────────────────
create table public.votes (
  id          uuid primary key default gen_random_uuid(),
  aura_id     uuid not null references public.auras(id) on delete cascade,
  word        text not null,
  voter_id    uuid not null,                     -- SERVER-ONLY. never exposed.
  created_at  timestamptz not null default now()
);
alter table public.votes enable row level security;

-- NOTE: deliberately NO permissive SELECT policy on votes for the anon role.
-- Clients cannot read this table at all — not the words, not the voters.
-- Everything client-facing about votes goes through the BFF, which uses the
-- service role and returns ONLY what the caller is entitled to see:
--   • free tier  -> count + anonymized words (voter_id stripped)
--   • AURA+      -> words + revealed voter identity
-- This is what makes the "inspect the network tab to unmask" exploit impossible.

-- ── entitlements: weekly AURA+ subscription state ─────────────────────────
create table public.entitlements (
  owner_id    uuid primary key,
  product     text not null default 'aura_plus_weekly',
  active      boolean not null default false,
  expires_at  timestamptz,
  updated_at  timestamptz not null default now()
);
alter table public.entitlements enable row level security;
-- No client policies — written by the BFF on verified store receipts,
-- read by the BFF when gating a reveal.

-- Helper the BFF calls to check entitlement at reveal time.
create or replace function public.has_active_aura_plus(p_owner uuid)
returns boolean language sql stable as $$
  select exists (
    select 1 from public.entitlements
    where owner_id = p_owner and active = true
      and (expires_at is null or expires_at > now())
  );
$$;
