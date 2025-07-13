import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Header from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Printer, Download, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Labels() {
  const { toast } = useToast();
  const [selectedShipments, setSelectedShipments] = useState<string[]>([]);

  const { data: shipments } = useQuery({
    queryKey: ["/api/shipments"],
  });

  const printLabelsMutation = useMutation({
    mutationFn: async (trackingNumbers: string[]) => {
      const response = await apiRequest("POST", "/api/labels/print", { trackingNumbers });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Labels printed successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to print labels",
        variant: "destructive",
      });
    },
  });

  const handlePrintLabels = () => {
    if (selectedShipments.length === 0) {
      toast({
        title: "Warning",
        description: "Please select at least one shipment to print labels",
        variant: "destructive",
      });
      return;
    }
    printLabelsMutation.mutate(selectedShipments);
  };

  const handleSelectShipment = (trackingNumber: string) => {
    setSelectedShipments(prev => 
      prev.includes(trackingNumber) 
        ? prev.filter(t => t !== trackingNumber)
        : [...prev, trackingNumber]
    );
  };

  const handleSelectAll = () => {
    if (selectedShipments.length === shipments?.length) {
      setSelectedShipments([]);
    } else {
      setSelectedShipments(shipments?.map((s: any) => s.trackingNumber) || []);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-emerald-100 text-emerald-800";
      case "in_transit":
        return "bg-blue-100 text-blue-800";
      case "created":
        return "bg-amber-100 text-amber-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  return (
    <>
      <Header 
        title="Labels" 
        description="Print and manage shipping labels"
      />
      
      <div className="p-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Shipping Labels</CardTitle>
                <p className="text-slate-600">Print labels for your shipments</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                  <Input 
                    placeholder="Search by tracking number..." 
                    className="pl-10 pr-4 py-2"
                  />
                </div>
                <Button
                  onClick={handlePrintLabels}
                  disabled={selectedShipments.length === 0 || printLabelsMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Printer className="mr-2" size={16} />
                  Print Selected ({selectedShipments.length})
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {!shipments || shipments.length === 0 ? (
              <div className="text-center py-12">
                <Tag className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No labels available</h3>
                <p className="text-slate-500">Create some shipments to generate labels</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={selectedShipments.length === shipments.length}
                          onChange={handleSelectAll}
                          className="rounded border-slate-300"
                        />
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Tracking Number
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Order ID
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Label
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
                    {shipments.map((shipment: any) => (
                      <tr key={shipment.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedShipments.includes(shipment.trackingNumber)}
                            onChange={() => handleSelectShipment(shipment.trackingNumber)}
                            className="rounded border-slate-300"
                          />
                        </td>
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
                            Order #{shipment.orderId}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={getStatusColor(shipment.status)}>
                            {shipment.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {shipment.labelPath ? (
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                              <span className="text-sm text-emerald-600">Available</span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                              <span className="text-sm text-red-600">Not Available</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                          {new Date(shipment.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <Button size="sm" variant="outline">
                              <Printer className="mr-1" size={12} />
                              Print
                            </Button>
                            {shipment.labelPath && (
                              <Button size="sm" variant="outline">
                                <Download className="mr-1" size={12} />
                                Download
                              </Button>
                            )}
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
    </>
  );
}