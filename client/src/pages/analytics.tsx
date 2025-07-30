import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/header";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Package, DollarSign, Users, Calendar, Download, Lightbulb, Award } from "lucide-react";

export default function Analytics() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d" | "custom">("30d");

  const { data: ordersData } = useQuery({
    queryKey: ["/api/orders"],
  });

  const { data: rateComparisonData } = useQuery({
    queryKey: ["/api/rate-comparisons", dateRange],
  });

  // Calculate analytics from order data
  const orders = ordersData?.orders || [];
  const rateComparisons = rateComparisonData?.comparisons || [];
  
  // Role-based metrics calculation
  const isMasterUser = user?.role === 'master';
  
  const totalShippingCost = orders.reduce((sum: number, order: any) => 
    sum + parseFloat(order.shippingCost || 0), 0);
  
  const averageShippingCost = orders.length > 0 ? totalShippingCost / orders.length : 0;
  
  // Rate comparison analytics
  const totalSavings = rateComparisons.reduce((sum: number, comparison: any) => 
    sum + parseFloat(comparison.savings || 0), 0);
  
  const carrierWins = rateComparisons.reduce((acc: any, comparison: any) => {
    acc[comparison.winningCarrier] = (acc[comparison.winningCarrier] || 0) + 1;
    return acc;
  }, {});

  const quikpikWinRate = rateComparisons.length > 0 
    ? ((carrierWins.quikpik || 0) / rateComparisons.length) * 100 
    : 0;

  const statusDistribution = orders.reduce((acc: any, order: any) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <Header title="Analytics" description="Comprehensive business insights and reporting" />
      
      <div className="p-6 space-y-6">
        {/* Date Range Selector */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2" size={20} />
              Date Range
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <Select value={dateRange} onValueChange={(value: any) => setDateRange(value)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline">
                <Download className="mr-2" size={16} />
                Export Report
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                  <p className="text-2xl font-bold">{orders.length}</p>
                </div>
                <Users className="text-purple-600" size={24} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Shipped Orders</p>
                  <p className="text-2xl font-bold">{statusDistribution.shipped || 0}</p>
                </div>
                <Package className="text-green-600" size={24} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Shipping Cost</p>
                  <p className="text-2xl font-bold">${totalShippingCost.toFixed(2)}</p>
                </div>
                <DollarSign className="text-blue-600" size={24} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Cost/Order</p>
                  <p className="text-2xl font-bold">${averageShippingCost.toFixed(2)}</p>
                </div>
                <TrendingUp className="text-emerald-600" size={24} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Rate Shopping Performance Metrics */}
        {rateComparisons.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="mr-2" size={20} />
                Rate Shopping Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{quikpikWinRate.toFixed(1)}%</div>
                  <div className="text-sm text-muted-foreground">Quikpik Win Rate</div>
                </div>
                
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">${totalSavings.toFixed(2)}</div>
                  <div className="text-sm text-muted-foreground">Total Savings</div>
                </div>
                
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">${(totalSavings / Math.max(rateComparisons.length, 1)).toFixed(2)}</div>
                  <div className="text-sm text-muted-foreground">Avg Savings/Order</div>
                </div>
                
                <div className="text-center p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{rateComparisons.length}</div>
                  <div className="text-sm text-muted-foreground">Rate Comparisons</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Business Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lightbulb className="mr-2" size={20} />
              Business Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <Lightbulb size={32} className="mx-auto mb-2 opacity-50" />
              <p>Business insights will appear as you process more orders.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}