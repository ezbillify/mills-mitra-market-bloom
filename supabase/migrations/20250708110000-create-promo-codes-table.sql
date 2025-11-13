create table public.promo_codes (
  id uuid not null default gen_random_uuid (),
  code text not null,
  description text null,
  discount_type text not null,
  discount_value numeric(10, 2) not null,
  minimum_order_value numeric(10, 2) null default 0,
  max_uses integer null,
  used_count integer null default 0,
  valid_from timestamp with time zone null,
  valid_until timestamp with time zone null,
  is_active boolean null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint promo_codes_pkey primary key (id),
  constraint promo_codes_code_key unique (code),
  constraint promo_codes_discount_type_check check (
    (
      discount_type = any (array['percentage'::text, 'fixed'::text])
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_promo_codes_code on public.promo_codes using btree (code) TABLESPACE pg_default;

create index IF not exists idx_promo_codes_active on public.promo_codes using btree (is_active) TABLESPACE pg_default;