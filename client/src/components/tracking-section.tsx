import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Truck } from "lucide-react";
import { useLocation } from "wouter";

export default function TrackingSection() {
  const [, navigate] = useLocation();
  
  const { data: shipments } = useQuery({
    queryKey: ["/api/shipments"],
  });

  const handleViewTracking = (trackingNumber: string) => {
    navigate(`/tracking?number=${trackingNumber}`);
  };

  const activeShipments = shipments?.filter((s: any) => 
    s.status === "created" || s.status === "in_transit"
  ).slice(0, 3) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "in_transit":
        return "bg-blue-100 text-blue-800";
      case "created":
        return "bg-amber-100 text-amber-800";
      case "delivered":
        return "bg-emerald-100 text-emerald-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="text-lg">Active Shipments Tracking</CardTitle>
        <p className="text-slate-600">Real-time tracking information</p>
      </CardHeader>

      <CardContent>
        {activeShipments.length === 0 ? (
          <div className="text-center py-12">
            <Truck className="mx-auto h-12 w-12 text-slate-400 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No active shipments</h3>
            <p className="text-slate-500">Create some shipments to see tracking information</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeShipments.map((shipment: any) => (
              <div key={shipment.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-medium text-slate-900">
                    {shipment.trackingNumber}
                  </div>
                  <Badge className={getStatusColor(shipment.status)}>
                    {shipment.status}
                  </Badge>
                </div>
                <div className="text-sm text-slate-600 mb-2">
                  Order #{shipment.orderId}
                </div>
                <div className="text-xs text-slate-500 mb-3">
                  Last update: {new Date(shipment.updatedAt).toLocaleString()}
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="text-xs text-slate-600">Label created</div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      shipment.status === "in_transit" ? "bg-green-500" : "bg-gray-300"
                    }`}></div>
                    <div className={`text-xs ${
                      shipment.status === "in_transit" ? "text-slate-600" : "text-slate-400"
                    }`}>In transit</div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      shipment.status === "delivered" ? "bg-green-500" : "bg-gray-300"
                    }`}></div>
                    <div className={`text-xs ${
                      shipment.status === "delivered" ? "text-slate-600" : "text-slate-400"
                    }`}>Delivered</div>
                  </div>
                </div>

                <Button 
                  className="w-full mt-4" 
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewTracking(shipment.trackingNumber)}
                >
                  View Full Tracking
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
