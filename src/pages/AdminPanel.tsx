import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Shield, ShieldOff, Users, Loader2, ChevronDown, ChevronUp, FileText, FolderOpen, Download, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface UserFile {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string | null;
  created_at: string;
  project_name: string;
}

interface UserProject {
  id: string;
  name: string;
  type: string;
  status: string;
  created_at: string;
}

interface UserWithRole {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  isAdmin: boolean;
  projects: UserProject[];
  files: UserFile[];
}

const AdminPanel = () => {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    } else if (!loading && user && !isAdmin) {
      toast.error("Access denied. Admin privileges required.");
      navigate("/dashboard");
    }
  }, [user, loading, isAdmin, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch all admin roles
      const { data: adminRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");

      if (rolesError) throw rolesError;

      // Fetch all projects
      const { data: projects, error: projectsError } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (projectsError) throw projectsError;

      // Fetch all files with project names
      const { data: files, error: filesError } = await supabase
        .from("project_files")
        .select("*, projects(name)")
        .order("created_at", { ascending: false });

      if (filesError) throw filesError;

      const adminUserIds = new Set(adminRoles?.map((r) => r.user_id) || []);

      const usersWithRoles: UserWithRole[] = (profiles || []).map((profile) => {
        const userProjects = (projects || [])
          .filter((p) => p.user_id === profile.user_id)
          .map((p) => ({
            id: p.id,
            name: p.name,
            type: p.type,
            status: p.status,
            created_at: p.created_at,
          }));

        const userFiles = (files || [])
          .filter((f) => f.user_id === profile.user_id)
          .map((f) => ({
            id: f.id,
            file_name: f.file_name,
            file_path: f.file_path,
            file_size: f.file_size,
            mime_type: f.mime_type,
            created_at: f.created_at,
            project_name: (f.projects as any)?.name || "Unknown Project",
          }));

        return {
          id: profile.id,
          user_id: profile.user_id,
          email: profile.email,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          created_at: profile.created_at,
          isAdmin: adminUserIds.has(profile.user_id),
          projects: userProjects,
          files: userFiles,
        };
      });

      setUsers(usersWithRoles);
    } catch (error: any) {
      toast.error("Failed to fetch users: " + error.message);
    } finally {
      setLoadingUsers(false);
    }
  };

  const toggleAdminRole = async (targetUserId: string, currentlyAdmin: boolean) => {
    if (targetUserId === user?.id) {
      toast.error("You cannot modify your own admin status.");
      return;
    }

    setUpdatingUserId(targetUserId);
    try {
      if (currentlyAdmin) {
        // Remove admin role
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", targetUserId)
          .eq("role", "admin");

        if (error) throw error;
        toast.success("Admin role removed successfully.");
      } else {
        // Add admin role
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: targetUserId, role: "admin" });

        if (error) throw error;
        toast.success("Admin role assigned successfully.");
      }

      // Update local state
      setUsers((prev) =>
        prev.map((u) =>
          u.user_id === targetUserId ? { ...u, isAdmin: !currentlyAdmin } : u
        )
      );
    } catch (error: any) {
      toast.error("Failed to update role: " + error.message);
    } finally {
      setUpdatingUserId(null);
    }
  };

  const toggleUserExpanded = (userId: string) => {
    setExpandedUsers((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const downloadFile = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from("project-files")
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast.error("Failed to download file: " + error.message);
    }
  };

  const deleteFile = async (fileId: string, filePath: string, userId: string) => {
    setDeletingFileId(fileId);
    try {
      // Delete from storage bucket
      const { error: storageError } = await supabase.storage
        .from("project-files")
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from("project_files")
        .delete()
        .eq("id", fileId);

      if (dbError) throw dbError;

      // Update local state
      setUsers((prev) =>
        prev.map((u) =>
          u.user_id === userId
            ? { ...u, files: u.files.filter((f) => f.id !== fileId) }
            : u
        )
      );

      toast.success("File deleted successfully.");
    } catch (error: any) {
      toast.error("Failed to delete file: " + error.message);
    } finally {
      setDeletingFileId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Admin Panel</h1>
              <p className="text-muted-foreground">Manage users, view projects and files</p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>
              View all users, their projects, files, and manage admin privileges
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingUsers ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No users found.
              </div>
            ) : (
              <div className="space-y-4">
                {users.map((u) => (
                  <Collapsible
                    key={u.id}
                    open={expandedUsers.has(u.user_id)}
                    onOpenChange={() => toggleUserExpanded(u.user_id)}
                  >
                    <div className="border rounded-lg">
                      <CollapsibleTrigger asChild>
                        <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              {u.avatar_url ? (
                                <img
                                  src={u.avatar_url}
                                  alt={u.full_name || "User"}
                                  className="h-10 w-10 rounded-full object-cover"
                                />
                              ) : (
                                <span className="text-primary font-semibold">
                                  {(u.full_name || u.email || "U").charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div>
                              <div className="font-medium">{u.full_name || "No Name"}</div>
                              <div className="text-sm text-muted-foreground">{u.email || "No Email"}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <FolderOpen className="h-4 w-4" />
                              <span>{u.projects.length} projects</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <FileText className="h-4 w-4" />
                              <span>{u.files.length} files</span>
                            </div>
                            <Badge variant={u.isAdmin ? "default" : "secondary"}>
                              {u.isAdmin ? "Admin" : "User"}
                            </Badge>
                            {u.user_id === user?.id ? (
                              <span className="text-sm text-muted-foreground">(You)</span>
                            ) : (
                              <Button
                                size="sm"
                                variant={u.isAdmin ? "destructive" : "outline"}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleAdminRole(u.user_id, u.isAdmin);
                                }}
                                disabled={updatingUserId === u.user_id}
                              >
                                {updatingUserId === u.user_id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : u.isAdmin ? (
                                  <>
                                    <ShieldOff className="mr-1 h-4 w-4" />
                                    Remove Admin
                                  </>
                                ) : (
                                  <>
                                    <Shield className="mr-1 h-4 w-4" />
                                    Make Admin
                                  </>
                                )}
                              </Button>
                            )}
                            {expandedUsers.has(u.user_id) ? (
                              <ChevronUp className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="border-t px-4 py-4 space-y-6 bg-muted/20">
                          {/* User Details */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">User ID:</span>
                              <p className="font-mono text-xs mt-1 break-all">{u.user_id}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Joined:</span>
                              <p className="mt-1">{new Date(u.created_at).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Avatar URL:</span>
                              <p className="mt-1 truncate">{u.avatar_url || "Not set"}</p>
                            </div>
                          </div>

                          {/* Projects Section */}
                          <div>
                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                              <FolderOpen className="h-4 w-4" />
                              Projects ({u.projects.length})
                            </h4>
                            {u.projects.length === 0 ? (
                              <p className="text-sm text-muted-foreground">No projects yet.</p>
                            ) : (
                              <div className="overflow-x-auto">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Name</TableHead>
                                      <TableHead>Type</TableHead>
                                      <TableHead>Status</TableHead>
                                      <TableHead>Created</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {u.projects.map((project) => (
                                      <TableRow key={project.id}>
                                        <TableCell className="font-medium">{project.name}</TableCell>
                                        <TableCell>{project.type}</TableCell>
                                        <TableCell>
                                          <Badge variant="outline">{project.status}</Badge>
                                        </TableCell>
                                        <TableCell>
                                          {new Date(project.created_at).toLocaleDateString()}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            )}
                          </div>

                          {/* Files Section */}
                          <div>
                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              Files ({u.files.length})
                            </h4>
                            {u.files.length === 0 ? (
                              <p className="text-sm text-muted-foreground">No files uploaded yet.</p>
                            ) : (
                              <div className="overflow-x-auto">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>File Name</TableHead>
                                      <TableHead>Project</TableHead>
                                      <TableHead>Size</TableHead>
                                      <TableHead>Type</TableHead>
                                      <TableHead>Uploaded</TableHead>
                                      <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {u.files.map((file) => (
                                      <TableRow key={file.id}>
                                        <TableCell className="font-medium max-w-[200px] truncate">
                                          {file.file_name}
                                        </TableCell>
                                        <TableCell>{file.project_name}</TableCell>
                                        <TableCell>{formatFileSize(file.file_size)}</TableCell>
                                        <TableCell className="max-w-[100px] truncate">
                                          {file.mime_type || "Unknown"}
                                        </TableCell>
                                        <TableCell>
                                          {new Date(file.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                          <div className="flex justify-end gap-1">
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              onClick={() => downloadFile(file.file_path, file.file_name)}
                                            >
                                              <Download className="h-4 w-4" />
                                            </Button>
                                            <AlertDialog>
                                              <AlertDialogTrigger asChild>
                                                <Button
                                                  size="sm"
                                                  variant="ghost"
                                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                  disabled={deletingFileId === file.id}
                                                >
                                                  {deletingFileId === file.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                  ) : (
                                                    <Trash2 className="h-4 w-4" />
                                                  )}
                                                </Button>
                                              </AlertDialogTrigger>
                                              <AlertDialogContent>
                                                <AlertDialogHeader>
                                                  <AlertDialogTitle>Delete File</AlertDialogTitle>
                                                  <AlertDialogDescription>
                                                    Are you sure you want to delete "{file.file_name}"? This action cannot be undone.
                                                  </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                  <AlertDialogAction
                                                    onClick={() => deleteFile(file.id, file.file_path, u.user_id)}
                                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                  >
                                                    Delete
                                                  </AlertDialogAction>
                                                </AlertDialogFooter>
                                              </AlertDialogContent>
                                            </AlertDialog>
                                          </div>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
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
      </div>
    </div>
  );
};

export default AdminPanel;
