import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Shield, ShieldOff, Users, Loader2 } from "lucide-react";

interface UserWithRole {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
  isAdmin: boolean;
}

const AdminPanel = () => {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

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

      const adminUserIds = new Set(adminRoles?.map((r) => r.user_id) || []);

      const usersWithRoles: UserWithRole[] = (profiles || []).map((profile) => ({
        id: profile.id,
        user_id: profile.user_id,
        email: profile.email,
        full_name: profile.full_name,
        created_at: profile.created_at,
        isAdmin: adminUserIds.has(profile.user_id),
      }));

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
              <p className="text-muted-foreground">Manage users and assign roles</p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>
              View all users and manage their admin privileges
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
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">
                          {u.full_name || "—"}
                        </TableCell>
                        <TableCell>{u.email || "—"}</TableCell>
                        <TableCell>
                          {new Date(u.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={u.isAdmin ? "default" : "secondary"}>
                            {u.isAdmin ? "Admin" : "User"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {u.user_id === user?.id ? (
                            <span className="text-sm text-muted-foreground">
                              (You)
                            </span>
                          ) : (
                            <Button
                              size="sm"
                              variant={u.isAdmin ? "destructive" : "outline"}
                              onClick={() => toggleAdminRole(u.user_id, u.isAdmin)}
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
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminPanel;
