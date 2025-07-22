import { useQuery } from "@tanstack/react-query";
import Header from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Package, DollarSign, Users, Building, AlertTriangle, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function MasterDashboard() {
  const { user } = useAuth();

  // Redirect non-master users
  if (user?.role !== 'master') {
    return (
      <div className="p-6">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">Master admin access required.</p>
        </div>
      </div>
    );
  }

  const { data: allOrdersData } = useQuery({
    queryKey: ["/api/orders/all"],
  });

  const { data: organizationsData } = useQuery({
    queryKey: ["/api/organizations"],
  });

  const orders = allOrdersData?.orders || [];
  const organizations = organizationsData?.organizations || [];

  // Calculate system-wide metrics
  const totalRevenue = orders.reduce((sum: number, order: any) => 
    sum + parseFloat(order.totalAmount || 0), 0);
  
  const totalShippingCost = orders.reduce((sum: number, order: any) => 
    sum + parseFloat(order.shippingCost || 0), 0);
  
  const totalProfit = totalRevenue - totalShippingCost;
  const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue * 100) : 0;

  // Revenue by organization
  const revenueByOrg = organizations.map((org: any) => ({
    name: org.name,
    orders: orders.filter((order: any) => order.organizationId === org.id).length,
    revenue: orders
      .filter((order: any) => order.organizationId === org.id)
      .reduce((sum: number, order: any) => sum + parseFloat(order.totalAmount || 0), 0),
    profit: orders
      .filter((order: any) => order.organizationId === org.id)
      .reduce((sum: number, order: any) => sum + (parseFloat(order.totalAmount || 0) - parseFloat(order.shippingCost || 0)), 0)
  }));

  // Daily revenue trend (last 30 days)
  const dailyRevenue = generateDailyRevenue(orders);

  function generateDailyRevenue(orders: any[]) {
    const dailyData: any = {};
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);
    
    orders
      .filter(order => new Date(order.createdAt) >= last30Days)
      .forEach(order => {
        const date = new Date(order.createdAt).toISOString().split('T')[0];
        if (!dailyData[date]) {
          dailyData[date] = { date, revenue: 0, profit: 0, orders: 0 };
        }
        dailyData[date].revenue += parseFloat(order.totalAmount || 0);
        dailyData[date].profit += parseFloat(order.totalAmount || 0) - parseFloat(order.shippingCost || 0);
        dailyData[date].orders += 1;
      });
    
    return Object.values(dailyData).sort((a: any, b: any) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }

  return (
    <>
      <Header 
        title="Master Dashboard" 
        description="System-wide analytics and organization management"
      />
      <div className="p-4 lg:p-6">
        {/* System-Wide Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-3xl font-bold text-green-600">${totalRevenue.toFixed(2)}</p>
                </div>
                <DollarSign className="text-green-600" size={24} />
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-green-500 font-medium">+{profitMargin.toFixed(1)}%</span>
                <span className="text-muted-foreground ml-1">profit margin</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Net Profit</p>
                  <p className="text-3xl font-bold text-emerald-600">${totalProfit.toFixed(2)}</p>
                </div>
                <TrendingUp className="text-emerald-600" size={24} />
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-emerald-500 font-medium">${totalShippingCost.toFixed(2)}</span>
                <span className="text-muted-foreground ml-1">in costs</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Clients</p>
                  <p className="text-3xl font-bold text-blue-600">{organizations.length}</p>
                </div>
                <Building className="text-blue-600" size={24} />
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-blue-500 font-medium">{orders.length}</span>
                <span className="text-muted-foreground ml-1">total orders</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Order Value</p>
                  <p className="text-3xl font-bold text-purple-600">
                    ${orders.length > 0 ? (totalRevenue / orders.length).toFixed(2) : '0.00'}
                  </p>
                </div>
                <Package className="text-purple-600" size={24} />
              </div>
              <div className="mt-4 flex items-center text-sm">
                <CheckCircle className="text-green-500 mr-1" size={12} />
                <span className="text-green-500 font-medium">System healthy</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue & Profit Trend (30 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: any, name: string) => [
                      `$${value.toFixed(2)}`,
                      name === 'revenue' ? 'Revenue' : 'Profit'
                    ]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    name="revenue"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="profit" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="profit"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Revenue by Organization */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Client Organization</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenueByOrg}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: any, name: string) => [
                      name === 'revenue' ? `$${value.toFixed(2)}` : value,
                      name === 'revenue' ? 'Revenue' : 'Orders'
                    ]}
                  />
                  <Bar dataKey="revenue" fill="#10b981" name="revenue" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Client Performance Table */}
        <Card>
          <CardHeader>
            <CardTitle>Client Organization Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Organization</th>
                    <th className="text-right p-2">Orders</th>
                    <th className="text-right p-2">Revenue</th>
                    <th className="text-right p-2">Profit</th>
                    <th className="text-right p-2">Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {revenueByOrg.map((org: any, index: number) => (
                    <tr key={index} className="border-b">
                      <td className="p-2 font-medium">{org.name}</td>
                      <td className="p-2 text-right">{org.orders}</td>
                      <td className="p-2 text-right text-green-600">${org.revenue.toFixed(2)}</td>
                      <td className="p-2 text-right text-blue-600">${org.profit.toFixed(2)}</td>
                      <td className="p-2 text-right">
                        {org.revenue > 0 ? ((org.profit / org.revenue) * 100).toFixed(1) : '0'}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}