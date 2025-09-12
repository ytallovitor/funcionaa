-- Fix the search_path warning for our function
CREATE OR REPLACE FUNCTION get_or_create_student_portal(
  p_student_id UUID,
  p_username TEXT DEFAULT NULL,
  p_password_hash TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  student_id UUID, 
  username TEXT,
  password_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- First, try to get existing portal
  RETURN QUERY
  SELECT sp.id, sp.student_id, sp.username, sp.password_hash, sp.created_at, sp.updated_at
  FROM public.student_portals sp
  WHERE sp.student_id = p_student_id;
  
  -- If no existing portal found and username/password provided, create new one
  IF NOT FOUND AND p_username IS NOT NULL AND p_password_hash IS NOT NULL THEN
    RETURN QUERY
    INSERT INTO public.student_portals (student_id, username, password_hash)
    VALUES (p_student_id, p_username, p_password_hash)
    RETURNING student_portals.id, student_portals.student_id, student_portals.username, student_portals.password_hash, student_portals.created_at, student_portals.updated_at;
  END IF;
END;
$$;