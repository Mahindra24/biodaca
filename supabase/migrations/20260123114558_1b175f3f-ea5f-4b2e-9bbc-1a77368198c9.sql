-- Add additional profile fields
ALTER TABLE public.profiles
ADD COLUMN address text,
ADD COLUMN company_name text,
ADD COLUMN bio text;