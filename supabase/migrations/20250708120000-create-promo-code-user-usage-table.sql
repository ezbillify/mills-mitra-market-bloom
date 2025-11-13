create table public.promo_code_user_usage (
  id uuid not null default gen_random_uuid (),
  promo_code_id uuid not null references public.promo_codes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_count integer not null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint promo_code_user_usage_pkey primary key (id),
  constraint promo_code_user_usage_unique unique (promo_code_id, user_id)
) TABLESPACE pg_default;

create index IF not exists idx_promo_code_user_usage_promo_code_id on public.promo_code_user_usage using btree (promo_code_id) TABLESPACE pg_default;
create index IF not exists idx_promo_code_user_usage_user_id on public.promo_code_user_usage using btree (user_id) TABLESPACE pg_default;