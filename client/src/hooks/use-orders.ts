import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

interface OrdersData {
  orders: any[];
  pendingCount: number;
  shippedCount: number;
}

export function useOrders() {
  return useQuery<OrdersData>({
    queryKey: ["/api/orders"],
    staleTime: 30000, // Cache for 30 seconds
  });
}

export function useFilteredOrders(
  orders: any[] | undefined, 
  filter: "all" | "pending" | "shipped",
  startDate: string,
  endDate: string
) {
  return useMemo(() => {
    if (!orders) return [];
    
    return orders.filter(order => {
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
    });
  }, [orders, filter, startDate, endDate]);
}