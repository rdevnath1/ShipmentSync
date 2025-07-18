import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/header";
import OrderTable from "@/components/order-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarIcon } from "lucide-react";

export default function Orders() {
  const [filter, setFilter] = useState<"all" | "pending" | "shipped">("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  
  const { data: orders } = useQuery({
    queryKey: ["/api/orders"],
  });

  const filteredOrders = orders?.filter(order => {
    // Status filter
    let matchesStatus = true;
    if (filter === "pending") matchesStatus = order.status === "pending";
    if (filter === "shipped") matchesStatus = order.status === "shipped";
    
    // Date range filter
    let matchesDateRange = true;
    if (startDate || endDate) {
      const orderDate = new Date(order.createdAt);
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        matchesDateRange = matchesDateRange && orderDate >= start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        matchesDateRange = matchesDateRange && orderDate <= end;
      }
    }
    
    return matchesStatus && matchesDateRange;
  }) || [];

  const pendingCount = orders?.filter(order => order.status === "pending").length || 0;
  const shippedCount = orders?.filter(order => order.status === "shipped").length || 0;
  
  // Calculate total cost of filtered orders
  const totalCost = filteredOrders
    .filter(order => order.shippingCost)
    .reduce((sum, order) => sum + parseFloat(order.shippingCost || "0"), 0);

  const clearDateFilters = () => {
    setStartDate("");
    setEndDate("");
  };

  return (
    <>
      <Header 
        title="Orders" 
        description="Manage orders imported from ShipStation"
      />
      
      <div className="p-4 lg:p-6">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Order Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Status Filters */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Status</Label>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                <Button
                  variant={filter === "all" ? "default" : "outline"}
                  onClick={() => setFilter("all")}
                  className="w-full sm:w-auto"
                >
                  All Orders
                  <Badge variant="secondary" className="ml-2">
                    {orders?.length || 0}
                  </Badge>
                </Button>
                <Button
                  variant={filter === "pending" ? "default" : "outline"}
                  onClick={() => setFilter("pending")}
                  className="w-full sm:w-auto"
                >
                  Pending
                  <Badge variant="secondary" className="ml-2">
                    {pendingCount}
                  </Badge>
                </Button>
                <Button
                  variant={filter === "shipped" ? "default" : "outline"}
                  onClick={() => setFilter("shipped")}
                  className="w-full sm:w-auto"
                >
                  Shipped
                  <Badge variant="secondary" className="ml-2">
                    {shippedCount}
                  </Badge>
                </Button>
              </div>
            </div>

            {/* Date Range Filters */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Date Range</Label>
              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-1">
                  <Label htmlFor="start-date" className="text-xs text-muted-foreground">From</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="end-date" className="text-xs text-muted-foreground">To</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <Button 
                  variant="outline" 
                  onClick={clearDateFilters}
                  className="w-full sm:w-auto"
                  disabled={!startDate && !endDate}
                >
                  Clear Dates
                </Button>
              </div>
            </div>

            {/* Results Summary */}
            {filteredOrders.length !== orders?.length && (
              <div className="pt-2 border-t">
                <div className="flex flex-col sm:flex-row gap-4 text-sm text-muted-foreground">
                  <span>Showing {filteredOrders.length} of {orders?.length || 0} orders</span>
                  {totalCost > 0 && (
                    <span className="font-medium">
                      Total Shipping Cost: <span className="text-green-600">${totalCost.toFixed(2)}</span>
                    </span>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        <OrderTable orders={filteredOrders} showShipmentActions={filter === "shipped" || filter === "all"} />
      </div>
    </>
  );
}
