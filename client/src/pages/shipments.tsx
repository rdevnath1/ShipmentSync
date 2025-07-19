import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Header from "@/components/header";
import EditShipmentModal from "@/components/edit-shipment-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Eye, Printer, Package, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Shipments() {
  const [searchTerm, setSearchTerm] = useState("");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const { toast } = useToast();
  
  const { data: shipments } = useQuery({
    queryKey: ["/api/shipments"],
  });

  const trackingMutation = useMutation({
    mutationFn: async (trackingNumber: string) => {
      const response = await apiRequest("GET", `/api/tracking/${trackingNumber}`);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Tracking Information",
        description: `Status: ${data.status || 'Unknown'}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch tracking information",
        variant: "destructive",
      });
    },
  });

  const handleTrackShipment = (trackingNumber: string) => {
    trackingMutation.mutate(trackingNumber);
  };

  const printMutation = useMutation({
    mutationFn: async (shipmentId: number) => {
      const response = await apiRequest("POST", `/api/shipments/${shipmentId}/print`);
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

  const handlePrintLabel = (shipment: any) => {
    printMutation.mutate(shipment.id);
  };

  const handleEditShipment = (shipment: any) => {
    setSelectedShipment(shipment);
    setEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setSelectedShipment(null);
  };

  const filteredShipments = shipments?.filter(shipment => 
    shipment.trackingNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shipment.id.toString().includes(searchTerm.toLowerCase()) ||
    shipment.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-emerald-100 text-emerald-800";
      case "in_transit":
        return "bg-blue-100 text-blue-800";
      case "shipped":
        return "bg-emerald-100 text-emerald-800";
      case "created":
        return "bg-amber-100 text-amber-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  return (
    <>
      <Header 
        title="Shipments" 
        description="Track and manage your shipments"
      />
      
      <div className="p-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">All Shipments</CardTitle>
                <p className="text-slate-600">Shipments created with Quikpik</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                  <Input 
                    placeholder="Search shipments..." 
                    className="pl-10 pr-4 py-2"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {!shipments || shipments.length === 0 ? (
              <div className="text-center py-12">
                <Package className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No shipments yet</h3>
                <p className="text-slate-500">Create your first shipment from the dashboard</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Tracking Number
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Order Info
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Weight
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Service
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {filteredShipments.map((shipment: any) => (
                      <tr key={shipment.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-slate-900">
                            {shipment.trackingNumber}
                          </div>
                          <div className="text-sm text-slate-500">
                            {shipment.markNo}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-slate-900">
                            Order #{shipment.orderNumber}
                          </div>
                          <div className="text-sm text-slate-500">
                            {shipment.customerName}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={getStatusColor(shipment.status)}>
                            {shipment.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          {shipment.weight} kg
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          {shipment.serviceType}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          {new Date(shipment.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleEditShipment(shipment)}
                            >
                              <Edit className="mr-1" size={12} />
                              Edit
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleTrackShipment(shipment.trackingNumber)}
                              disabled={trackingMutation.isPending}
                            >
                              <Eye className="mr-1" size={12} />
                              Track
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handlePrintLabel(shipment)}
                              disabled={printMutation.isPending}
                            >
                              <Printer className="mr-1" size={12} />
                              {printMutation.isPending ? "Printing..." : "Print"}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <EditShipmentModal 
        isOpen={editModalOpen}
        onClose={handleCloseEditModal}
        shipment={selectedShipment}
      />
    </>
  );
}
