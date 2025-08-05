CREATE OR REPLACE FUNCTION increment_usage(user_id_in uuid, field_name text)
RETURNS void AS $$
BEGIN
  EXECUTE format('UPDATE public.user_usage SET %I = %I + 1 WHERE user_id = %L',
                 field_name, field_name, user_id_in::text);
END;
$$ LANGUAGE plpgsql;
