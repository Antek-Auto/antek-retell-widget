-- Create widget limit function (100 per user)
CREATE OR REPLACE FUNCTION public.check_widget_limit()
RETURNS TRIGGER AS $$
DECLARE
  widget_count INTEGER;
BEGIN
  -- Count existing widgets for user
  SELECT COUNT(*) INTO widget_count
  FROM public.widget_configs
  WHERE user_id = NEW.user_id;
  
  -- Limit to 100 widgets per user
  IF widget_count >= 100 THEN
    RAISE EXCEPTION 'You have reached the maximum limit of 100 widgets per account.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger
CREATE TRIGGER enforce_widget_limit
  BEFORE INSERT ON public.widget_configs
  FOR EACH ROW
  EXECUTE FUNCTION public.check_widget_limit();