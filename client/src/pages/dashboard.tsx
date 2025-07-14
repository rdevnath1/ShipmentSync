import { useQuery } from "@tanstack/react-query";
import Header from "@/components/header";
import StatsCards from "@/components/stats-cards";
import OrderTable from "@/components/order-table";
import TrackingSection from "@/components/tracking-section";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Download, Truck, Plus, FolderSync } from "lucide-react";

export default function Dashboard() {
  const { toast } = useToast();
  const [location, setLocation] = useLocation();

  const { data: orders, refetch: refetchOrders } = useQuery({
    queryKey: ["/api/orders"],
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const handlePullOrders = async () => {
    try {
      const response = await apiRequest("POST", "/api/orders/pull-shipstation");
      const data = await response.json();
      
      toast({
        title: "Success",
        description: data.message,
      });
      
      refetchOrders();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to pull orders from ShipStation",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Header 
        title="Dashboard" 
        description="Manage your shipments and orders"
      />
      
      <div className="p-6">
        <StatsCards stats={stats} />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">ShipStation Integration</CardTitle>
                  <p className="text-slate-600">Pull orders from ShipStation</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Download className="text-blue-600" size={20} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span className="text-sm font-medium text-slate-700">API Connection</span>
                </div>
                <span className="text-xs text-emerald-600 font-medium">Active</span>
              </div>

              <div className="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-medium text-slate-700">Last Sync</span>
                </div>
                <span className="text-xs text-slate-500">2 mins ago</span>
              </div>

              <Button 
                onClick={handlePullOrders}
                className="w-full"
              >
                <FolderSync className="mr-2" size={16} />
                Pull New Orders
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Jiayou Carrier</CardTitle>
                  <p className="text-slate-600">Create shipments & generate labels</p>
                </div>
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <Truck className="text-emerald-600" size={20} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <span className="text-sm font-medium text-slate-700">API Status</span>
                </div>
                <span className="text-xs text-emerald-600 font-medium">Online</span>
              </div>

              <div className="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                  <span className="text-sm font-medium text-slate-700">Pending Labels</span>
                </div>
                <span className="text-xs text-slate-500">
                  {orders?.filter((o: any) => o.status === "pending").length || 0} orders
                </span>
              </div>

              <Button 
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                onClick={() => setLocation('/orders')}
              >
                <Plus className="mr-2" size={16} />
                Create Shipments
              </Button>
            </CardContent>
          </Card>
        </div>

        <OrderTable orders={orders || []} />
        
        <TrackingSection />
      </div>
    </>
  );
}
