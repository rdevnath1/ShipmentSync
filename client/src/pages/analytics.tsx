import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Package, DollarSign, Users, Calendar, Download, Lightbulb, AlertTriangle, CheckCircle, Target } from "lucide-react";

export default function Analytics() {
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d" | "custom">("30d");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ["/api/analytics", dateRange, startDate, endDate],
  });

  const { data: ordersData } = useQuery({
    queryKey: ["/api/orders"],
  });

  // Calculate analytics from order data
  const orders = ordersData?.orders || [];
  
  // Calculate shipping-focused metrics
  const totalShippingCost = orders.reduce((sum: number, order: any) => 
    sum + parseFloat(order.shippingCost || 0), 0);
  
  const averageShippingCost = orders.length > 0 ? totalShippingCost / orders.length : 0;
  
  const statusDistribution = orders.reduce((acc: any, order: any) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {});

  // Generate chart data focused on shipping
  const shippingByDay = generateDailyShipping(orders);
  const ordersByStatus = Object.entries(statusDistribution).map(([status, count]) => ({
    status,
    count,
    color: getStatusColor(status)
  }));

  function generateDailyShipping(orders: any[]) {
    const dailyData: any = {};
    
    orders.forEach(order => {
      const date = new Date(order.createdAt).toISOString().split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = { date, shippingCost: 0, orders: 0 };
      }
      dailyData[date].shippingCost += parseFloat(order.shippingCost || 0);
      dailyData[date].orders += 1;
    });
    
    return Object.values(dailyData).sort((a: any, b: any) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'shipped': return '#10b981';
      case 'delivered': return '#059669';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  }

  // Generate shipping-focused business insights
  function generateInsights() {
    const insights = [];
    
    // Shipping cost analysis
    if (averageShippingCost > 10) {
      insights.push({
        type: 'warning',
        icon: AlertTriangle,
        title: 'High Shipping Costs',
        description: `Your average shipping cost of $${averageShippingCost.toFixed(2)} per order is above optimal. Consider package optimization or negotiating better carrier rates.`
      });
    } else if (averageShippingCost < 5) {
      insights.push({
        type: 'success',
        icon: CheckCircle,
        title: 'Optimized Shipping Costs',
        description: `Your average shipping cost of $${averageShippingCost.toFixed(2)} per order shows excellent cost control.`
      });
    }
    
    // Order status analysis
    const shippedRate = orders.length > 0 ? (statusDistribution.shipped || 0) / orders.length * 100 : 0;
    if (shippedRate > 90) {
      insights.push({
        type: 'success',
        icon: CheckCircle,
        title: 'High Shipping Efficiency',
        description: `${shippedRate.toFixed(1)}% of your orders are shipped successfully. Your fulfillment process is performing excellently.`
      });
    } else if (shippedRate < 70) {
      insights.push({
        type: 'warning',
        icon: AlertTriangle,
        title: 'Shipping Bottleneck',
        description: `Only ${shippedRate.toFixed(1)}% of orders are shipped. Focus on streamlining your fulfillment process.`
      });
    }
    
    // Package size optimization opportunity
    const ordersWithDimensions = orders.filter((order: any) => order.dimensions);
    if (ordersWithDimensions.length < orders.length * 0.8) {
      insights.push({
        type: 'insight',
        icon: Target,
        title: 'Package Optimization Opportunity',
        description: `Only ${((ordersWithDimensions.length / orders.length) * 100).toFixed(1)}% of orders have dimension data. Adding package dimensions could help optimize shipping costs.`
      });
    }
    
    // Volume trends
    const recentOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      return orderDate > lastWeek;
    }).length;
    
    const previousWeekOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return orderDate > twoWeeksAgo && orderDate <= oneWeekAgo;
    }).length;
    
    if (recentOrders > previousWeekOrders * 1.2) {
      insights.push({
        type: 'success',
        icon: TrendingUp,
        title: 'Growing Order Volume',
        description: `Order volume increased by ${(((recentOrders - previousWeekOrders) / (previousWeekOrders || 1)) * 100).toFixed(1)}% this week. Your business is trending upward!`
      });
    } else if (recentOrders < previousWeekOrders * 0.8 && previousWeekOrders > 0) {
      insights.push({
        type: 'warning',
        icon: AlertTriangle,
        title: 'Declining Order Volume',
        description: `Order volume decreased by ${(((previousWeekOrders - recentOrders) / previousWeekOrders) * 100).toFixed(1)}% this week. Monitor customer acquisition channels.`
      });
    }
    
    // Cost efficiency insight
    const avgShippingCost = orders.length > 0 ? totalShippingCost / orders.length : 0;
    if (avgShippingCost < 5) {
      insights.push({
        type: 'success',
        icon: Package,
        title: 'Cost-Effective Shipping',
        description: `Average shipping cost of $${avgShippingCost.toFixed(2)} per order shows excellent carrier rate negotiation.`
      });
    }
    
    return insights.slice(0, 4); // Limit to 4 most relevant insights
  }

  const businessInsights = generateInsights();

  if (isLoading) {
    return (
      <div>
        <Header title="Analytics" description="Comprehensive business insights and reporting" />
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
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
                  <SelectItem value="custom">Custom range</SelectItem>
                </SelectContent>
              </Select>
              
              {dateRange === "custom" && (
                <>
                  <div>
                    <Label htmlFor="start-date">Start Date</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end-date">End Date</Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </>
              )}
              
              <Button variant="outline">
                <Download className="mr-2" size={16} />
                Export Report
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Key Shipping Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Shipping Costs</p>
                  <p className="text-2xl font-bold">${totalShippingCost.toFixed(2)}</p>
                </div>
                <Package className="text-blue-600" size={24} />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Average Cost/Order</p>
                  <p className="text-2xl font-bold">${averageShippingCost.toFixed(2)}</p>
                </div>
                <TrendingUp className="text-emerald-600" size={24} />
              </div>
            </CardContent>
          </Card>
          
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
                <DollarSign className="text-green-600" size={24} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Shipping Cost Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Shipping Cost Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={shippingByDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: any, name: string) => [
                      name === 'shippingCost' ? `$${value.toFixed(2)}` : value,
                      name === 'shippingCost' ? 'Shipping Cost' : 'Orders'
                    ]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="shippingCost" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="shippingCost"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Orders by Status */}
          <Card>
            <CardHeader>
              <CardTitle>Orders by Status</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={ordersByStatus}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                    label={({ status, count }) => `${status}: ${count}`}
                  >
                    {ordersByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Business Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lightbulb className="mr-2" size={20} />
              Business Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {businessInsights.map((insight, index) => {
                const Icon = insight.icon;
                return (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-l-4 ${
                      insight.type === 'success' 
                        ? 'border-green-500 bg-green-50 dark:bg-green-950/20' 
                        : insight.type === 'warning' 
                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20'
                        : 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <Icon 
                        size={20} 
                        className={`mt-1 ${
                          insight.type === 'success' 
                            ? 'text-green-600' 
                            : insight.type === 'warning' 
                            ? 'text-orange-600'
                            : 'text-blue-600'
                        }`} 
                      />
                      <div className="flex-1">
                        <h4 className="font-medium text-sm mb-1">{insight.title}</h4>
                        <p className="text-sm text-muted-foreground">{insight.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {businessInsights.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Lightbulb size={32} className="mx-auto mb-2 opacity-50" />
                <p>More insights will appear as you process more orders.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Daily Orders Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Order Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={shippingByDay}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="orders" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </>
  );
}