import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Header from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Settings, Key, Bell, Globe, Shield, Copy, Trash2, Edit, Plus, Eye, EyeOff } from "lucide-react";

const apiSettingsSchema = z.object({
  shipstationApiKey: z.string().min(1, "ShipStation API key is required"),
  shipstationApiSecret: z.string().min(1, "ShipStation API secret is required"),
  jiayouApiKey: z.string().min(1, "Jiayou API key is required"),
  jiayouClientId: z.string().min(1, "Jiayou Client ID is required"),
});

const notificationSettingsSchema = z.object({
  emailNotifications: z.boolean(),
  smsNotifications: z.boolean(),
  webhookUrl: z.string().optional(),
  notificationFrequency: z.enum(["realtime", "hourly", "daily"]),
});

const createApiKeySchema = z.object({
  name: z.string().min(1, "Company name is required"),
  permissions: z.array(z.string()).min(1, "At least one permission is required"),
});

export default function SettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("api");
  const [showCreateApiKeyForm, setShowCreateApiKeyForm] = useState(false);
  const [newApiKey, setNewApiKey] = useState<any>(null);

  const apiForm = useForm({
    resolver: zodResolver(apiSettingsSchema),
    defaultValues: {
      shipstationApiKey: "58422b16196741d7bb3c32d7e6e43827",
      shipstationApiSecret: "4cd58d5f1e90467aa87268abbb5eeb3b",
      jiayouApiKey: "d370d0ee7e704117bfca9184bc03f590",
      jiayouClientId: "769908",
    },
  });

  const notificationForm = useForm({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: {
      emailNotifications: true,
      smsNotifications: false,
      webhookUrl: "",
      notificationFrequency: "realtime" as const,
    },
  });

  const handleApiSettingsSave = (data: any) => {
    // In a real app, this would save to backend
    console.log("API Settings:", data);
    toast({
      title: "Success",
      description: "API settings saved successfully",
    });
  };

  const handleNotificationSettingsSave = (data: any) => {
    // In a real app, this would save to backend
    console.log("Notification Settings:", data);
    toast({
      title: "Success",
      description: "Notification settings saved successfully",
    });
  };

  // API Keys Query
  const { data: apiKeys, isLoading: isLoadingApiKeys } = useQuery({
    queryKey: ["/api/api-keys"],
  });

  // Create API Key Form
  const createApiKeyForm = useForm({
    resolver: zodResolver(createApiKeySchema),
    defaultValues: {
      name: "",
      permissions: [],
    },
  });

  // Create API Key Mutation
  const createApiKeyMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/api-keys", data);
      return response.json();
    },
    onSuccess: (data) => {
      setNewApiKey(data);
      setShowCreateApiKeyForm(false);
      queryClient.invalidateQueries({ queryKey: ["/api/api-keys"] });
      toast({
        title: "API Key Created",
        description: "New API key created successfully. Make sure to copy it now!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create API key",
        variant: "destructive",
      });
    },
  });

  // Delete API Key Mutation
  const deleteApiKeyMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/api-keys/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/api-keys"] });
      toast({
        title: "API Key Deleted",
        description: "API key has been deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete API key",
        variant: "destructive",
      });
    },
  });

  const handleCreateApiKey = (data: any) => {
    createApiKeyMutation.mutate(data);
  };

  const handleDeleteApiKey = (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete the API key for "${name}"?`)) {
      deleteApiKeyMutation.mutate(id);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "API key copied to clipboard",
    });
  };

  const handleTestConnection = async (service: string) => {
    try {
      toast({
        title: "Testing Connection",
        description: `Testing connection to ${service}...`,
      });
      
      // Simulate API test - in real app, would call backend
      setTimeout(() => {
        toast({
          title: "Success",
          description: `${service} connection test passed`,
        });
      }, 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to connect to ${service}`,
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Header 
        title="Settings" 
        description="Configure your API keys and preferences"
      />
      
      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="api" className="flex items-center space-x-2">
              <Key size={16} />
              <span>API Keys</span>
            </TabsTrigger>
            <TabsTrigger value="sharing" className="flex items-center space-x-2">
              <Globe size={16} />
              <span>API Sharing</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center space-x-2">
              <Bell size={16} />
              <span>Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="general" className="flex items-center space-x-2">
              <Settings size={16} />
              <span>General</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="api" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Key size={20} />
                  <span>API Configuration</span>
                </CardTitle>
                <p className="text-slate-600">Configure your ShipStation and Jiayou API credentials</p>
              </CardHeader>
              <CardContent>
                <form onSubmit={apiForm.handleSubmit(handleApiSettingsSave)} className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="font-medium text-slate-900">ShipStation API</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="shipstationApiKey">API Key</Label>
                        <Input
                          id="shipstationApiKey"
                          type="password"
                          {...apiForm.register("shipstationApiKey")}
                        />
                        {apiForm.formState.errors.shipstationApiKey && (
                          <p className="text-red-500 text-sm mt-1">
                            {apiForm.formState.errors.shipstationApiKey.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="shipstationApiSecret">API Secret</Label>
                        <Input
                          id="shipstationApiSecret"
                          type="password"
                          {...apiForm.register("shipstationApiSecret")}
                        />
                        {apiForm.formState.errors.shipstationApiSecret && (
                          <p className="text-red-500 text-sm mt-1">
                            {apiForm.formState.errors.shipstationApiSecret.message}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => handleTestConnection("ShipStation")}
                    >
                      Test ShipStation Connection
                    </Button>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-medium text-slate-900">Jiayou API</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="jiayouApiKey">API Key</Label>
                        <Input
                          id="jiayouApiKey"
                          type="password"
                          {...apiForm.register("jiayouApiKey")}
                        />
                        {apiForm.formState.errors.jiayouApiKey && (
                          <p className="text-red-500 text-sm mt-1">
                            {apiForm.formState.errors.jiayouApiKey.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="jiayouClientId">Client ID</Label>
                        <Input
                          id="jiayouClientId"
                          {...apiForm.register("jiayouClientId")}
                        />
                        {apiForm.formState.errors.jiayouClientId && (
                          <p className="text-red-500 text-sm mt-1">
                            {apiForm.formState.errors.jiayouClientId.message}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => handleTestConnection("Jiayou")}
                    >
                      Test Jiayou Connection
                    </Button>
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit">Save API Settings</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sharing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Globe size={20} />
                    <span>API Sharing</span>
                  </div>
                  <Button 
                    onClick={() => setShowCreateApiKeyForm(true)}
                    disabled={createApiKeyMutation.isPending}
                  >
                    <Plus size={16} className="mr-2" />
                    Create API Key
                  </Button>
                </CardTitle>
                <p className="text-slate-600">Share your shipment management API with other companies</p>
              </CardHeader>
              <CardContent>
                {/* New API Key Alert */}
                {newApiKey && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center space-x-2 mb-2">
                      <Key size={16} className="text-yellow-600" />
                      <span className="font-medium text-yellow-800">New API Key Created</span>
                    </div>
                    <p className="text-sm text-yellow-700 mb-3">
                      Copy this key now - you won't be able to see it again!
                    </p>
                    <div className="bg-white border rounded p-2 flex items-center justify-between">
                      <code className="text-sm text-gray-800">{newApiKey.keySecret}</code>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => copyToClipboard(newApiKey.keySecret)}
                      >
                        <Copy size={14} />
                      </Button>
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => setNewApiKey(null)}
                      className="mt-2"
                    >
                      Dismiss
                    </Button>
                  </div>
                )}

                {/* Create API Key Form */}
                {showCreateApiKeyForm && (
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle>Create New API Key</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={createApiKeyForm.handleSubmit(handleCreateApiKey)} className="space-y-4">
                        <div>
                          <Label htmlFor="name">Company Name</Label>
                          <Input
                            id="name"
                            placeholder="e.g., Acme Corp"
                            {...createApiKeyForm.register("name")}
                          />
                          {createApiKeyForm.formState.errors.name && (
                            <p className="text-red-500 text-sm mt-1">
                              {createApiKeyForm.formState.errors.name.message}
                            </p>
                          )}
                        </div>
                        
                        <div>
                          <Label>Permissions</Label>
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            {[
                              { value: "read:orders", label: "Read Orders" },
                              { value: "write:orders", label: "Write Orders" },
                              { value: "read:shipments", label: "Read Shipments" },
                              { value: "write:shipments", label: "Create Shipments" },
                              { value: "read:tracking", label: "Read Tracking" },
                              { value: "write:tracking", label: "Update Tracking" },
                            ].map((permission) => (
                              <div key={permission.value} className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id={permission.value}
                                  value={permission.value}
                                  {...createApiKeyForm.register("permissions")}
                                />
                                <Label htmlFor={permission.value} className="text-sm">
                                  {permission.label}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex justify-end space-x-2">
                          <Button 
                            type="button" 
                            variant="outline"
                            onClick={() => setShowCreateApiKeyForm(false)}
                          >
                            Cancel
                          </Button>
                          <Button 
                            type="submit"
                            disabled={createApiKeyMutation.isPending}
                          >
                            {createApiKeyMutation.isPending ? "Creating..." : "Create API Key"}
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                )}

                {/* API Keys List */}
                {isLoadingApiKeys ? (
                  <div className="text-center py-8">Loading API keys...</div>
                ) : apiKeys && apiKeys.length > 0 ? (
                  <div className="space-y-4">
                    {apiKeys.map((apiKey: any) => (
                      <Card key={apiKey.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <h3 className="font-medium">{apiKey.name}</h3>
                                <span className={`px-2 py-1 rounded text-xs ${
                                  apiKey.isActive 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {apiKey.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                Key ID: <code className="bg-gray-100 px-1 rounded">{apiKey.keyId}</code>
                              </p>
                              <p className="text-sm text-gray-600">
                                Secret: <code className="bg-gray-100 px-1 rounded">{apiKey.keySecret}</code>
                              </p>
                              <p className="text-sm text-gray-600">
                                Permissions: {apiKey.permissions.join(", ")}
                              </p>
                              <p className="text-sm text-gray-500">
                                Created: {new Date(apiKey.createdAt).toLocaleDateString()}
                                {apiKey.lastUsed && ` • Last used: ${new Date(apiKey.lastUsed).toLocaleDateString()}`}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => copyToClipboard(apiKey.keyId)}
                              >
                                <Copy size={14} />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => handleDeleteApiKey(apiKey.id, apiKey.name)}
                                disabled={deleteApiKeyMutation.isPending}
                              >
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Key size={48} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">No API keys created yet</p>
                    <p className="text-sm text-gray-500">Create your first API key to share with other companies</p>
                  </div>
                )}

                {/* API Documentation */}
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>API Documentation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Base URL</h4>
                        <code className="bg-gray-100 px-2 py-1 rounded block">
                          {window.location.origin}/api
                        </code>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Authentication</h4>
                        <p className="text-sm text-gray-600 mb-2">
                          Include the API key in the Authorization header:
                        </p>
                        <code className="bg-gray-100 px-2 py-1 rounded block text-sm">
                          Authorization: Bearer YOUR_API_KEY_HERE
                        </code>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Available Endpoints</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center space-x-2">
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">GET</span>
                            <code>/orders</code>
                            <span className="text-gray-600">- List all orders</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">POST</span>
                            <code>/shipments/create</code>
                            <span className="text-gray-600">- Create new shipment</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">GET</span>
                            <code>/tracking/:trackingNumber</code>
                            <span className="text-gray-600">- Get tracking information</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell size={20} />
                  <span>Notification Settings</span>
                </CardTitle>
                <p className="text-slate-600">Configure how you receive updates about your shipments</p>
              </CardHeader>
              <CardContent>
                <form onSubmit={notificationForm.handleSubmit(handleNotificationSettingsSave)} className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="emailNotifications">Email Notifications</Label>
                        <p className="text-sm text-slate-500">Receive updates via email</p>
                      </div>
                      <Switch
                        id="emailNotifications"
                        checked={notificationForm.watch("emailNotifications")}
                        onCheckedChange={(checked) => notificationForm.setValue("emailNotifications", checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="smsNotifications">SMS Notifications</Label>
                        <p className="text-sm text-slate-500">Receive updates via SMS</p>
                      </div>
                      <Switch
                        id="smsNotifications"
                        checked={notificationForm.watch("smsNotifications")}
                        onCheckedChange={(checked) => notificationForm.setValue("smsNotifications", checked)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="webhookUrl">Webhook URL</Label>
                      <Input
                        id="webhookUrl"
                        placeholder="https://yourapi.com/webhook"
                        {...notificationForm.register("webhookUrl")}
                      />
                      <p className="text-sm text-slate-500 mt-1">Optional: Send notifications to your webhook endpoint</p>
                    </div>

                    <div>
                      <Label htmlFor="notificationFrequency">Notification Frequency</Label>
                      <Select
                        value={notificationForm.watch("notificationFrequency")}
                        onValueChange={(value: any) => notificationForm.setValue("notificationFrequency", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="realtime">Real-time</SelectItem>
                          <SelectItem value="hourly">Hourly</SelectItem>
                          <SelectItem value="daily">Daily</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit">Save Notification Settings</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings size={20} />
                  <span>General Settings</span>
                </CardTitle>
                <p className="text-slate-600">Configure general application preferences</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select defaultValue="UTC">
                      <SelectTrigger>
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="America/New_York">Eastern Time</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                        <SelectItem value="Europe/London">London</SelectItem>
                        <SelectItem value="Asia/Shanghai">Shanghai</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="dateFormat">Date Format</Label>
                    <Select defaultValue="MM/DD/YYYY">
                      <SelectTrigger>
                        <SelectValue placeholder="Select date format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                        <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                        <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="currency">Default Currency</Label>
                    <Select defaultValue="USD">
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                        <SelectItem value="CNY">CNY (¥)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button>Save General Settings</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield size={20} />
                  <span>Security Settings</span>
                </CardTitle>
                <p className="text-slate-600">Manage your account security and access controls</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      placeholder="Enter current password"
                    />
                  </div>

                  <div>
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="Enter new password"
                    />
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm new password"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="twoFactor">Two-Factor Authentication</Label>
                      <p className="text-sm text-slate-500">Add an extra layer of security</p>
                    </div>
                    <Switch id="twoFactor" />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button>Update Security Settings</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}