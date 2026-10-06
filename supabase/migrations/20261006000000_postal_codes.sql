-- Mexican postal codes from the SEPOMEX catalog (Correos de México), one row
-- per colonia. Filled by scripts/import-sepomex.mjs, not by migrations.
-- Only the backend reads it (service role), so no policies.

create table public.postal_codes (
  id bigint generated always as identity primary key,
  postal_code text not null check (postal_code ~ '^\d{5}$'),
  neighborhood text not null,
  neighborhood_type text,
  municipality text not null,
  city text,
  state text not null
);

create index postal_codes_postal_code_idx on public.postal_codes (postal_code);

alter table public.postal_codes enable row level security;
