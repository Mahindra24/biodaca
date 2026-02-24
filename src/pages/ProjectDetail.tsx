import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, Dna, Upload, FileText, Trash2, 
  Loader2, Download, Clock, CheckCircle, AlertCircle, Pencil, Check as CheckIcon, X
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Project {
  id: string;
  name: string;
  type: string;
  status: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface ProjectFile {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string | null;
  created_at: string;
}

const ProjectDetail = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [project, setProject] = useState<Project | null>(null);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);
  const [editingDescription, setEditingDescription] = useState(false);
  const [descriptionValue, setDescriptionValue] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && projectId) {
      fetchProject();
      fetchFiles();
    }
  }, [user, projectId]);

  const fetchProject = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .maybeSingle();

    if (error || !data) {
      toast.error('Project not found');
      navigate('/dashboard');
      return;
    }
    setProject(data);
    setLoading(false);
  };

  const fetchFiles = async () => {
    const { data, error } = await supabase
      .from('project_files')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (!error) {
      setFiles(data || []);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0 || !user || !projectId) return;

    setUploading(true);

    for (const file of Array.from(selectedFiles)) {
      // Validate file size (max 20MB)
      if (file.size > 20 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 20MB limit`);
        continue;
      }

      const filePath = `${user.id}/${projectId}/${Date.now()}_${file.name}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('project-files')
        .upload(filePath, file);

      if (uploadError) {
        toast.error(`Failed to upload ${file.name}`);
        continue;
      }

      // Save file record to database
      const { error: dbError } = await supabase
        .from('project_files')
        .insert({
          project_id: projectId,
          user_id: user.id,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type || null
        });

      if (dbError) {
        toast.error(`Failed to save ${file.name} record`);
      } else {
        toast.success(`${file.name} uploaded`);
        // Send notification (fire-and-forget)
        if (project) {
          supabase.functions.invoke('send-project-notification', {
            body: { event: 'file_uploaded', project_name: project.name, file_name: file.name, file_size: file.size },
          }).catch(() => {});
        }
      }
    }

    // Reset input and refresh files
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    fetchFiles();
    setUploading(false);
  };

  const handleDeleteFile = async (file: ProjectFile) => {
    setDeletingFileId(file.id);

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('project-files')
      .remove([file.file_path]);

    if (storageError) {
      toast.error('Failed to delete file from storage');
      setDeletingFileId(null);
      return;
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('project_files')
      .delete()
      .eq('id', file.id);

    if (dbError) {
      toast.error('Failed to delete file record');
    } else {
      toast.success('File deleted');
      fetchFiles();
    }
    setDeletingFileId(null);
  };

  const handleDownloadFile = async (file: ProjectFile) => {
    const { data, error } = await supabase.storage
      .from('project-files')
      .download(file.file_path);

    if (error || !data) {
      toast.error('Failed to download file');
      return;
    }

    // Create download link
    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.file_name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-5 w-5 text-dna-accent" />;
      case 'in-progress': return <Clock className="h-5 w-5 text-amber-500" />;
      default: return <AlertCircle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <Link 
            to="/dashboard" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-dna flex items-center justify-center">
              <Dna className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-heading font-bold">{project.name}</h1>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span>{project.type}</span>
                <span>•</span>
                <span>Created {format(new Date(project.created_at), 'MMM dd, yyyy')}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted">
              {getStatusIcon(project.status)}
              <span className="text-sm font-medium capitalize">{project.status.replace('-', ' ')}</span>
            </div>
          </div>
          {editingDescription ? (
            <div className="mt-3 max-w-2xl space-y-2">
              <Textarea
                value={descriptionValue}
                onChange={(e) => setDescriptionValue(e.target.value)}
                placeholder="Add a project description..."
                rows={3}
                autoFocus
              />
              <div className="flex gap-2">
                <Button size="sm" variant="hero" onClick={async () => {
                  const desc = descriptionValue.trim() || null;
                  const { error } = await supabase.from('projects').update({ description: desc }).eq('id', project.id);
                  if (!error) {
                    setProject({ ...project, description: desc });
                    toast.success('Description updated');
                  } else {
                    toast.error('Failed to update description');
                  }
                  setEditingDescription(false);
                }}>
                  <CheckIcon className="h-3 w-3 mr-1" /> Save
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingDescription(false)}>
                  <X className="h-3 w-3 mr-1" /> Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-3 max-w-2xl group/desc flex items-start gap-2 cursor-pointer" onClick={() => { setDescriptionValue(project.description || ''); setEditingDescription(true); }}>
              <p className="text-sm text-muted-foreground">
                {project.description || 'Add a description...'}
              </p>
              <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover/desc:opacity-100 transition-opacity mt-0.5 shrink-0" />
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* File Upload Section */}
        <div className="glass-card p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-heading font-semibold">Project Files</h2>
            <div>
              <Input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <Button 
                variant="hero" 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {uploading ? 'Uploading...' : 'Upload Files'}
              </Button>
            </div>
          </div>

          {/* Files List */}
          {files.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
              <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-muted-foreground mb-2">No files uploaded yet</p>
              <p className="text-sm text-muted-foreground">
                Upload data files, sequences, or analysis results (max 20MB per file)
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {files.map((file) => (
                <div 
                  key={file.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{file.file_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(file.file_size)} • {format(new Date(file.created_at), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleDownloadFile(file)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleDeleteFile(file)}
                      disabled={deletingFileId === file.id}
                      className="text-destructive hover:text-destructive"
                    >
                      {deletingFileId === file.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ProjectDetail;