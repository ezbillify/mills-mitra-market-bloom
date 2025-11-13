create or replace function increment_promo_code_user_usage(p_promo_code_id uuid, p_user_id uuid)
returns void as $$
begin
  -- Insert or update the user usage record
  insert into promo_code_user_usage (promo_code_id, user_id, usage_count)
  values (p_promo_code_id, p_user_id, 1)
  on conflict (promo_code_id, user_id)
  do update set 
    usage_count = promo_code_user_usage.usage_count + 1,
    updated_at = now();
end;
$$ language plpgsql;