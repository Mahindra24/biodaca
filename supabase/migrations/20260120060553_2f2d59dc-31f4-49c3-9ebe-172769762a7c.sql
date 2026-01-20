-- Allow admins to delete any project files
CREATE POLICY "Admins can delete all project files"
ON public.project_files
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));