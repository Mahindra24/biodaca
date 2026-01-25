import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Dna, LayoutDashboard, FileCode, BarChart3, 
  Settings, LogOut, Upload, Clock, CheckCircle,
  FolderOpen, Bell, User, Menu, X, Shield, Loader2, Plus,
  File, Download, Trash2, Search, Filter, Users, Mail, Phone, Info, ChevronDown, ChevronUp,
  Building2, MapPin, FileText
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface Project {
  id: string;
  name: string;
  type: string;
  status: string;
  created_at: string;
}

interface ProjectFile {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string | null;
  created_at: string;
  project_id: string;
}

interface UserWithDetails {
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  company_name: string | null;
  bio: string | null;
  created_at: string;
  projects: {
    id: string;
    name: string;
    type: string;
    status: string;
    created_at: string;
  }[];
}

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [allUsers, setAllUsers] = useState<UserWithDetails[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);
  const [fileSearch, setFileSearch] = useState('');
  const [fileProjectFilter, setFileProjectFilter] = useState<string>('all');
  const [fileSortBy, setFileSortBy] = useState<'date' | 'name' | 'size'>('date');
  const { user, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProjects();
      fetchFiles();
      if (isAdmin) {
        fetchAllUsers();
      }
    }
  }, [user, isAdmin]);

  const fetchProjects = async () => {
    setLoadingProjects(true);
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      toast.error('Failed to load projects');
    } else {
      setProjects(data || []);
    }
    setLoadingProjects(false);
  };

  const fetchFiles = async () => {
    setLoadingFiles(true);
    const { data, error } = await supabase
      .from('project_files')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      toast.error('Failed to load files');
    } else {
      setFiles(data || []);
    }
    setLoadingFiles(false);
  };

  const fetchAllUsers = async () => {
    setLoadingUsers(true);
    try {
      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch all projects
      const { data: allProjects, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;

      // Map users with their projects
      const usersWithDetails: UserWithDetails[] = (profiles || []).map(profile => ({
        user_id: profile.user_id,
        full_name: profile.full_name,
        email: profile.email,
        phone: profile.phone,
        address: profile.address,
        company_name: profile.company_name,
        bio: profile.bio,
        created_at: profile.created_at,
        projects: (allProjects || []).filter(p => p.user_id === profile.user_id).map(p => ({
          id: p.id,
          name: p.name,
          type: p.type,
          status: p.status,
          created_at: p.created_at,
        })),
      }));

      setAllUsers(usersWithDetails);
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleDownloadFile = async (file: ProjectFile) => {
    const { data, error } = await supabase.storage
      .from('project-files')
      .download(file.file_path);

    if (error) {
      toast.error('Failed to download file');
      return;
    }

    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.file_name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDeleteFile = async (file: ProjectFile) => {
    setDeletingFileId(file.id);

    const { error: storageError } = await supabase.storage
      .from('project-files')
      .remove([file.file_path]);

    if (storageError) {
      toast.error('Failed to delete file from storage');
      setDeletingFileId(null);
      return;
    }

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

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project?.name || 'Unknown Project';
  };

  // Filter and sort files
  const filteredFiles = files
    .filter(file => {
      const matchesSearch = file.file_name.toLowerCase().includes(fileSearch.toLowerCase());
      const matchesProject = fileProjectFilter === 'all' || file.project_id === fileProjectFilter;
      return matchesSearch && matchesProject;
    })
    .sort((a, b) => {
      switch (fileSortBy) {
        case 'name':
          return a.file_name.localeCompare(b.file_name);
        case 'size':
          return b.file_size - a.file_size;
        case 'date':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out successfully');
    navigate('/auth');
  };

  const handleCreateProject = async () => {
    if (!user) return;
    
    const { error } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        name: `New Project ${projects.length + 1}`,
        type: 'Genomic',
        status: 'pending'
      });

    if (error) {
      toast.error('Failed to create project');
    } else {
      toast.success('Project created!');
      fetchProjects();
    }
  };

  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.status === 'in-progress').length;
  const completedProjects = projects.filter(p => p.status === 'completed').length;

  const stats = [
    { label: 'Total Projects', value: String(totalProjects), icon: FolderOpen, change: 'All time' },
    { label: 'Active Analysis', value: String(activeProjects), icon: Clock, change: 'In progress' },
    { label: 'Completed', value: String(completedProjects), icon: CheckCircle, change: 'All verified' },
    { label: 'Storage Used', value: '2.4 GB', icon: BarChart3, change: 'of 10 GB' },
  ];

  const sidebarLinks = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard', active: true },
    { name: 'My Projects', icon: FolderOpen, href: '#' },
    { name: 'Analysis', icon: BarChart3, href: '#' },
    { name: 'Upload Data', icon: Upload, href: '#' },
    { name: 'Reports', icon: FileCode, href: '#' },
    { name: 'Settings', icon: Settings, href: '/profile' },
    ...(isAdmin ? [{ name: 'Admin Panel', icon: Shield, href: '/admin' }] : []),
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-dna-accent/20 text-dna-accent';
      case 'in-progress': return 'bg-amber-500/20 text-amber-600';
      case 'pending': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  // Get display name from user metadata or email
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const userRole = isAdmin ? 'Administrator' : 'Researcher';

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-muted/30 flex">
      {/* Sidebar */}
      <aside className={`fixed lg:relative inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-border">
          <Link to="/" className="flex items-center gap-2">
            <Dna className="h-8 w-8 text-primary" />
            <div className="flex flex-col">
              <span className="font-heading font-bold text-lg gradient-text">BioDaCa</span>
              <span className="text-[9px] text-muted-foreground -mt-1">Dashboard</span>
            </div>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {sidebarLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                link.active 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <link.icon className="h-5 w-5" />
              {link.name}
            </a>
          ))}
        </nav>

        {/* Bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
          <Button variant="ghost" className="w-full justify-start gap-3" onClick={handleSignOut}>
            <LogOut className="h-5 w-5" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-foreground/20 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 min-h-screen">
        {/* Header */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2">
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-heading font-semibold">Dashboard</h1>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-dna-accent rounded-full" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-dna flex items-center justify-center">
                {isAdmin ? (
                  <Shield className="h-5 w-5 text-primary-foreground" />
                ) : (
                  <User className="h-5 w-5 text-primary-foreground" />
                )}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium">{displayName}</p>
                <p className="text-xs text-muted-foreground">{userRole}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-4 lg:p-8">
          {/* Welcome */}
          <div className="mb-8">
            <h2 className="text-2xl font-heading font-bold mb-2">
              Welcome back, {displayName}! 👋
            </h2>
            <p className="text-muted-foreground">
              Here's an overview of your bioinformatics projects and analysis.
            </p>
            {isAdmin && (
              <div className="inline-flex items-center gap-2 mt-3 px-3 py-1 bg-primary/10 rounded-full">
                <Shield className="h-4 w-4 text-primary" />
                <span className="text-sm text-primary font-medium">Admin Access Enabled</span>
              </div>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat) => (
              <div key={stat.label} className="glass-card p-6 rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <stat.icon className="h-6 w-6 text-primary" />
                  </div>
                  <span className="text-xs text-muted-foreground">{stat.change}</span>
                </div>
                <p className="text-3xl font-heading font-bold mb-1">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Admin User Details Section */}
          {isAdmin && (() => {
            const filteredUsers = allUsers.filter(u => {
              const searchLower = userSearch.toLowerCase();
              return (
                (u.full_name?.toLowerCase().includes(searchLower)) ||
                (u.email?.toLowerCase().includes(searchLower)) ||
                (u.company_name?.toLowerCase().includes(searchLower))
              );
            });

            return (
              <Card className="mb-8">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      <CardTitle>User Details</CardTitle>
                    </div>
                    <div className="relative w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by name, email, company..."
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <CardDescription>
                    View all registered users, their contact information, and project details
                    {userSearch && ` • Showing ${filteredUsers.length} of ${allUsers.length} users`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingUsers ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>{userSearch ? 'No users match your search.' : 'No users found.'}</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                    {filteredUsers.map((u) => (
                      <Collapsible
                        key={u.user_id}
                        open={expandedUser === u.user_id}
                        onOpenChange={(open) => setExpandedUser(open ? u.user_id : null)}
                      >
                        <div className="border border-border rounded-xl overflow-hidden">
                          <CollapsibleTrigger asChild>
                            <button className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-gradient-dna flex items-center justify-center">
                                  <User className="h-5 w-5 text-primary-foreground" />
                                </div>
                                <div className="text-left">
                                  <p className="font-medium">{u.full_name || 'Unnamed User'}</p>
                                  <p className="text-sm text-muted-foreground">{u.email || 'No email'}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <Badge variant="secondary">{u.projects.length} Projects</Badge>
                                {expandedUser === u.user_id ? (
                                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                )}
                              </div>
                            </button>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="border-t border-border p-4 bg-muted/20 space-y-4">
                              {/* Contact Information */}
                              <div className="grid sm:grid-cols-3 gap-4">
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-muted-foreground" />
                                  <div>
                                    <p className="text-xs text-muted-foreground">Full Name</p>
                                    <p className="text-sm font-medium">{u.full_name || 'Not provided'}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Mail className="h-4 w-4 text-muted-foreground" />
                                  <div>
                                    <p className="text-xs text-muted-foreground">Email</p>
                                    <p className="text-sm font-medium">{u.email || 'Not provided'}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Phone className="h-4 w-4 text-muted-foreground" />
                                  <div>
                                    <p className="text-xs text-muted-foreground">Phone</p>
                                    <p className="text-sm font-medium">{u.phone || 'Not provided'}</p>
                                  </div>
                                </div>
                              </div>

                              {/* Additional Profile Information */}
                              <div className="grid sm:grid-cols-2 gap-4">
                                <div className="flex items-start gap-2">
                                  <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                                  <div>
                                    <p className="text-xs text-muted-foreground">Company / Organization</p>
                                    <p className="text-sm font-medium">{u.company_name || 'Not provided'}</p>
                                  </div>
                                </div>
                                <div className="flex items-start gap-2">
                                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                  <div>
                                    <p className="text-xs text-muted-foreground">Address</p>
                                    <p className="text-sm font-medium">{u.address || 'Not provided'}</p>
                                  </div>
                                </div>
                              </div>

                              {/* Bio */}
                              {u.bio && (
                                <div className="flex items-start gap-2">
                                  <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                                  <div>
                                    <p className="text-xs text-muted-foreground">About / Bio</p>
                                    <p className="text-sm font-medium whitespace-pre-wrap">{u.bio}</p>
                                  </div>
                                </div>
                              )}

                              {/* Projects Section */}
                              <div>
                                <div className="flex items-center gap-2 mb-3">
                                  <Info className="h-4 w-4 text-muted-foreground" />
                                  <p className="text-sm font-medium">Projects ({u.projects.length})</p>
                                </div>
                                {u.projects.length === 0 ? (
                                  <p className="text-sm text-muted-foreground">No projects created yet.</p>
                                ) : (
                                  <div className="space-y-2">
                                    {u.projects.map((project) => (
                                      <div
                                        key={project.id}
                                        className="flex items-center justify-between p-3 bg-background rounded-lg border border-border"
                                      >
                                        <div className="flex items-center gap-3">
                                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <Dna className="h-4 w-4 text-primary" />
                                          </div>
                                          <div>
                                            <p className="text-sm font-medium">{project.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                              {project.type} • {format(new Date(project.created_at), 'MMM dd, yyyy')}
                                            </p>
                                          </div>
                                        </div>
                                        <Badge
                                          variant="outline"
                                          className={getStatusColor(project.status)}
                                        >
                                          {project.status.replace('-', ' ')}
                                        </Badge>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </CollapsibleContent>
                        </div>
                      </Collapsible>
                    ))}
                  </div>
                  )}
                </CardContent>
              </Card>
            );
          })()}

          {/* Content Grid */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Recent Projects */}
            <div className="lg:col-span-2 glass-card p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-heading font-semibold">Recent Projects</h3>
                <Button variant="ghost" size="sm" onClick={handleCreateProject}>
                  <Plus className="h-4 w-4 mr-1" />
                  New Project
                </Button>
              </div>

              <div className="space-y-4">
                {loadingProjects ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : projects.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FolderOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No projects yet. Create your first project!</p>
                  </div>
                ) : (
                  projects.map((project) => (
                    <div 
                      key={project.id}
                      onClick={() => navigate(`/project/${project.id}`)}
                      className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-gradient-dna flex items-center justify-center">
                          <Dna className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">{project.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {project.type} • {format(new Date(project.created_at), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(project.status)}`}>
                        {project.status.replace('-', ' ')}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-6">
              <div className="glass-card p-6 rounded-2xl">
                <h3 className="text-lg font-heading font-semibold mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Button variant="hero" className="w-full justify-start gap-3">
                    <Upload className="h-5 w-5" />
                    Upload New Data
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-3">
                    <FileCode className="h-5 w-5" />
                    New Analysis
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-3">
                    <BarChart3 className="h-5 w-5" />
                    View Reports
                  </Button>
                </div>
              </div>

              {/* Storage */}
              <div className="glass-card p-6 rounded-2xl">
                <h3 className="text-lg font-heading font-semibold mb-4">Storage Usage</h3>
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Used</span>
                    <span className="font-medium">2.4 GB / 10 GB</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div className="h-full w-1/4 bg-gradient-dna rounded-full" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  24% of your storage is being used
                </p>
              </div>
            </div>
          </div>

          {/* My Files Section */}
          <div className="mt-8 glass-card p-6 rounded-2xl">
            <div className="flex flex-col gap-4 mb-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-heading font-semibold">My Files</h3>
                <span className="text-sm text-muted-foreground">
                  {filteredFiles.length} of {files.length} files
                </span>
              </div>
              
              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search files..."
                    value={fileSearch}
                    onChange={(e) => setFileSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={fileProjectFilter} onValueChange={setFileProjectFilter}>
                    <SelectTrigger className="w-[160px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="All Projects" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Projects</SelectItem>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={fileSortBy} onValueChange={(v) => setFileSortBy(v as 'date' | 'name' | 'size')}>
                    <SelectTrigger className="w-[130px]">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Newest First</SelectItem>
                      <SelectItem value="name">Name A-Z</SelectItem>
                      <SelectItem value="size">Largest First</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {loadingFiles ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : files.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <File className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No files uploaded yet.</p>
                <p className="text-sm mt-1">Upload files from within a project.</p>
              </div>
            ) : filteredFiles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No files match your search.</p>
                <p className="text-sm mt-1">Try adjusting your search or filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">File Name</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden sm:table-cell">Project</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden md:table-cell">Size</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">Uploaded</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFiles.map((file) => (
                      <tr key={file.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                              <File className="h-4 w-4 text-primary" />
                            </div>
                            <span className="font-medium text-sm truncate max-w-[200px]">{file.file_name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 hidden sm:table-cell">
                          <span 
                            className="text-sm text-muted-foreground hover:text-primary cursor-pointer"
                            onClick={() => navigate(`/project/${file.project_id}`)}
                          >
                            {getProjectName(file.project_id)}
                          </span>
                        </td>
                        <td className="py-3 px-4 hidden md:table-cell">
                          <span className="text-sm text-muted-foreground">{formatFileSize(file.file_size)}</span>
                        </td>
                        <td className="py-3 px-4 hidden lg:table-cell">
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(file.created_at), 'MMM dd, yyyy')}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadFile(file)}
                              className="h-8 w-8 p-0"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteFile(file)}
                              disabled={deletingFileId === file.id}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              {deletingFileId === file.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
