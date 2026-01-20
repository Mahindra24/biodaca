-- Allow admins to delete any files from project-files storage bucket
CREATE POLICY "Admins can delete all files from project-files bucket"
ON storage.objects
FOR DELETE
USING (bucket_id = 'project-files' AND has_role(auth.uid(), 'admin'::app_role));