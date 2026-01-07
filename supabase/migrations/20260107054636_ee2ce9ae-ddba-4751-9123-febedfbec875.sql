-- Create storage bucket for project files
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-files', 'project-files', false);

-- RLS policies for project files bucket
CREATE POLICY "Users can upload their own project files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'project-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own project files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'project-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own project files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'project-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create project_files table to track uploads
CREATE TABLE public.project_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;

-- Users can view their own project files
CREATE POLICY "Users can view their own project files"
ON public.project_files
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own project files
CREATE POLICY "Users can insert their own project files"
ON public.project_files
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own project files
CREATE POLICY "Users can delete their own project files"
ON public.project_files
FOR DELETE
USING (auth.uid() = user_id);

-- Admins can view all project files
CREATE POLICY "Admins can view all project files"
ON public.project_files
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));