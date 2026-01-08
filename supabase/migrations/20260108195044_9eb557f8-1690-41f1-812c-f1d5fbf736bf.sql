-- Add retell_api_key column to widget_configs
ALTER TABLE public.widget_configs
ADD COLUMN retell_api_key TEXT;