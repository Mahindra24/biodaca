import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Dna, LayoutDashboard, FileCode, BarChart3, 
  Settings, LogOut, Upload, Clock, CheckCircle,
  FolderOpen, Bell, User, Menu, X, Shield, Loader2, Plus
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface Project {
  id: string;
  name: string;
  type: string;
  status: string;
  created_at: string;
}

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
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
    }
  }, [user]);

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
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
