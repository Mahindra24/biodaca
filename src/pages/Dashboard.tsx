import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Dna, LayoutDashboard, FileCode, BarChart3, 
  Settings, LogOut, Upload, Clock, CheckCircle,
  FolderOpen, Bell, User, Menu, X, Shield, Loader2, Plus,
  File, Download, Trash2, Search, Filter, Users, Mail, Phone, Info, ChevronDown, ChevronUp,
  Building2, MapPin, FileText, PieChart, TrendingUp, Pencil, Check as CheckIcon
} from 'lucide-react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, PieChart as RechartsPie, Pie, Cell, CartesianGrid } from 'recharts';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

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
  const [activeSection, setActiveSection] = useState('dashboard');
  const projectsRef = useRef<HTMLDivElement>(null);
  const analysisRef = useRef<HTMLDivElement>(null);
  const reportsRef = useRef<HTMLDivElement>(null);
  const filesRef = useRef<HTMLDivElement>(null);
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

  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingProjectName, setEditingProjectName] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);

  const handleRenameProject = async (projectId: string) => {
    const trimmed = editingProjectName.trim();
    if (!trimmed) {
      setEditingProjectId(null);
      return;
    }
    const { error } = await supabase
      .from('projects')
      .update({ name: trimmed })
      .eq('id', projectId);

    if (error) {
      toast.error('Failed to rename project');
    } else {
      toast.success('Project renamed');
      setProjects(prev => prev.map(p => p.id === projectId ? { ...p, name: trimmed } : p));
    }
    setEditingProjectId(null);
  };

  const handleDeleteProject = async (projectId: string) => {
    setDeletingProjectId(projectId);
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (error) {
      toast.error('Failed to delete project');
    } else {
      toast.success('Project deleted');
      setProjects(prev => prev.filter(p => p.id !== projectId));
    }
    setDeletingProjectId(null);
  };

  const handleUpdateProjectStatus = async (projectId: string, newStatus: string) => {
    const { error } = await supabase
      .from('projects')
      .update({ status: newStatus })
      .eq('id', projectId);

    if (error) {
      toast.error('Failed to update project status');
    } else {
      toast.success('Project status updated');
      setProjects(prev => prev.map(p => p.id === projectId ? { ...p, status: newStatus } : p));
    }
  };

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectType, setNewProjectType] = useState('Genomic');
  const [creatingProject, setCreatingProject] = useState(false);

  const projectTypes = ['Genomic', 'Proteomic', 'Transcriptomic', 'Metabolomic', 'Epigenomic', 'Metagenomic', 'Other'];

  const handleCreateProject = async () => {
    if (!user) return;
    const name = newProjectName.trim() || `New Project ${projects.length + 1}`;
    setCreatingProject(true);
    
    const { error } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        name,
        type: newProjectType,
        status: 'pending'
      });

    if (error) {
      toast.error('Failed to create project');
    } else {
      toast.success('Project created!');
      fetchProjects();
    }
    setCreatingProject(false);
    setShowCreateDialog(false);
    setNewProjectName('');
    setNewProjectType('Genomic');
  };

  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.status === 'in-progress').length;
  const completedProjects = projects.filter(p => p.status === 'completed').length;
  const pendingProjects = projects.filter(p => p.status === 'pending').length;

  const stats = [
    { label: 'Total Projects', value: String(totalProjects), icon: FolderOpen, change: 'All time' },
    { label: 'Active Analysis', value: String(activeProjects), icon: Clock, change: 'In progress' },
    { label: 'Completed', value: String(completedProjects), icon: CheckCircle, change: 'All verified' },
    { label: 'Storage Used', value: '2.4 GB', icon: BarChart3, change: 'of 10 GB' },
  ];

  const scrollToSection = (section: string) => {
    setActiveSection(section);
    setSidebarOpen(false);
    const refMap: Record<string, React.RefObject<HTMLDivElement | null>> = {
      projects: projectsRef,
      analysis: reportsRef,
      reports: reportsRef,
      files: filesRef,
    };
    const ref = refMap[section];
    if (ref?.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleExportCSV = () => {
    const headers = ['Project Name', 'Type', 'Status', 'Created At'];
    const rows = projects.map(p => [
      p.name,
      p.type,
      p.status,
      format(new Date(p.created_at), 'yyyy-MM-dd'),
    ]);
    const summaryRows = [
      [],
      ['Summary'],
      ['Total Projects', String(totalProjects)],
      ['Active', String(activeProjects)],
      ['Completed', String(completedProjects)],
      ['Total Files', String(files.length)],
    ];
    const csvContent = [headers, ...rows, ...summaryRows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `biodaca-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV report downloaded');
  };

  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to download PDF');
      return;
    }
    const statusRows = statusData.map(d => `<tr><td>${d.name}</td><td>${d.value}</td></tr>`).join('');
    const typeRows = typeChartData.map(d => `<tr><td>${d.name}</td><td>${d.value}</td></tr>`).join('');
    const projectRows = projects.map(p =>
      `<tr><td>${p.name}</td><td>${p.type}</td><td>${p.status}</td><td>${format(new Date(p.created_at), 'MMM dd, yyyy')}</td></tr>`
    ).join('');
    printWindow.document.write(`
      <html><head><title>BioDaCa Report</title>
      <style>
        body { font-family: system-ui, sans-serif; padding: 40px; color: #1a1a1a; }
        h1 { color: #0d9488; margin-bottom: 4px; }
        h2 { margin-top: 28px; color: #333; border-bottom: 2px solid #0d9488; padding-bottom: 6px; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; font-size: 14px; }
        th { background: #f0fdfa; font-weight: 600; }
        .summary { display: flex; gap: 20px; margin-top: 12px; }
        .stat { background: #f0fdfa; padding: 16px; border-radius: 8px; text-align: center; flex: 1; }
        .stat-value { font-size: 28px; font-weight: 700; color: #0d9488; }
        .stat-label { font-size: 12px; color: #666; margin-top: 4px; }
        .date { color: #888; font-size: 12px; margin-top: 4px; }
      </style></head><body>
      <h1>BioDaCa Reports &amp; Analysis</h1>
      <p class="date">Generated: ${format(new Date(), 'MMMM dd, yyyy')}</p>
      <div class="summary">
        <div class="stat"><div class="stat-value">${totalProjects}</div><div class="stat-label">Total Projects</div></div>
        <div class="stat"><div class="stat-value">${activeProjects}</div><div class="stat-label">In Progress</div></div>
        <div class="stat"><div class="stat-value">${completedProjects}</div><div class="stat-label">Completed</div></div>
        <div class="stat"><div class="stat-value">${files.length}</div><div class="stat-label">Total Files</div></div>
      </div>
      <h2>Project Status Distribution</h2>
      <table><tr><th>Status</th><th>Count</th></tr>${statusRows}</table>
      <h2>Projects by Type</h2>
      <table><tr><th>Type</th><th>Count</th></tr>${typeRows}</table>
      <h2>All Projects</h2>
      <table><tr><th>Name</th><th>Type</th><th>Status</th><th>Created</th></tr>${projectRows}</table>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const sidebarLinks = [
    { name: 'Dashboard', icon: LayoutDashboard, section: 'dashboard', href: '/dashboard', badge: null },
    { name: 'My Projects', icon: FolderOpen, section: 'projects', badge: pendingProjects > 0 ? pendingProjects : null },
    { name: 'Analysis', icon: BarChart3, section: 'analysis', badge: null },
    { name: 'Reports', icon: FileCode, section: 'reports', badge: null },
    { name: 'Settings', icon: Settings, section: 'settings', href: '/profile', badge: null },
    ...(isAdmin ? [{ name: 'Admin Panel', icon: Shield, section: 'admin', href: '/admin', badge: null }] : []),
  ];

  // Chart data
  const statusData = [
    { name: 'Pending', value: projects.filter(p => p.status === 'pending').length, fill: 'hsl(var(--muted-foreground))' },
    { name: 'In Progress', value: projects.filter(p => p.status === 'in-progress').length, fill: 'hsl(45, 93%, 47%)' },
    { name: 'Completed', value: projects.filter(p => p.status === 'completed').length, fill: 'hsl(var(--primary))' },
  ].filter(d => d.value > 0);

  const typeData = projects.reduce<Record<string, number>>((acc, p) => {
    acc[p.type] = (acc[p.type] || 0) + 1;
    return acc;
  }, {});
  const typeChartData = Object.entries(typeData).map(([name, value]) => ({ name, value }));

  const chartConfig: ChartConfig = {
    value: { label: 'Count' },
  };

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
    <>
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
            <button
              key={link.name}
              onClick={() => {
                if (link.href) {
                  navigate(link.href);
                } else {
                  scrollToSection(link.section);
                }
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                activeSection === link.section
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <link.icon className="h-5 w-5" />
              <span className="flex-1 text-left">{link.name}</span>
              {link.badge !== null && (
                <span className={`min-w-5 h-5 px-1.5 rounded-full text-xs font-bold flex items-center justify-center ${
                  activeSection === link.section
                    ? 'bg-primary-foreground/20 text-primary-foreground'
                    : 'bg-amber-500/20 text-amber-600'
                }`}>
                  {link.badge}
                </span>
              )}
            </button>
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

          {/* Reports & Analysis Section */}
          <div ref={reportsRef} className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-heading font-semibold">Reports & Analysis</h3>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleExportCSV}>
                  <Download className="h-4 w-4 mr-1" />
                  CSV
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportPDF}>
                  <FileText className="h-4 w-4 mr-1" />
                  PDF
                </Button>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-6">
              {/* Project Status Distribution */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Project Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  {statusData.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">No project data yet</div>
                  ) : (
                    <ChartContainer config={chartConfig} className="h-[220px] w-full">
                      <RechartsPie>
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                          {statusData.map((entry, index) => (
                            <Cell key={index} fill={entry.fill} />
                          ))}
                        </Pie>
                      </RechartsPie>
                    </ChartContainer>
                  )}
                </CardContent>
              </Card>

              {/* Projects by Type */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <CardTitle className="text-sm font-medium">Projects by Type</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  {typeChartData.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">No project data yet</div>
                  ) : (
                    <ChartContainer config={chartConfig} className="h-[220px] w-full">
                      <BarChart data={typeChartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="name" className="text-xs" />
                        <YAxis allowDecimals={false} className="text-xs" />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ChartContainer>
                  )}
                </CardContent>
              </Card>

              {/* Summary Stats */}
              <Card className="sm:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Project Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-muted/50 rounded-xl">
                      <p className="text-2xl font-bold text-primary">{totalProjects}</p>
                      <p className="text-xs text-muted-foreground">Total Projects</p>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-xl">
                      <p className="text-2xl font-bold text-accent-foreground">{activeProjects}</p>
                      <p className="text-xs text-muted-foreground">In Progress</p>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-xl">
                      <p className="text-2xl font-bold text-primary">{completedProjects}</p>
                      <p className="text-xs text-muted-foreground">Completed</p>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-xl">
                      <p className="text-2xl font-bold">{files.length}</p>
                      <p className="text-xs text-muted-foreground">Total Files</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Content Grid */}
          <div ref={projectsRef} className="grid lg:grid-cols-3 gap-8">
            {/* Recent Projects */}
            <div className="lg:col-span-2 glass-card p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-heading font-semibold">Recent Projects</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowCreateDialog(true)}>
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
                          {editingProjectId === project.id ? (
                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <Input
                                ref={renameInputRef}
                                value={editingProjectName}
                                onChange={(e) => setEditingProjectName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleRenameProject(project.id);
                                  if (e.key === 'Escape') setEditingProjectId(null);
                                }}
                                onBlur={() => handleRenameProject(project.id)}
                                className="h-7 text-sm font-medium w-48"
                                autoFocus
                              />
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 group/name">
                              <p className="font-medium">{project.name}</p>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingProjectId(project.id);
                                  setEditingProjectName(project.name);
                                }}
                                className="opacity-0 group-hover/name:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                          <p className="text-sm text-muted-foreground">
                            {project.type} • {format(new Date(project.created_at), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <Select
                          value={project.status}
                          onValueChange={(newStatus) => handleUpdateProjectStatus(project.id, newStatus)}
                        >
                          <SelectTrigger
                            className={`w-36 h-7 text-xs font-medium border-0 rounded-full px-3 focus:ring-1 ${getStatusColor(project.status)}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="in-progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('Are you sure you want to delete this project?')) {
                              handleDeleteProject(project.id);
                            }
                          }}
                          disabled={deletingProjectId === project.id}
                        >
                          {deletingProjectId === project.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
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
          <div ref={filesRef} className="mt-8 glass-card p-6 rounded-2xl">
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

    <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="project-name">Project Name</Label>
            <Input
              id="project-name"
              placeholder={`New Project ${projects.length + 1}`}
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreateProject(); }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="project-type">Project Type</Label>
            <Select value={newProjectType} onValueChange={setNewProjectType}>
              <SelectTrigger id="project-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {projectTypes.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
          <Button variant="hero" onClick={handleCreateProject} disabled={creatingProject}>
            {creatingProject ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Create Project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
};

export default Dashboard;
