import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Truck } from "lucide-react";
import { useLocation } from "wouter";

export default function TrackingSection() {
  const [location, setLocation] = useLocation();
  
  const { data: shipments } = useQuery({
    queryKey: ["/api/shipments"],
  });

  // Utility function to format tracking numbers for display
  const formatTrackingNumber = (trackingNumber: string) => {
    return trackingNumber?.replace(/^GV/g, 'QP') || '';
  };

  const handleViewTracking = (trackingNumber: string) => {
    setLocation(`/tracking?track=${trackingNumber}`);
  };

  const activeShipments = shipments?.filter((s: any) => 
    s.status === "created" || s.status === "in_transit" || s.status === "shipped"
  ).slice(0, 3) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "in_transit":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "created":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
      case "shipped":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400";
      case "delivered":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="text-lg">Active Shipments Tracking</CardTitle>
        <p className="text-muted-foreground">Real-time tracking information</p>
      </CardHeader>

      <CardContent>
        {activeShipments.length === 0 ? (
          <div className="text-center py-12">
            <Truck className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No active shipments</h3>
            <p className="text-muted-foreground">Create some shipments to see tracking information</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeShipments.map((shipment: any) => (
              <div key={shipment.id} className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-medium text-foreground">
                    {formatTrackingNumber(shipment.trackingNumber)}
                  </div>
                  <Badge className={getStatusColor(shipment.status)}>
                    {shipment.status}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground mb-2">
                  Order #{shipment.orderId}
                </div>
                <div className="text-xs text-muted-foreground mb-3">
                  Last update: {new Date(shipment.updatedAt).toLocaleString()}
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="text-xs text-muted-foreground">Label created</div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      shipment.status === "in_transit" || shipment.status === "shipped" ? "bg-green-500" : "bg-muted"
                    }`}></div>
                    <div className={`text-xs ${
                      shipment.status === "in_transit" || shipment.status === "shipped" ? "text-muted-foreground" : "text-muted-foreground/50"
                    }`}>In transit</div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      shipment.status === "delivered" ? "bg-green-500" : "bg-muted"
                    }`}></div>
                    <div className={`text-xs ${
                      shipment.status === "delivered" ? "text-muted-foreground" : "text-muted-foreground/50"
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
