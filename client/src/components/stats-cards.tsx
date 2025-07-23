import { Card, CardContent } from "@/components/ui/card";
import { Package, Truck, CheckCircle, TrendingUp, ArrowUp, ArrowDown } from "lucide-react";

interface StatsCardsProps {
  stats?: {
    totalOrders: number;
    activeShipments: number;
    deliveredToday: number;
    successRate: string;
  };
}

export default function StatsCards({ stats }: StatsCardsProps) {
  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-24"></div>
                  <div className="h-8 bg-muted rounded w-16"></div>
                </div>
                <div className="w-12 h-12 bg-muted rounded-lg"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
              <p className="text-3xl font-bold text-foreground">{stats.totalOrders}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Package className="text-blue-600 dark:text-blue-400" size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <ArrowUp className="text-emerald-500 mr-1" size={12} />
            <span className="text-emerald-500 font-medium">+12.5%</span>
            <span className="text-muted-foreground ml-1">vs last month</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Shipments</p>
              <p className="text-3xl font-bold text-foreground">{stats.activeShipments}</p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
              <Truck className="text-emerald-600 dark:text-emerald-400" size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <ArrowDown className="text-red-500 mr-1" size={12} />
            <span className="text-red-500 font-medium">-3.2%</span>
            <span className="text-muted-foreground ml-1">vs last month</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Delivered Today</p>
              <p className="text-3xl font-bold text-foreground">{stats.deliveredToday}</p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
              <CheckCircle className="text-emerald-600 dark:text-emerald-400" size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <ArrowUp className="text-emerald-500 mr-1" size={12} />
            <span className="text-emerald-500 font-medium">+8.1%</span>
            <span className="text-muted-foreground ml-1">vs yesterday</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
              <p className="text-3xl font-bold text-foreground">{stats.successRate}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <TrendingUp className="text-purple-600 dark:text-purple-400" size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <ArrowUp className="text-emerald-500 mr-1" size={12} />
            <span className="text-emerald-500 font-medium">+2.3%</span>
            <span className="text-muted-foreground ml-1">vs last month</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
