import { useState } from "react";
import RatePreview from "@/components/rate-preview";
import Header from "@/components/header";
import OrderTable from "@/components/order-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOrders, useFilteredOrders } from "@/hooks/use-orders";

export default function Orders() {
  const [filter, setFilter] = useState<"all" | "pending" | "shipped">("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  
  const { data, isLoading } = useOrders();
  const filteredOrders = useFilteredOrders(data?.orders, filter, startDate, endDate);
  
  const pendingCount = data?.pendingCount || 0;
  const shippedCount = data?.shippedCount || 0;
  const totalCount = data?.orders?.length || 0;
  


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
                    {totalCount}
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
            {filteredOrders.length !== totalCount && (
              <div className="pt-2 border-t">
                <div className="flex flex-col sm:flex-row gap-4 text-sm text-muted-foreground">
                  <span>Showing {filteredOrders.length} of {totalCount} orders</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        <OrderTable 
          orders={filteredOrders} 
          showShipmentActions={filter === "shipped" || filter === "all"}
          showBatchActions={true}
        />
      </div>
    </>
  );
}
