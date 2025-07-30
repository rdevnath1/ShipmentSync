import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { Download, FileText, Calendar, TrendingUp, Package, DollarSign, Truck, Filter } from "lucide-react";

export default function Reports() {
  const { toast } = useToast();
  const [reportType, setReportType] = useState("shipments");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [carrierFilter, setCarrierFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Fetch orders data for reports
  const { data: ordersData } = useQuery({
    queryKey: ["/api/orders"],
  });

  // Fetch shipments data for reports
  const { data: shipmentsData } = useQuery({
    queryKey: ["/api/shipments"],
  });

  // Fetch wallet data for financial reports
  const { data: walletData } = useQuery({
    queryKey: ["/api/wallet/transactions"],
  });

  const orders = ordersData?.orders || [];
  const shipments = Array.isArray(shipmentsData) ? shipmentsData : [];
  const transactions = walletData?.transactions || [];

  // Filter data based on date range and filters
  const getFilteredData = () => {
    let filtered = reportType === "shipments" ? shipments : 
                  reportType === "orders" ? orders : transactions;

    if (startDate) {
      filtered = filtered.filter((item: any) => 
        new Date(item.createdAt || item.orderDate) >= new Date(startDate)
      );
    }
    if (endDate) {
      filtered = filtered.filter((item: any) => 
        new Date(item.createdAt || item.orderDate) <= new Date(endDate)
      );
    }
    if (carrierFilter !== "all" && reportType !== "financial") {
      filtered = filtered.filter((item: any) => item.carrier === carrierFilter);
    }
    if (statusFilter !== "all") {
      filtered = filtered.filter((item: any) => item.status === statusFilter);
    }

    return filtered;
  };

  const filteredData = getFilteredData();

  // Generate charts data
  const generateChartData = () => {
    if (reportType === "shipments") {
      const carrierCounts = filteredData.reduce((acc: any, shipment: any) => {
        acc[shipment.carrier || "Unknown"] = (acc[shipment.carrier || "Unknown"] || 0) + 1;
        return acc;
      }, {});
      
      return Object.entries(carrierCounts).map(([carrier, count]) => ({
        name: carrier,
        value: count,
        fill: carrier === "quikpik" ? "#3b82f6" : carrier === "fedex" ? "#8b5cf6" : "#10b981"
      }));
    } else if (reportType === "orders") {
      const dailyOrders = filteredData.reduce((acc: any, order: any) => {
        const date = new Date(order.createdAt || order.orderDate).toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {});
      
      return Object.entries(dailyOrders).map(([date, count]) => ({
        date,
        orders: count
      })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } else {
      const dailySpending = filteredData
        .filter((t: any) => t.type === "debit")
        .reduce((acc: any, transaction: any) => {
          const date = new Date(transaction.createdAt).toISOString().split('T')[0];
          acc[date] = (acc[date] || 0) + Math.abs(transaction.amount);
          return acc;
        }, {});
      
      return Object.entries(dailySpending).map(([date, amount]) => ({
        date,
        amount
      })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }
  };

  const chartData = generateChartData();

  // Calculate summary statistics
  const getSummaryStats = () => {
    if (reportType === "shipments") {
      const totalShipments = filteredData.length;
      const deliveredShipments = filteredData.filter((s: any) => s.status === "delivered").length;
      const deliveryRate = totalShipments > 0 ? ((deliveredShipments / totalShipments) * 100).toFixed(1) : 0;
      const avgCost = filteredData.reduce((sum: number, s: any) => sum + (parseFloat(s.cost) || 0), 0) / totalShipments || 0;
      
      return {
        totalShipments,
        deliveredShipments,
        deliveryRate: `${deliveryRate}%`,
        avgCost: `$${avgCost.toFixed(2)}`
      };
    } else if (reportType === "orders") {
      const totalOrders = filteredData.length;
      const shippedOrders = filteredData.filter((o: any) => o.trackingNumber).length;
      const avgValue = filteredData.reduce((sum: number, o: any) => sum + (parseFloat(o.orderTotal) || 0), 0) / totalOrders || 0;
      const totalValue = filteredData.reduce((sum: number, o: any) => sum + (parseFloat(o.orderTotal) || 0), 0);
      
      return {
        totalOrders,
        shippedOrders,
        avgValue: `$${avgValue.toFixed(2)}`,
        totalValue: `$${totalValue.toFixed(2)}`
      };
    } else {
      const totalTransactions = filteredData.length;
      const credits = filteredData.filter((t: any) => t.type === "credit");
      const debits = filteredData.filter((t: any) => t.type === "debit");
      const totalCredits = credits.reduce((sum: number, t: any) => sum + t.amount, 0);
      const totalDebits = debits.reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0);
      
      return {
        totalTransactions,
        totalCredits: `$${totalCredits.toFixed(2)}`,
        totalDebits: `$${totalDebits.toFixed(2)}`,
        netChange: `$${(totalCredits - totalDebits).toFixed(2)}`
      };
    }
  };

  const summaryStats = getSummaryStats();

  const exportToCSV = () => {
    if (filteredData.length === 0) {
      toast({
        title: "No Data",
        description: "No data available to export",
        variant: "destructive",
      });
      return;
    }

    let csvContent = "";
    let headers: string[] = [];
    
    if (reportType === "shipments") {
      headers = ["ID", "Order Number", "Tracking Number", "Carrier", "Status", "Cost", "Created Date"];
      csvContent = headers.join(",") + "\n";
      filteredData.forEach((shipment: any) => {
        const row = [
          shipment.id,
          shipment.orderNumber || "",
          shipment.trackingNumber || "",
          shipment.carrier || "",
          shipment.status || "",
          shipment.cost || "0",
          new Date(shipment.createdAt).toLocaleDateString()
        ];
        csvContent += row.join(",") + "\n";
      });
    } else if (reportType === "orders") {
      headers = ["Order Number", "Customer", "Status", "Total", "Carrier", "Created Date"];
      csvContent = headers.join(",") + "\n";
      filteredData.forEach((order: any) => {
        const row = [
          order.orderNumber || "",
          order.customerName || "",
          order.trackingNumber ? "Shipped" : "Pending",
          order.orderTotal || "0",
          order.carrier || "",
          new Date(order.createdAt || order.orderDate).toLocaleDateString()
        ];
        csvContent += row.join(",") + "\n";
      });
    } else {
      headers = ["Type", "Amount", "Description", "Balance After", "Date"];
      csvContent = headers.join(",") + "\n";
      filteredData.forEach((transaction: any) => {
        const row = [
          transaction.type || "",
          transaction.amount || "0",
          `"${transaction.description || ""}"`,
          transaction.balanceAfter || "0",
          new Date(transaction.createdAt).toLocaleDateString()
        ];
        csvContent += row.join(",") + "\n";
      });
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Complete",
      description: `${reportType} report exported successfully`,
    });
  };

  const exportToPDF = () => {
    // In a real app, this would generate a PDF report
    // For now, we'll show a toast
    toast({
      title: "PDF Export",
      description: "PDF export feature coming soon",
    });
  };

  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
    setCarrierFilter("all");
    setStatusFilter("all");
  };

  const hasActiveFilters = startDate || endDate || carrierFilter !== "all" || statusFilter !== "all";

  return (
    <>
      <Header 
        title="Reports & Analytics" 
        description="Generate detailed reports and export data"
      />
      
      <div className="p-4 lg:p-6 space-y-6">
        {/* Report Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText size={20} />
              <span>Report Configuration</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Report Type */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="shipments">
                    <div className="flex items-center">
                      <Package className="w-4 h-4 mr-2" />
                      Shipments Report
                    </div>
                  </SelectItem>
                  <SelectItem value="orders">
                    <div className="flex items-center">
                      <FileText className="w-4 h-4 mr-2" />
                      Orders Report
                    </div>
                  </SelectItem>
                  <SelectItem value="financial">
                    <div className="flex items-center">
                      <DollarSign className="w-4 h-4 mr-2" />
                      Financial Report
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Date Range</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start-date" className="text-xs text-muted-foreground">From</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="end-date" className="text-xs text-muted-foreground">To</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Additional Filters */}
            {reportType !== "financial" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Carrier</Label>
                  <Select value={carrierFilter} onValueChange={setCarrierFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Carriers</SelectItem>
                      <SelectItem value="quikpik">Quikpik</SelectItem>
                      <SelectItem value="fedex">FedEx</SelectItem>
                      <SelectItem value="usps">USPS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      {reportType === "shipments" ? (
                        <>
                          <SelectItem value="created">Created</SelectItem>
                          <SelectItem value="shipped">Shipped</SelectItem>
                          <SelectItem value="in_transit">In Transit</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="shipped">Shipped</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 pt-4">
              <Button onClick={exportToCSV} disabled={filteredData.length === 0}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button variant="outline" onClick={exportToPDF} disabled={filteredData.length === 0}>
                <FileText className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
              {hasActiveFilters && (
                <Button variant="ghost" onClick={clearFilters}>
                  <Filter className="w-4 h-4 mr-2" />
                  Clear Filters
                </Button>
              )}
            </div>

            {/* Results Summary */}
            <div className="pt-2 border-t">
              <div className="flex flex-col sm:flex-row gap-4 text-sm text-muted-foreground">
                <span>Showing {filteredData.length} records</span>
                {hasActiveFilters && (
                  <span className="text-blue-600">• Filters active</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(summaryStats).map(([key, value]) => (
            <Card key={key}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground capitalize">
                      {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                    </p>
                    <p className="text-2xl font-bold">{value}</p>
                  </div>
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    {reportType === "shipments" ? (
                      <Package className="text-blue-600 dark:text-blue-400" size={20} />
                    ) : reportType === "orders" ? (
                      <FileText className="text-blue-600 dark:text-blue-400" size={20} />
                    ) : (
                      <DollarSign className="text-blue-600 dark:text-blue-400" size={20} />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts */}
        {chartData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp size={20} />
                <span>
                  {reportType === "shipments" ? "Shipments by Carrier" :
                   reportType === "orders" ? "Daily Orders Trend" :
                   "Daily Spending Trend"}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                {reportType === "shipments" ? (
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                ) : (
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey={reportType === "orders" ? "orders" : "amount"} 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                    />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Data Table Preview */}
        {filteredData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Data Preview</CardTitle>
              <p className="text-sm text-muted-foreground">
                Showing first 10 records. Export for complete data.
              </p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      {reportType === "shipments" ? (
                        <>
                          <th className="text-left p-2">ID</th>
                          <th className="text-left p-2">Order</th>
                          <th className="text-left p-2">Tracking</th>
                          <th className="text-left p-2">Carrier</th>
                          <th className="text-left p-2">Status</th>
                          <th className="text-right p-2">Cost</th>
                        </>
                      ) : reportType === "orders" ? (
                        <>
                          <th className="text-left p-2">Order #</th>
                          <th className="text-left p-2">Customer</th>
                          <th className="text-left p-2">Status</th>
                          <th className="text-right p-2">Total</th>
                          <th className="text-left p-2">Carrier</th>
                        </>
                      ) : (
                        <>
                          <th className="text-left p-2">Type</th>
                          <th className="text-right p-2">Amount</th>
                          <th className="text-left p-2">Description</th>
                          <th className="text-right p-2">Balance</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.slice(0, 10).map((item: any, index: number) => (
                      <tr key={index} className="border-b">
                        {reportType === "shipments" ? (
                          <>
                            <td className="p-2">{item.id}</td>
                            <td className="p-2">{item.orderNumber || "-"}</td>
                            <td className="p-2">{item.trackingNumber || "-"}</td>
                            <td className="p-2">{item.carrier || "-"}</td>
                            <td className="p-2">{item.status || "-"}</td>
                            <td className="p-2 text-right">${(item.cost || 0).toFixed(2)}</td>
                          </>
                        ) : reportType === "orders" ? (
                          <>
                            <td className="p-2">{item.orderNumber || "-"}</td>
                            <td className="p-2">{item.customerName || "-"}</td>
                            <td className="p-2">{item.trackingNumber ? "Shipped" : "Pending"}</td>
                            <td className="p-2 text-right">${(item.orderTotal || 0).toFixed(2)}</td>
                            <td className="p-2">{item.carrier || "-"}</td>
                          </>
                        ) : (
                          <>
                            <td className="p-2 capitalize">{item.type || "-"}</td>
                            <td className="p-2 text-right">
                              {item.type === "credit" ? "+" : "-"}${Math.abs(item.amount || 0).toFixed(2)}
                            </td>
                            <td className="p-2">{item.description || "-"}</td>
                            <td className="p-2 text-right">${(item.balanceAfter || 0).toFixed(2)}</td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {filteredData.length === 0 && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Data Found</h3>
                <p className="text-muted-foreground">
                  No records match your current filters. Try adjusting the date range or filters.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}