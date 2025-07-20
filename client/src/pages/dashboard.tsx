import { useQuery } from "@tanstack/react-query";
import Header from "@/components/header";
import StatsCards from "@/components/stats-cards";
import OrderTable from "@/components/order-table";
import { useOrders } from "@/hooks/use-orders";
import { usePullOrdersMutation } from "@/hooks/use-optimized-mutations";
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

  // Use optimized hook that fetches orders with stats in one call
  const { data, refetch: refetchOrders } = useOrders();
  
  // Extract orders and compute stats from the optimized response
  const orders = data?.orders || [];
  const stats = {
    totalOrders: orders.length,
    activeShipments: data?.shippedCount || 0,
    pendingOrders: data?.pendingCount || 0,
    deliveredOrders: orders.filter(o => o.status === 'delivered').length
  };

  // Use optimized mutation hook
  const pullOrdersMutation = usePullOrdersMutation();

  return (
    <>
      <Header 
        title="Dashboard" 
        description="Manage your shipments and orders"
      />
      <div className="p-4 lg:p-6">
        <StatsCards stats={stats} />
        


        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Recent Orders */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderTable orders={orders.slice(0, 5)} hideActions={true} />
            </CardContent>
          </Card>

          {/* API Integration Status */}
          <Card>
            <CardHeader>
              <CardTitle>API Integration Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">ShipStation</span>
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Jiayou</span>
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Rate Calculator API</span>
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <TrackingSection />
        
        <div className="mt-8">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base lg:text-lg">API Integration Status</CardTitle>
                  <p className="text-sm lg:text-base text-muted-foreground">ShipStation & Quikpik carrier integration</p>
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
                      <span className="text-sm font-medium text-foreground">Quikpik API</span>
                    </div>
                    <span className="text-xs text-emerald-600 font-medium">Online</span>
                  </div>
                  <div className="flex items-center justify-between py-2 lg:py-3 px-3 lg:px-4 bg-muted rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                      <span className="text-sm font-medium text-foreground">Pending Labels</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {stats.pendingOrders} orders
                    </span>
                  </div>
                </div>
              </div>

              <Button 
                onClick={() => pullOrdersMutation.mutate()}
                disabled={pullOrdersMutation.isPending}
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
