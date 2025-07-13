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
import { Settings, Key, Bell, Globe, Shield } from "lucide-react";

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

export default function SettingsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("api");

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
            <TabsTrigger value="notifications" className="flex items-center space-x-2">
              <Bell size={16} />
              <span>Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="general" className="flex items-center space-x-2">
              <Settings size={16} />
              <span>General</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center space-x-2">
              <Shield size={16} />
              <span>Security</span>
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