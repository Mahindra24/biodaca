-- Remove admin role from any user except biodaca1@gmail.com
DELETE FROM public.user_roles 
WHERE role = 'admin' 
AND user_id NOT IN (
  SELECT id FROM auth.users WHERE email = 'biodaca1@gmail.com'
);

-- Create a function to validate admin role assignment
CREATE OR REPLACE FUNCTION public.validate_admin_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email TEXT;
BEGIN
  -- Only check for admin role assignments
  IF NEW.role = 'admin' THEN
    -- Get the user's email
    SELECT email INTO user_email FROM auth.users WHERE id = NEW.user_id;
    
    -- Only allow biodaca1@gmail.com to have admin role
    IF user_email IS NULL OR user_email != 'biodaca1@gmail.com' THEN
      RAISE EXCEPTION 'Admin role can only be assigned to authorized email address';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to enforce admin restriction on insert
CREATE TRIGGER enforce_admin_restriction_insert
  BEFORE INSERT ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_admin_role();

-- Create trigger to enforce admin restriction on update
CREATE TRIGGER enforce_admin_restriction_update
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_admin_role();