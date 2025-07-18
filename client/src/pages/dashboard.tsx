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
      
      // Show detailed feedback about what was synced
      let description = data.message;
      if (data.created > 0 || data.updated > 0) {
        description += ` (${data.created} new, ${data.updated} updated)`;
      }
      
      toast({
        title: "Sync Complete",
        description: description,
      });
      
      refetchOrders();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sync orders from ShipStation",
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
      <div className="p-4 lg:p-6">
        <StatsCards stats={stats} />
        


        <OrderTable orders={orders || []} />
        
        <TrackingSection />
        
        <div className="mt-8">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base lg:text-lg">API Integration Status</CardTitle>
                  <p className="text-sm lg:text-base text-muted-foreground">ShipStation & Jiayou carrier integration</p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 lg:w-10 lg:h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <Download className="text-blue-600 dark:text-blue-400" size={14} />
                  </div>
                  <div className="w-8 h-8 lg:w-10 lg:h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                    <Truck className="text-emerald-600 dark:text-emerald-400" size={14} />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 lg:py-3 px-3 lg:px-4 bg-muted rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      <span className="text-sm font-medium text-foreground">ShipStation API</span>
                    </div>
                    <span className="text-xs text-emerald-600 font-medium">Active</span>
                  </div>
                  <div className="flex items-center justify-between py-2 lg:py-3 px-3 lg:px-4 bg-muted rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm font-medium text-foreground">Last Sync</span>
                    </div>
                    <span className="text-xs text-muted-foreground">2 mins ago</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 lg:py-3 px-3 lg:px-4 bg-muted rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      <span className="text-sm font-medium text-foreground">Jiayou API</span>
                    </div>
                    <span className="text-xs text-emerald-600 font-medium">Online</span>
                  </div>
                  <div className="flex items-center justify-between py-2 lg:py-3 px-3 lg:px-4 bg-muted rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                      <span className="text-sm font-medium text-foreground">Pending Labels</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {orders?.filter((o: any) => o.status === "pending").length || 0} orders
                    </span>
                  </div>
                </div>
              </div>

              <Button 
                onClick={handlePullOrders}
                className="w-full"
              >
                <FolderSync className="mr-2" size={16} />
                Sync Orders from ShipStation
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
