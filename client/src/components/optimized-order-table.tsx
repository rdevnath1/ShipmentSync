import { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import CreateShipmentModal from "./create-shipment-modal";
import BatchPrintModal from "./batch-print-modal";
import EditShipmentModal from "./edit-shipment-modal";
import EditOrderModal from "./edit-order-modal";


interface OrderTableProps {
  orders: any[];
  showShipmentActions?: boolean;
  showBatchActions?: boolean;
}

import React from "react";

// Memoized row component to prevent unnecessary re-renders
const OrderRow = React.memo(({ order, onAction }: { order: any; onAction: (type: string, order: any) => void }) => {
  const shippingAddress = order.shippingAddress as any;
  
  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case "shipped":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400";
      case "pending":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
      case "delivered":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400";
      default:
        return "bg-muted text-muted-foreground";
    }
  }, []);

  return (
    <tr key={order.id} className="hover:bg-muted transition-colors">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-foreground">
          #{order.orderNumber}
        </div>
        <div className="text-sm text-muted-foreground">
          {order.referenceNumber}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-foreground">
          {order.customerName}
        </div>
        <div className="text-sm text-muted-foreground">
          {order.customerEmail}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-foreground">
          {shippingAddress?.city}
        </div>
        <div className="text-sm text-muted-foreground">
          {shippingAddress?.country}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <Badge className={getStatusColor(order.status)}>
          {order.status}
        </Badge>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {order.trackingNumber ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAction('tracking', order)}
            className="text-blue-600 hover:text-blue-800 p-0 h-auto font-normal"
          >
            <ExternalLink className="mr-1" size={12} />
            {order.trackingNumber}
          </Button>
        ) : (
          <span className="text-sm text-muted-foreground">No tracking</span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
        {new Date(order.createdAt).toLocaleDateString()}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <div className="flex items-center space-x-2">
          {order.status === 'pending' ? (
            <>
              <Button size="sm" variant="outline" onClick={() => onAction('ship', order)}>
                <Package className="mr-1" size={12} />
                Ship
              </Button>
              <Button size="sm" variant="outline" onClick={() => onAction('edit', order)}>
                <Edit className="mr-1" size={12} />
                Edit
              </Button>
              <Button size="sm" variant="outline" onClick={() => onAction('delete', order)}>
                <Trash2 className="mr-1" size={12} />
                Delete
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="outline" onClick={() => onAction('editShipment', order)}>
                <Edit className="mr-1" size={12} />
                Edit
              </Button>
              <Button size="sm" variant="outline" onClick={() => onAction('print', order)}>
                <Printer className="mr-1" size={12} />
                Print
              </Button>
              <Button size="sm" variant="outline" onClick={() => onAction('debug', order)}>
                Debug
              </Button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
});

export default function OptimizedOrderTable({ orders, showShipmentActions = false, showBatchActions = false }: OrderTableProps) {
  const [modals, setModals] = useState({
    create: false,
    batchPrint: false,
    edit: false,
    editOrder: false,
    debug: false,
  });
  
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // Memoized filtered orders to prevent recalculation on every render
  const filteredOrders = useMemo(() => {
    if (!searchTerm) return orders;
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    return orders.filter(order => 
      order.orderNumber.toLowerCase().includes(lowerSearchTerm) ||
      order.customerName.toLowerCase().includes(lowerSearchTerm) ||
      order.customerEmail?.toLowerCase().includes(lowerSearchTerm) ||
      order.trackingNumber?.toLowerCase().includes(lowerSearchTerm)
    );
  }, [orders, searchTerm]);

  // Optimized mutations with proper error handling
  const deleteOrderMutation = useMutation({
    mutationFn: async (orderId: number) => {
      const response = await apiRequest("DELETE", `/api/orders/${orderId}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete order');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Order deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const printMutation = useMutation({
    mutationFn: async (orderId: number) => {
      const response = await apiRequest("POST", `/api/shipments/${orderId}/print`);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.labelPath) {
        window.open(data.labelPath, '_blank');
        toast({
          title: "Label Opened",
          description: `Label for tracking #${data.trackingNumber} opened`,
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Print Error",
        description: error.message || "Failed to print label",
        variant: "destructive",
      });
    },
  });

  // Memoized action handler to prevent unnecessary re-renders
  const handleAction = useCallback((type: string, order: any) => {
    setSelectedOrder(order);
    
    switch (type) {
      case 'ship':
        setModals(prev => ({ ...prev, create: true }));
        break;
      case 'edit':
        setModals(prev => ({ ...prev, editOrder: true }));
        break;
      case 'editShipment':
        setModals(prev => ({ ...prev, edit: true }));
        break;
      case 'print':
        printMutation.mutate(order.id);
        break;
      case 'debug':
        setModals(prev => ({ ...prev, debug: true }));
        break;
      case 'delete':
        if (window.confirm(`Are you sure you want to delete order #${order.orderNumber}?`)) {
          deleteOrderMutation.mutate(order.id);
        }
        break;
      case 'tracking':
        if (order.trackingNumber) {
          setLocation(`/tracking?track=${order.trackingNumber}`);
        }
        break;
    }
  }, [deleteOrderMutation, printMutation, setLocation]);

  const closeModal = useCallback((modalName: keyof typeof modals) => {
    setModals(prev => ({ ...prev, [modalName]: false }));
    setSelectedOrder(null);
  }, []);

  if (!orders || orders.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No orders yet</h3>
          <p className="text-muted-foreground">Pull orders from ShipStation to get started</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div>
              <CardTitle className="text-lg">Recent Orders</CardTitle>
              <p className="text-muted-foreground">Orders imported from ShipStation</p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                <Input 
                  placeholder="Search orders..." 
                  className="pl-10 pr-4 py-2 w-full sm:w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              {showBatchActions && (
                <Button
                  onClick={() => setModals(prev => ({ ...prev, batchPrint: true }))}
                  disabled={!orders.some(order => order.status === 'shipped' && order.trackingNumber)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Printer className="mr-2" size={16} />
                  Batch Print Labels
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Order ID</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Customer</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Destination</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Tracking</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-background divide-y divide-border">
                {filteredOrders.map((order) => (
                  <OrderRow key={order.id} order={order} onAction={handleAction} />
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <CreateShipmentModal
        isOpen={modals.create}
        onClose={() => closeModal('create')}
        order={selectedOrder}
      />
      
      <BatchPrintModal
        isOpen={modals.batchPrint}
        onClose={() => closeModal('batchPrint')}
        orders={orders}
      />

      <EditShipmentModal
        isOpen={modals.edit}
        onClose={() => closeModal('edit')}
        shipment={selectedOrder}
      />
      
      <EditOrderModal
        isOpen={modals.editOrder}
        onClose={() => closeModal('editOrder')}
        order={selectedOrder}
      />
      
      {modals.debug && selectedOrder && (
          orderId={selectedOrder.id}
          trackingNumber={selectedOrder.trackingNumber}
          onClose={() => closeModal('debug')}
        />
      )}
    </>
  );
}