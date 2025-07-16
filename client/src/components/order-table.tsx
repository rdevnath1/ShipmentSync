import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Eye, Trash2, Package, Printer, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import CreateShipmentModal from "./create-shipment-modal";
import CreateOrderModal from "./create-order-modal";
import EditShipmentModal from "./edit-shipment-modal";

interface OrderTableProps {
  orders: any[];
  showShipmentActions?: boolean;
}

export default function OrderTable({ orders, showShipmentActions = false }: OrderTableProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateOrderModal, setShowCreateOrderModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
        return "bg-emerald-100 text-emerald-800";
      case "pending":
        return "bg-amber-100 text-amber-800";
      case "delivered":
        return "bg-emerald-100 text-emerald-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const handleCreateShipment = (order: any) => {
    setSelectedOrder(order);
    setShowCreateModal(true);
  };

  const handleViewOrder = (order: any) => {
    toast({
      title: "Order Details",
      description: `Order #${order.orderNumber} - ${order.customerName}`,
    });
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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Recent Orders</CardTitle>
              <p className="text-slate-600">Orders imported from ShipStation</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                <Input 
                  placeholder="Search orders..." 
                  className="pl-10 pr-4 py-2"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button onClick={() => setShowCreateOrderModal(true)}>
                <Plus className="mr-2" size={16} />
                Manual Order
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {!orders || orders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-slate-400 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No orders yet</h3>
              <p className="text-slate-500">Pull orders from ShipStation to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Destination
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {filteredOrders.map((order: any) => {
                    const shippingAddress = order.shippingAddress as any;
                    return (
                      <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-slate-900">
                            #{order.orderNumber}
                          </div>
                          <div className="text-sm text-slate-500">
                            {order.referenceNumber}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-slate-900">
                            {order.customerName}
                          </div>
                          <div className="text-sm text-slate-500">
                            {order.customerEmail}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-slate-900">
                            {shippingAddress?.city}
                          </div>
                          <div className="text-sm text-slate-500">
                            {shippingAddress?.country}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
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
                                  onClick={() => handleViewOrder(order)}
                                >
                                  <Eye className="mr-1" size={12} />
                                  View
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
                                  onClick={() => handleViewOrder(order)}
                                >
                                  <Eye className="mr-1" size={12} />
                                  View
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <CreateShipmentModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        order={selectedOrder}
      />
      
      <CreateOrderModal
        isOpen={showCreateOrderModal}
        onClose={() => setShowCreateOrderModal(false)}
      />
      
      <EditShipmentModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        shipment={selectedOrder}
      />
    </>
  );
}
