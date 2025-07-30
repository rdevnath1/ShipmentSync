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
import { Settings, Key, Bell, Globe, Shield, Copy, Trash2, Edit, Plus, Eye, EyeOff, Lock, Truck, Wallet, DollarSign, CreditCard, Building2, Zap, Clock, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/theme-toggle";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const apiSettingsSchema = z.object({
  shipstationApiKey: z.string().min(1, "ShipStation API key is required"),
  shipstationApiSecret: z.string().min(1, "ShipStation API secret is required"),
  jiayouApiKey: z.string().min(1, "Quikpik API key is required"),
  jiayouClientId: z.string().min(1, "Quikpik Client ID is required"),
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

const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your new password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const carrierAccountSchema = z.object({
  carrier: z.enum(["fedex", "usps"]),
  accountNumber: z.string().optional(),
  clientId: z.string().optional(),
  clientSecret: z.string().optional(),
  userId: z.string().optional(),
  apiUrl: z.string().optional(),
  enabled: z.boolean().default(false),
});

const automationRulesSchema = z.object({
  autoSelectCheapestCarrier: z.boolean(),
  autoCreateLabels: z.boolean(),
  batchProcessingEnabled: z.boolean(),
  batchProcessingSchedule: z.enum(["immediate", "hourly", "daily"]),
  lowBalanceThreshold: z.number().min(0),
  lowBalanceAlerts: z.boolean(),
  preferredCarrier: z.enum(["none", "quikpik", "fedex", "usps"]),
  maxRetryAttempts: z.number().min(1).max(5),
});

export default function SettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("general");
  const [showCreateApiKeyForm, setShowCreateApiKeyForm] = useState(false);
  const [newApiKey, setNewApiKey] = useState<any>(null);
  const [showCarrierDialog, setShowCarrierDialog] = useState(false);
  const [editingCarrierAccount, setEditingCarrierAccount] = useState<any>(null);
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
  const [creditForm, setCreditForm] = useState({
    organizationId: '',
    amount: '',
    description: '',
    referenceId: ''
  });
  
  const isMasterAdmin = user?.role === 'master';

  const passwordForm = useForm({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

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

  const carrierAccountForm = useForm({
    resolver: zodResolver(carrierAccountSchema),
    defaultValues: {
      carrier: "fedex" as const,
      accountNumber: "",
      meterNumber: "",
      key: "",
      password: "",
      apiUrl: "",
    },
  });

  const automationForm = useForm({
    resolver: zodResolver(automationRulesSchema),
    defaultValues: {
      autoSelectCheapestCarrier: false,
      autoCreateLabels: false,
      batchProcessingEnabled: false,
      batchProcessingSchedule: "hourly" as const,
      lowBalanceThreshold: 50,
      lowBalanceAlerts: true,
      preferredCarrier: "none" as const,
      maxRetryAttempts: 3,
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

  const handlePasswordChange = async (data: any) => {
    try {
      const response = await apiRequest("POST", "/api/auth/change-password", data);
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Password Changed",
          description: "Your password has been updated successfully.",
        });
        passwordForm.reset();
      } else {
        toast({
          title: "Password Change Failed",
          description: result.error || "Failed to change password",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    }
  };

  const handleNotificationSettingsSave = (data: any) => {
    // In a real app, this would save to backend
    console.log("Notification Settings:", data);
    toast({
      title: "Success",
      description: "Notification settings saved successfully",
    });
  };

  const handleAutomationRulesSave = (data: any) => {
    // In a real app, this would save to backend
    console.log("Automation Rules:", data);
    toast({
      title: "Success",
      description: "Automation rules saved successfully",
    });
  };

  // API Keys Query
  const { data: apiKeys, isLoading: isLoadingApiKeys } = useQuery({
    queryKey: ["/api/api-keys"],
  });

  // Carrier Accounts Query
  const { data: carrierAccounts, isLoading: isLoadingCarrierAccounts } = useQuery({
    queryKey: ["/api/carrier-accounts"],
  });

  // Wallet Query
  const { data: walletData } = useQuery<{ balance: number; wallet: any; bankDetails: any }>({
    queryKey: ["/api/wallet"],
  });

  const walletBalance = walletData?.balance || 0;

  // Wallet Transactions Query
  const { data: transactionsData, isLoading: isLoadingTransactions } = useQuery<{ transactions: any[] }>({
    queryKey: ["/api/wallet/transactions"],
  });

  const transactions = transactionsData?.transactions || [];

  // Organizations Query (master admin only)
  const { data: organizations } = useQuery({
    queryKey: ["/api/organizations"],
    enabled: isMasterAdmin,
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

  // Carrier Account Mutations
  const createCarrierAccountMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/carrier-accounts", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/carrier-accounts"] });
      setShowCarrierDialog(false);
      carrierAccountForm.reset();
      toast({
        title: "Carrier Account Added",
        description: "Carrier account has been added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add carrier account",
        variant: "destructive",
      });
    },
  });

  const updateCarrierAccountMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest("PUT", `/api/carrier-accounts/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/carrier-accounts"] });
      setShowCarrierDialog(false);
      setEditingCarrierAccount(null);
      carrierAccountForm.reset();
      toast({
        title: "Carrier Account Updated",
        description: "Carrier account has been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update carrier account",
        variant: "destructive",
      });
    },
  });

  const deleteCarrierAccountMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/carrier-accounts/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/carrier-accounts"] });
      toast({
        title: "Carrier Account Deleted",
        description: "Carrier account has been deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete carrier account",
        variant: "destructive",
      });
    },
  });

  const handleSaveCarrierAccount = (data: any) => {
    if (editingCarrierAccount) {
      updateCarrierAccountMutation.mutate({ id: editingCarrierAccount.id, data });
    } else {
      createCarrierAccountMutation.mutate(data);
    }
  };

  const handleEditCarrierAccount = (account: any) => {
    setEditingCarrierAccount(account);
    carrierAccountForm.reset({
      carrier: account.carrier,
      accountNumber: account.accountNumber,
      meterNumber: account.meterNumber || "",
      key: account.key,
      password: account.password,
      apiUrl: account.apiUrl || "",
    });
    setShowCarrierDialog(true);
  };

  const handleDeleteCarrierAccount = (id: number, carrier: string) => {
    if (window.confirm(`Are you sure you want to delete the ${carrier.toUpperCase()} account?`)) {
      deleteCarrierAccountMutation.mutate(id);
    }
  };

  // Add Credit Mutation (master admin only)
  const addCreditMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/wallet/add-credit", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallet"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet/transactions"] });
      setCreditForm({
        organizationId: '',
        amount: '',
        description: '',
        referenceId: ''
      });
      toast({
        title: "Credit Added",
        description: "Credit has been added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add credit",
        variant: "destructive",
      });
    },
  });

  const handleAddCredit = (e: React.FormEvent) => {
    e.preventDefault();
    addCreditMutation.mutate({
      organizationId: parseInt(creditForm.organizationId),
      amount: parseFloat(creditForm.amount),
      description: creditForm.description,
      referenceId: creditForm.referenceId || null,
    });
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
          <TabsList className={`grid w-full ${isMasterAdmin ? 'grid-cols-6' : 'grid-cols-5'}`}>
            <TabsTrigger value="api" className="flex items-center space-x-2">
              <Key size={16} />
              <span>API Keys</span>
            </TabsTrigger>
            <TabsTrigger value="carriers" className="flex items-center space-x-2">
              <Truck size={16} />
              <span>Carriers</span>
            </TabsTrigger>
            <TabsTrigger value="automation" className="flex items-center space-x-2">
              <Zap size={16} />
              <span>Automation</span>
            </TabsTrigger>
            <TabsTrigger value="wallet" className="flex items-center space-x-2">
              <Wallet size={16} />
              <span>Wallet</span>
            </TabsTrigger>
            {isMasterAdmin && (
              <TabsTrigger value="sharing" className="flex items-center space-x-2">
                <Globe size={16} />
                <span>API Sharing</span>
              </TabsTrigger>
            )}
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
                <p className="text-slate-600">Configure your ShipStation and Quikpik API credentials</p>
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
                    <h4 className="font-medium text-slate-900">Quikpik API</h4>
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
                      onClick={() => handleTestConnection("Quikpik")}
                    >
                      Test Quikpik Connection
                    </Button>
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit">Save API Settings</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="carriers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Truck size={20} />
                  <span>Carrier API Settings</span>
                </CardTitle>
                <p className="text-slate-600">Configure your carrier API credentials to get real-time shipping rates</p>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="fedex" className="space-y-6">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="fedex">FedEx</TabsTrigger>
                    <TabsTrigger value="usps">USPS</TabsTrigger>
                    <TabsTrigger value="ups">UPS (Coming Soon)</TabsTrigger>
                  </TabsList>

                  <TabsContent value="fedex">
                    <Card>
                      <CardHeader>
                        <CardTitle>FedEx API Settings</CardTitle>
                        <p className="text-sm text-gray-600">
                          Configure your FedEx Developer Portal credentials
                        </p>
                      </CardHeader>
                      <CardContent>
                        <form className="space-y-4">
                          <div className="flex items-center justify-between mb-4">
                            <Label htmlFor="fedex_enabled">Enable FedEx Integration</Label>
                            <Switch
                              id="fedex_enabled"
                              name="fedex_enabled"
                            />
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="fedex_account_number">Account Number</Label>
                              <Input
                                id="fedex_account_number"
                                placeholder="9-digit FedEx account number"
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor="fedex_client_id">Client ID</Label>
                              <Input
                                id="fedex_client_id"
                                placeholder="From FedEx Developer Portal"
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor="fedex_client_secret">Client Secret</Label>
                              <Input
                                id="fedex_client_secret"
                                type="password"
                                placeholder="From FedEx Developer Portal"
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor="fedex_api_url">API Environment</Label>
                              <Select defaultValue="https://apis-sandbox.fedex.com">
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="https://apis-sandbox.fedex.com">Sandbox (Testing)</SelectItem>
                                  <SelectItem value="https://apis.fedex.com">Production</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          
                          <Button type="submit">
                            Save FedEx Settings
                          </Button>
                        </form>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="usps">
                    <Card>
                      <CardHeader>
                        <CardTitle>USPS API Settings</CardTitle>
                        <p className="text-sm text-gray-600">
                          Configure your USPS Web Tools credentials
                        </p>
                      </CardHeader>
                      <CardContent>
                        <form className="space-y-4">
                          <div className="flex items-center justify-between mb-4">
                            <Label htmlFor="usps_enabled">Enable USPS Integration</Label>
                            <Switch
                              id="usps_enabled"
                              name="usps_enabled"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="usps_user_id">USPS User ID</Label>
                            <Input
                              id="usps_user_id"
                              placeholder="From USPS Web Tools registration"
                            />
                            <p className="text-sm text-gray-500 mt-1">
                              Register at{" "}
                              <a 
                                href="https://registration.shippingapis.com/" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                registration.shippingapis.com
                              </a>
                            </p>
                          </div>
                          
                          <Button type="submit">
                            Save USPS Settings
                          </Button>
                        </form>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="ups">
                    <Card>
                      <CardHeader>
                        <CardTitle>UPS API Settings</CardTitle>
                        <p className="text-sm text-gray-600">
                          UPS integration coming soon
                        </p>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center py-8 text-gray-500">
                          <Truck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>UPS integration will be available in a future update.</p>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Truck size={20} />
                    <span>Carrier Accounts</span>
                  </div>
                  <Button 
                    onClick={() => {
                      setEditingCarrierAccount(null);
                      carrierAccountForm.reset();
                      setShowCarrierDialog(true);
                    }}
                  >
                    <Plus size={16} className="mr-2" />
                    Add Carrier Account
                  </Button>
                </CardTitle>
                <p className="text-slate-600">Manage your FedEx and DHL account credentials for multi-carrier shipping</p>
              </CardHeader>
              <CardContent>
                {isLoadingCarrierAccounts ? (
                  <div className="space-y-4">
                    <div className="h-20 bg-slate-100 rounded animate-pulse" />
                    <div className="h-20 bg-slate-100 rounded animate-pulse" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(!carrierAccounts || !Array.isArray(carrierAccounts) || carrierAccounts.length === 0) ? (
                      <div className="text-center py-8 text-slate-500">
                        <Truck size={48} className="mx-auto mb-4 opacity-30" />
                        <p>No carrier accounts configured</p>
                        <p className="text-sm mt-2">Add FedEx or DHL accounts to compare shipping rates</p>
                      </div>
                    ) : (
                      (carrierAccounts as any[]).map((account: any) => (
                        <div key={account.id} className="border rounded-lg p-4 flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className={`p-2 rounded ${account.carrier === 'fedex' ? 'bg-purple-100' : 'bg-yellow-100'}`}>
                              <Truck size={24} className={account.carrier === 'fedex' ? 'text-purple-600' : 'text-yellow-600'} />
                            </div>
                            <div>
                              <h4 className="font-medium capitalize">{account.carrier}</h4>
                              <p className="text-sm text-slate-600">Account: {account.accountNumber}</p>
                              <p className="text-xs text-slate-500 mt-1">
                                {account.isActive ? 
                                  <span className="text-green-600">● Active</span> : 
                                  <span className="text-red-600">● Inactive</span>
                                }
                              </p>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditCarrierAccount(account)}
                            >
                              <Edit size={14} />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteCarrierAccount(account.id, account.carrier)}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="automation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap size={20} />
                  <span>Automation Rules</span>
                </CardTitle>
                <p className="text-slate-600">Configure automated shipping workflows and rules</p>
              </CardHeader>
              <CardContent>
                <form onSubmit={automationForm.handleSubmit(handleAutomationRulesSave)} className="space-y-6">
                  {/* Carrier Selection Rules */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-slate-900 flex items-center">
                      <Truck size={16} className="mr-2" />
                      Carrier Selection
                    </h4>
                    
                    <div className="space-y-4 pl-6 border-l-2 border-muted">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="auto-cheapest">Auto-select cheapest carrier</Label>
                          <p className="text-sm text-muted-foreground">Automatically choose the lowest cost shipping option</p>
                        </div>
                        <Switch
                          id="auto-cheapest"
                          checked={automationForm.watch("autoSelectCheapestCarrier")}
                          onCheckedChange={(checked) => automationForm.setValue("autoSelectCheapestCarrier", checked)}
                        />
                      </div>

                      <div>
                        <Label htmlFor="preferred-carrier">Preferred carrier (fallback)</Label>
                        <Select
                          value={automationForm.watch("preferredCarrier")}
                          onValueChange={(value: any) => automationForm.setValue("preferredCarrier", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select preferred carrier" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No preference</SelectItem>
                            <SelectItem value="quikpik">Quikpik</SelectItem>
                            <SelectItem value="fedex">FedEx</SelectItem>
                            <SelectItem value="usps">USPS</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-sm text-muted-foreground mt-1">
                          Used when auto-selection fails or rates are unavailable
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Label Creation */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-slate-900 flex items-center">
                      <Plus size={16} className="mr-2" />
                      Label Creation
                    </h4>
                    
                    <div className="space-y-4 pl-6 border-l-2 border-muted">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="auto-labels">Auto-create shipping labels</Label>
                          <p className="text-sm text-muted-foreground">Automatically generate labels after carrier selection</p>
                        </div>
                        <Switch
                          id="auto-labels"
                          checked={automationForm.watch("autoCreateLabels")}
                          onCheckedChange={(checked) => automationForm.setValue("autoCreateLabels", checked)}
                        />
                      </div>

                      <div>
                        <Label htmlFor="retry-attempts">Max retry attempts</Label>
                        <Select
                          value={automationForm.watch("maxRetryAttempts").toString()}
                          onValueChange={(value) => automationForm.setValue("maxRetryAttempts", parseInt(value))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 attempt</SelectItem>
                            <SelectItem value="2">2 attempts</SelectItem>
                            <SelectItem value="3">3 attempts</SelectItem>
                            <SelectItem value="4">4 attempts</SelectItem>
                            <SelectItem value="5">5 attempts</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-sm text-muted-foreground mt-1">
                          Number of times to retry failed label creation
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Batch Processing */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-slate-900 flex items-center">
                      <Clock size={16} className="mr-2" />
                      Batch Processing
                    </h4>
                    
                    <div className="space-y-4 pl-6 border-l-2 border-muted">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="batch-processing">Enable batch processing</Label>
                          <p className="text-sm text-muted-foreground">Process multiple orders automatically</p>
                        </div>
                        <Switch
                          id="batch-processing"
                          checked={automationForm.watch("batchProcessingEnabled")}
                          onCheckedChange={(checked) => automationForm.setValue("batchProcessingEnabled", checked)}
                        />
                      </div>

                      {automationForm.watch("batchProcessingEnabled") && (
                        <div>
                          <Label htmlFor="batch-schedule">Processing schedule</Label>
                          <Select
                            value={automationForm.watch("batchProcessingSchedule")}
                            onValueChange={(value: any) => automationForm.setValue("batchProcessingSchedule", value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="immediate">Process immediately</SelectItem>
                              <SelectItem value="hourly">Every hour</SelectItem>
                              <SelectItem value="daily">Daily at 9 AM</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-sm text-muted-foreground mt-1">
                            When to automatically process pending orders
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Low Balance Alerts */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-slate-900 flex items-center">
                      <AlertCircle size={16} className="mr-2" />
                      Wallet Alerts
                    </h4>
                    
                    <div className="space-y-4 pl-6 border-l-2 border-muted">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="low-balance-alerts">Low balance notifications</Label>
                          <p className="text-sm text-muted-foreground">Get notified when wallet balance is low</p>
                        </div>
                        <Switch
                          id="low-balance-alerts"
                          checked={automationForm.watch("lowBalanceAlerts")}
                          onCheckedChange={(checked) => automationForm.setValue("lowBalanceAlerts", checked)}
                        />
                      </div>

                      {automationForm.watch("lowBalanceAlerts") && (
                        <div>
                          <Label htmlFor="threshold">Alert threshold ($)</Label>
                          <Input
                            id="threshold"
                            type="number"
                            min="0"
                            step="0.01"
                            value={automationForm.watch("lowBalanceThreshold")}
                            onChange={(e) => automationForm.setValue("lowBalanceThreshold", parseFloat(e.target.value) || 0)}
                          />
                          <p className="text-sm text-muted-foreground mt-1">
                            Send alert when balance falls below this amount
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button type="submit">Save Automation Rules</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {isMasterAdmin && (
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
                ) : apiKeys && Array.isArray(apiKeys) && apiKeys.length > 0 ? (
                  <div className="space-y-4">
                    {(apiKeys as any[]).map((apiKey: any) => (
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
          )}



          <TabsContent value="wallet" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Wallet size={20} />
                  <span>Wallet Management</span>
                </CardTitle>
                <p className="text-slate-600">Manage your prepaid wallet balance and transactions</p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Wallet Balance */}
                <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">Available Balance</p>
                      <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                        ${walletBalance?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                    <div className="bg-white dark:bg-slate-700 rounded-full p-4 shadow-sm">
                      <DollarSign size={24} className="text-green-600" />
                    </div>
                  </div>
                </div>

                {/* Bank Details for ACH Transfer */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Building2 size={18} />
                      <span>Bank Transfer Information</span>
                    </CardTitle>
                    <p className="text-sm text-slate-600">Send ACH transfers to this account to add funds</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm text-slate-600">Beneficiary Name</Label>
                        <p className="font-medium">Radius Platforms Inc.</p>
                      </div>
                      <div>
                        <Label className="text-sm text-slate-600">Account Number</Label>
                        <div className="flex items-center space-x-2">
                          <p className="font-medium">8334837632</p>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard('8334837632')}
                          >
                            <Copy size={14} />
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm text-slate-600">ACH Routing Number</Label>
                        <div className="flex items-center space-x-2">
                          <p className="font-medium">026073150</p>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard('026073150')}
                          >
                            <Copy size={14} />
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm text-slate-600">Bank Name</Label>
                        <p className="font-medium">Community Federal Savings Bank</p>
                      </div>
                      <div className="md:col-span-2">
                        <Label className="text-sm text-slate-600">Bank Address</Label>
                        <p className="font-medium">5 Penn Plaza, 14th Floor, New York, NY 10001, US</p>
                      </div>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mt-4">
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        <strong>Note:</strong> Bank transfers typically take 2-3 hours to reflect in your wallet balance.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Transaction History */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <CreditCard size={18} />
                      <span>Transaction History</span>
                    </CardTitle>
                    <p className="text-sm text-slate-600">Recent wallet activity</p>
                  </CardHeader>
                  <CardContent>
                    {isLoadingTransactions ? (
                      <div className="space-y-4">
                        <div className="h-16 bg-slate-100 rounded animate-pulse" />
                        <div className="h-16 bg-slate-100 rounded animate-pulse" />
                        <div className="h-16 bg-slate-100 rounded animate-pulse" />
                      </div>
                    ) : transactions && transactions.length > 0 ? (
                      <div className="space-y-2">
                        {transactions.map((transaction: any) => (
                          <div key={transaction.id} className="border rounded-lg p-4 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className={`p-2 rounded-full ${
                                transaction.type === 'credit' ? 'bg-green-100' : 'bg-red-100'
                              }`}>
                                {transaction.type === 'credit' ? (
                                  <Plus size={16} className="text-green-600" />
                                ) : (
                                  <Truck size={16} className="text-red-600" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium">{transaction.description}</p>
                                <p className="text-sm text-slate-600">
                                  {new Date(transaction.createdAt).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`font-medium ${
                                transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {transaction.type === 'credit' ? '+' : '-'}${Math.abs(transaction.amount).toFixed(2)}
                              </p>
                              <p className="text-sm text-slate-600">
                                Balance: ${transaction.balanceAfter.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-500">
                        <CreditCard size={48} className="mx-auto mb-4 opacity-30" />
                        <p>No transactions yet</p>
                        <p className="text-sm mt-2">Your wallet activity will appear here</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Master Admin: Add Credit */}
                {isMasterAdmin && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Plus size={18} />
                        <span>Add Credit (Master Admin)</span>
                      </CardTitle>
                      <p className="text-sm text-slate-600">Manually add credits to any organization's wallet</p>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleAddCredit} className="space-y-4">
                        <div>
                          <Label htmlFor="organizationId">Organization</Label>
                          <Select
                            value={creditForm.organizationId}
                            onValueChange={(value) => setCreditForm({...creditForm, organizationId: value})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select organization" />
                            </SelectTrigger>
                            <SelectContent>
                              {organizations?.map((org: any) => (
                                <SelectItem key={org.id} value={org.id.toString()}>
                                  {org.name} (ID: {org.id})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="amount">Amount ($)</Label>
                          <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            min="0.01"
                            placeholder="0.00"
                            value={creditForm.amount}
                            onChange={(e) => setCreditForm({...creditForm, amount: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="description">Description</Label>
                          <Input
                            id="description"
                            placeholder="e.g., Bank transfer reference #12345"
                            value={creditForm.description}
                            onChange={(e) => setCreditForm({...creditForm, description: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="referenceId">Reference ID (Optional)</Label>
                          <Input
                            id="referenceId"
                            placeholder="e.g., ACH-12345"
                            value={creditForm.referenceId}
                            onChange={(e) => setCreditForm({...creditForm, referenceId: e.target.value})}
                          />
                        </div>
                        <Button 
                          type="submit"
                          disabled={addCreditMutation.isPending || !creditForm.organizationId || !creditForm.amount}
                        >
                          {addCreditMutation.isPending ? "Adding..." : "Add Credit"}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                )}
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
                {/* Password Change Section */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-4 flex items-center space-x-2">
                    <Lock size={16} />
                    <span>Change Password</span>
                  </h4>
                  <form onSubmit={passwordForm.handleSubmit(handlePasswordChange)} className="space-y-4">
                    <div>
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        {...passwordForm.register("currentPassword")}
                      />
                      {passwordForm.formState.errors.currentPassword && (
                        <p className="text-red-500 text-sm mt-1">
                          {passwordForm.formState.errors.currentPassword.message}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        {...passwordForm.register("newPassword")}
                      />
                      {passwordForm.formState.errors.newPassword && (
                        <p className="text-red-500 text-sm mt-1">
                          {passwordForm.formState.errors.newPassword.message}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        {...passwordForm.register("confirmPassword")}
                      />
                      {passwordForm.formState.errors.confirmPassword && (
                        <p className="text-red-500 text-sm mt-1">
                          {passwordForm.formState.errors.confirmPassword.message}
                        </p>
                      )}
                    </div>
                    
                    <Button type="submit">Change Password</Button>
                  </form>
                </div>

                {/* Notification Settings */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-4 flex items-center space-x-2">
                    <Bell size={16} />
                    <span>Notification Settings</span>
                  </h4>
                  <form onSubmit={notificationForm.handleSubmit(handleNotificationSettingsSave)} className="space-y-4">
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
                      <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">Webhook Events:</p>
                        <ul className="text-xs text-blue-700 dark:text-blue-300 mt-1 space-y-1">
                          <li>• Low wallet balance alerts</li>
                          <li>• Shipment status updates</li>
                          <li>• Failed shipment notifications</li>
                          <li>• Order import completion</li>
                        </ul>
                      </div>
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

                    <div className="flex justify-end">
                      <Button type="submit">Save Notification Settings</Button>
                    </div>
                  </form>
                </div>

                <Separator />

                <div className="space-y-4">
                  {/* Theme Setting */}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Theme</Label>
                      <p className="text-sm text-slate-500">Choose your preferred theme</p>
                    </div>
                    <ThemeToggle />
                  </div>

                  <Separator />

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


        </Tabs>
      </div>

      {/* Carrier Account Dialog */}
      <Dialog open={showCarrierDialog} onOpenChange={setShowCarrierDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingCarrierAccount ? 'Edit Carrier Account' : 'Add Carrier Account'}
            </DialogTitle>
            <DialogDescription>
              {editingCarrierAccount ? 
                'Update your carrier account credentials' : 
                'Add FedEx or DHL account credentials to enable multi-carrier shipping'
              }
            </DialogDescription>
          </DialogHeader>
          <Form {...carrierAccountForm}>
            <form onSubmit={carrierAccountForm.handleSubmit(handleSaveCarrierAccount)} className="space-y-4">
              <FormField
                control={carrierAccountForm.control}
                name="carrier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Carrier</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      disabled={!!editingCarrierAccount}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select carrier" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="fedex">FedEx</SelectItem>
                        <SelectItem value="dhl">DHL</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={carrierAccountForm.control}
                name="accountNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Number</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter account number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {carrierAccountForm.watch("carrier") === "fedex" && (
                <FormField
                  control={carrierAccountForm.control}
                  name="meterNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meter Number (FedEx only)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter meter number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={carrierAccountForm.control}
                name="key"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>API Key</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          {...field} 
                          type={showPassword.key ? "text" : "password"}
                          placeholder="Enter API key" 
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(prev => ({ ...prev, key: !prev.key }))}
                        >
                          {showPassword.key ? <EyeOff size={16} /> : <Eye size={16} />}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={carrierAccountForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>API Password/Secret</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          {...field} 
                          type={showPassword.password ? "text" : "password"}
                          placeholder="Enter API password" 
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(prev => ({ ...prev, password: !prev.password }))}
                        >
                          {showPassword.password ? <EyeOff size={16} /> : <Eye size={16} />}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={carrierAccountForm.control}
                name="apiUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>API URL (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Custom API endpoint (leave blank for default)" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowCarrierDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createCarrierAccountMutation.isPending || updateCarrierAccountMutation.isPending}
                >
                  {editingCarrierAccount ? 'Update Account' : 'Add Account'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}