import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import { Search, Plus, Eye, Trash2, Package, Printer, Edit, ExternalLink, Bug } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import CreateShipmentModal from "./create-shipment-modal";
import BatchPrintModal from "./batch-print-modal";
import EditShipmentModal from "./edit-shipment-modal";
import EditOrderModal from "./edit-order-modal";
import DebugJiayouModal from "./debug-jiayou-modal";

interface OrderTableProps {
  orders: any[];
  showShipmentActions?: boolean;
  showBatchActions?: boolean;
  hideActions?: boolean;
}

export default function OrderTable({ orders, showShipmentActions = false, showBatchActions = false, hideActions = false }: OrderTableProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBatchPrintModal, setShowBatchPrintModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEditOrderModal, setShowEditOrderModal] = useState(false);
  const [showDebugModal, setShowDebugModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const deleteOrderMutation = useMutation({
    mutationFn: async (orderId: number) => {
      const response = await apiRequest("DELETE", `/api/orders/${orderId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Order deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete order",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
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
  };

  const handleCreateShipment = (order: any) => {
    setSelectedOrder(order);
    setShowCreateModal(true);
  };

  const handleViewEditOrder = (order: any) => {
    setSelectedOrder(order);
    setShowEditOrderModal(true);
  };

  const handleTrackingClick = (order: any) => {
    if (order.trackingNumber) {
      console.log('Tracking click - Order:', order);
      console.log('Tracking number:', order.trackingNumber);
      console.log('Navigating to:', `/tracking?track=${order.trackingNumber}`);
      setLocation(`/tracking?track=${order.trackingNumber}`);
    } else {
      toast({
        title: "No Tracking Available",
        description: "This order hasn't been shipped yet",
        variant: "destructive",
      });
    }
  };

  const handleDebugOrder = (order: any) => {
    setSelectedOrder(order);
    setShowDebugModal(true);
  };

  const handleDeleteOrder = (order: any) => {
    if (window.confirm(`Are you sure you want to delete order #${order.orderNumber}?`)) {
      deleteOrderMutation.mutate(order.id);
    }
  };

  const handleEditShipment = (order: any) => {
    setSelectedOrder(order);
    setShowEditModal(true);
  };



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
          description: `Label for tracking #${data.trackingNumber} opened in new tab`,
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

  const handlePrintLabel = (order: any) => {
    printMutation.mutate(order.id);
  };





  const filteredOrders = orders.filter(order => 
    order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
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
                  onClick={() => setShowBatchPrintModal(true)}
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
          {!orders || orders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No orders yet</h3>
              <p className="text-muted-foreground">Pull orders from ShipStation to get started</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Order ID
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Destination
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Status
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Tracking
                      </th>

                      <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Date
                      </th>
                      {!hideActions && (
                        <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Actions
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-background divide-y divide-border">
                    {filteredOrders.map((order: any) => {
                      const shippingAddress = order.shippingAddress as any;
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
                                onClick={() => handleTrackingClick(order)}
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
                          {!hideActions && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center space-x-2">
                                {order.status === 'pending' ? (
                                  <>
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => handleCreateShipment(order)}
                                    >
                                      <Package className="mr-1" size={12} />
                                      Ship
                                    </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleViewEditOrder(order)}
                                  >
                                    <Edit className="mr-1" size={12} />
                                    Edit
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleDeleteOrder(order)}
                                    disabled={deleteOrderMutation.isPending}
                                  >
                                    <Trash2 className="mr-1" size={12} />
                                    Delete
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleEditShipment(order)}
                                  >
                                    <Edit className="mr-1" size={12} />
                                    Edit
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handlePrintLabel(order)}
                                    disabled={printMutation.isPending}
                                  >
                                    <Printer className="mr-1" size={12} />
                                    {printMutation.isPending ? "Printing..." : "Print"}
                                  </Button>

                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleDebugOrder(order)}
                                    title="Debug Quikpik Sync"
                                  >
                                    <Bug className="mr-1" size={12} />
                                    Debug
                                  </Button>

                                </>
                              )}
                            </div>
                          </td>
                          )}
                      </tr>
                    );
                  })}
                  </tbody>
                </table>
              </div>
              
              {/* Mobile Card View */}
              <div className="lg:hidden space-y-4">
                {filteredOrders.map((order: any) => {
                  const shippingAddress = order.shippingAddress as any;
                  return (
                    <Card key={order.id} className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-sm">#{order.orderNumber}</h3>
                          <p className="text-xs text-muted-foreground">{order.referenceNumber}</p>
                        </div>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <div>
                          <p className="text-sm font-medium">{order.customerName}</p>
                          <p className="text-xs text-muted-foreground">{order.customerEmail}</p>
                        </div>
                        <div>
                          <p className="text-sm">{shippingAddress?.city}</p>
                          <p className="text-xs text-muted-foreground">{shippingAddress?.country}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>

                        {order.trackingNumber && (
                          <div className="mt-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleTrackingClick(order)}
                              className="text-blue-600 hover:text-blue-800 p-0 h-auto font-normal text-xs"
                            >
                              <ExternalLink className="mr-1" size={12} />
                              Track: {order.trackingNumber}
                            </Button>
                          </div>
                        )}
                      </div>
                      
                      {!hideActions && (
                        <div className="flex flex-wrap gap-2">
                          {order.status === 'pending' ? (
                            <>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleCreateShipment(order)}
                                className="flex-1 min-w-0"
                              >
                                <Package className="mr-1" size={16} />
                                Ship
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleViewEditOrder(order)}
                                className="flex-1 min-w-0"
                              >
                                <Edit className="mr-1" size={16} />
                                Edit
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleDeleteOrder(order)}
                                disabled={deleteOrderMutation.isPending}
                                className="flex-1 min-w-0"
                              >
                                <Trash2 className="mr-1" size={16} />
                                Delete
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleEditShipment(order)}
                                className="flex-1 min-w-0"
                              >
                                <Edit className="mr-1" size={16} />
                                Edit
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handlePrintLabel(order)}
                                disabled={printMutation.isPending}
                                className="flex-1 min-w-0"
                              >
                                <Printer className="mr-1" size={16} />
                                {printMutation.isPending ? "Printing..." : "Print"}
                              </Button>

                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleDebugOrder(order)}
                                title="Debug Quikpik Sync"
                                className="flex-1 min-w-0"
                              >
                                <Bug className="mr-1" size={16} />
                                Debug
                              </Button>
                            </>
                          )}
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <CreateShipmentModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        order={selectedOrder}
      />
      
      <BatchPrintModal
        isOpen={showBatchPrintModal}
        onClose={() => setShowBatchPrintModal(false)}
        orders={orders}
      />

      <EditShipmentModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        shipment={selectedOrder}
      />
      
      <EditOrderModal
        isOpen={showEditOrderModal}
        onClose={() => setShowEditOrderModal(false)}
        order={selectedOrder}
      />
      
      {showDebugModal && selectedOrder && (
        <DebugJiayouModal
          orderId={selectedOrder.id}
          trackingNumber={selectedOrder.trackingNumber}
          onClose={() => setShowDebugModal(false)}
        />
      )}
    </>
  );
}
