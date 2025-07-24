import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Truck, Package, Shield } from 'lucide-react';

interface CarrierAccount {
  id?: number;
  organizationId: number;
  carrier: string;
  accountNumber?: string;
  clientId?: string;
  clientSecret?: string;
  apiUrl?: string;
  userId?: string;
  enabled: boolean;
}

export default function CarrierSettings() {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['/api/carrier-accounts'],
  });

  const saveAccountMutation = useMutation({
    mutationFn: async (account: CarrierAccount) => {
      const method = account.id ? 'PUT' : 'POST';
      const url = account.id ? `/api/carrier-accounts/${account.id}` : '/api/carrier-accounts';
      return await apiRequest(url, {
        method,
        body: JSON.stringify(account),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/carrier-accounts'] });
      toast({
        title: 'Success',
        description: 'Carrier settings saved successfully',
      });
      setSaving(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save carrier settings',
        variant: 'destructive',
      });
      setSaving(false);
    },
  });

  const getAccountByCarrier = (carrier: string): CarrierAccount => {
    const existing = accounts.find((acc: CarrierAccount) => acc.carrier === carrier);
    return existing || {
      organizationId: 0, // Will be set by backend
      carrier,
      enabled: false,
    };
  };

  const handleSave = async (carrier: string, formData: FormData) => {
    setSaving(true);
    const existing = getAccountByCarrier(carrier);
    
    const account: CarrierAccount = {
      ...existing,
      carrier,
      enabled: formData.get(`${carrier}_enabled`) === 'on',
    };

    // Add carrier-specific fields
    if (carrier === 'fedex') {
      account.accountNumber = formData.get('fedex_account_number') as string;
      account.clientId = formData.get('fedex_client_id') as string;
      account.clientSecret = formData.get('fedex_client_secret') as string;
      account.apiUrl = formData.get('fedex_api_url') as string;
    } else if (carrier === 'usps') {
      account.userId = formData.get('usps_user_id') as string;
    }

    saveAccountMutation.mutate(account);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Truck className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Carrier Settings</h1>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center space-x-2 mb-6">
        <Truck className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Carrier Settings</h1>
      </div>
      
      <p className="text-gray-600 mb-6">
        Configure your carrier API credentials to get real-time shipping rates in the batch comparison tool.
      </p>

      <Tabs defaultValue="fedex" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="fedex" className="flex items-center space-x-2">
            <Package className="h-4 w-4" />
            <span>FedEx</span>
          </TabsTrigger>
          <TabsTrigger value="usps" className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>USPS</span>
          </TabsTrigger>
          <TabsTrigger value="ups" className="flex items-center space-x-2">
            <Truck className="h-4 w-4" />
            <span>UPS</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="fedex">
          <Card>
            <CardHeader>
              <CardTitle>FedEx API Settings</CardTitle>
              <CardDescription>
                Configure your FedEx Developer Portal credentials to get real-time FedEx rates.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => {
                e.preventDefault();
                handleSave('fedex', new FormData(e.currentTarget));
              }}>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="fedex_enabled">Enable FedEx Integration</Label>
                    <Switch
                      id="fedex_enabled"
                      name="fedex_enabled"
                      defaultChecked={getAccountByCarrier('fedex').enabled}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fedex_account_number">Account Number</Label>
                      <Input
                        id="fedex_account_number"
                        name="fedex_account_number"
                        placeholder="9-digit FedEx account number"
                        defaultValue={getAccountByCarrier('fedex').accountNumber || ''}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="fedex_client_id">Client ID</Label>
                      <Input
                        id="fedex_client_id"
                        name="fedex_client_id"
                        placeholder="From FedEx Developer Portal"
                        defaultValue={getAccountByCarrier('fedex').clientId || ''}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="fedex_client_secret">Client Secret</Label>
                      <Input
                        id="fedex_client_secret"
                        name="fedex_client_secret"
                        type="password"
                        placeholder="From FedEx Developer Portal"
                        defaultValue={getAccountByCarrier('fedex').clientSecret || ''}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="fedex_api_url">API Environment</Label>
                      <select
                        id="fedex_api_url"
                        name="fedex_api_url"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        defaultValue={getAccountByCarrier('fedex').apiUrl || 'https://apis-sandbox.fedex.com'}
                      >
                        <option value="https://apis-sandbox.fedex.com">Sandbox (Testing)</option>
                        <option value="https://apis.fedex.com">Production</option>
                      </select>
                    </div>
                  </div>
                  
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Saving...' : 'Save FedEx Settings'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usps">
          <Card>
            <CardHeader>
              <CardTitle>USPS API Settings</CardTitle>
              <CardDescription>
                Configure your USPS Web Tools credentials to get real-time USPS rates.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => {
                e.preventDefault();
                handleSave('usps', new FormData(e.currentTarget));
              }}>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="usps_enabled">Enable USPS Integration</Label>
                    <Switch
                      id="usps_enabled"
                      name="usps_enabled"
                      defaultChecked={getAccountByCarrier('usps').enabled}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="usps_user_id">USPS User ID</Label>
                    <Input
                      id="usps_user_id"
                      name="usps_user_id"
                      placeholder="From USPS Web Tools registration"
                      defaultValue={getAccountByCarrier('usps').userId || ''}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Register at <a href="https://registration.shippingapis.com/" target="_blank" className="text-blue-600 hover:underline">registration.shippingapis.com</a>
                    </p>
                  </div>
                  
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Saving...' : 'Save USPS Settings'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ups">
          <Card>
            <CardHeader>
              <CardTitle>UPS API Settings</CardTitle>
              <CardDescription>
                UPS integration coming soon. Configure UPS Developer Kit credentials.
              </CardDescription>
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
    </div>
  );
}