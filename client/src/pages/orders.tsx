import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/header";
import OrderTable from "@/components/order-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Orders() {
  const [filter, setFilter] = useState<"all" | "pending" | "shipped">("all");
  
  const { data: orders } = useQuery({
    queryKey: ["/api/orders"],
  });

  const filteredOrders = orders?.filter(order => {
    if (filter === "pending") return order.status === "pending";
    if (filter === "shipped") return order.status === "shipped";
    return true; // all
  }) || [];

  const pendingCount = orders?.filter(order => order.status === "pending").length || 0;
  const shippedCount = orders?.filter(order => order.status === "shipped").length || 0;

  return (
    <>
      <Header 
        title="Orders" 
        description="Manage all your orders from ShipStation"
      />
      
      <div className="p-4 lg:p-6">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Order Filters</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
        
        <OrderTable orders={filteredOrders} showShipmentActions={filter === "shipped" || filter === "all"} />
      </div>
    </>
  );
}
