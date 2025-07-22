import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Header from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Building, Users, Plus, Edit, Trash2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

export default function Organizations() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  const [editingOrg, setEditingOrg] = useState<any>(null);

  // Redirect non-master users
  if (user?.role !== 'master') {
    return (
      <div className="p-6">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">Master admin access required.</p>
        </div>
      </div>
    );
  }

  const { data: organizations = [], isLoading } = useQuery({
    queryKey: ["/api/organizations"],
  });



  const createOrgMutation = useMutation({
    mutationFn: async (data: { name: string; slug: string }) => {
      return await apiRequest("POST", "/api/organizations", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations"] });
      setIsCreateDialogOpen(false);
      setOrgName("");
      setOrgSlug("");
      toast({
        title: "Organization Created",
        description: "New client organization has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Creation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateOrgMutation = useMutation({
    mutationFn: async (data: { id: number; name: string; slug: string }) => {
      return await apiRequest("PUT", `/api/organizations/${data.id}`, { name: data.name, slug: data.slug });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organizations"] });
      setIsEditDialogOpen(false);
      setEditingOrg(null);
      setOrgName("");
      setOrgSlug("");
      toast({
        title: "Organization Updated",
        description: "Organization has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateOrg = () => {
    if (!orgName.trim() || !orgSlug.trim()) {
      toast({
        title: "Validation Error",
        description: "Organization name and slug are required.",
        variant: "destructive",
      });
      return;
    }
    createOrgMutation.mutate({ name: orgName.trim(), slug: orgSlug.trim() });
  };

  const handleEditOrg = (org: any) => {
    setEditingOrg(org);
    setOrgName(org.name);
    setOrgSlug(org.slug);
    setIsEditDialogOpen(true);
  };

  const handleUpdateOrg = () => {
    if (!orgName.trim() || !orgSlug.trim() || !editingOrg) {
      toast({
        title: "Validation Error",
        description: "Organization name and slug are required.",
        variant: "destructive",
      });
      return;
    }
    updateOrgMutation.mutate({ 
      id: editingOrg.id, 
      name: orgName.trim(), 
      slug: orgSlug.trim() 
    });
  };

  // Generate slug from name
  const handleNameChange = (name: string) => {
    setOrgName(name);
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setOrgSlug(slug);
  };

  if (isLoading) {
    return (
      <>
        <Header title="Organization Management" description="Manage client organizations" />
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Organization Management" description="Manage client organizations" />
      <div className="p-4 lg:p-6">
        {/* Header Actions */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold">Client Organizations</h2>
            <p className="text-muted-foreground">{organizations.length} organizations</p>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2" size={16} />
                Add Organization
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Organization</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="org-name">Organization Name</Label>
                  <Input
                    id="org-name"
                    placeholder="e.g., Acme Corp"
                    value={orgName}
                    onChange={(e) => handleNameChange(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="org-slug">URL Slug</Label>
                  <Input
                    id="org-slug"
                    placeholder="e.g., acme-corp"
                    value={orgSlug}
                    onChange={(e) => setOrgSlug(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Used for API endpoints and URLs
                  </p>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={handleCreateOrg} 
                    disabled={createOrgMutation.isPending}
                    className="flex-1"
                  >
                    {createOrgMutation.isPending ? "Creating..." : "Create Organization"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Organizations List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {organizations.map((org: any) => (
            <Card key={org.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <Building className="text-blue-600 dark:text-blue-400" size={20} />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{org.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">/{org.slug}</p>
                    </div>
                  </div>
                  <Badge variant={org.isActive ? "default" : "secondary"}>
                    {org.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Users</span>
                    <div className="flex items-center">
                      <Users size={14} className="mr-1" />
                      <span className="font-medium">{org.userCount || 0}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Orders</span>
                    <span className="font-medium">{org.orderCount || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Created</span>
                    <span className="font-medium">
                      {new Date(org.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleEditOrg(org)}
                      >
                        <Edit size={14} className="mr-1" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" disabled>
                        <Trash2 size={14} className="mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {organizations.length === 0 && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Building className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Organizations</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first client organization to get started.
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="mr-2" size={16} />
                  Add Organization
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Edit Organization Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Organization</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-org-name">Organization Name</Label>
                <Input
                  id="edit-org-name"
                  placeholder="e.g., Acme Corp"
                  value={orgName}
                  onChange={(e) => handleNameChange(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="edit-org-slug">URL Slug</Label>
                <Input
                  id="edit-org-slug"
                  placeholder="e.g., acme-corp"
                  value={orgSlug}
                  onChange={(e) => setOrgSlug(e.target.value)}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Used for API endpoints and URLs
                </p>
              </div>
              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={handleUpdateOrg} 
                  disabled={updateOrgMutation.isPending}
                  className="flex-1"
                >
                  {updateOrgMutation.isPending ? "Updating..." : "Update Organization"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setEditingOrg(null);
                    setOrgName("");
                    setOrgSlug("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}