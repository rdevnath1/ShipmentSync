import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Header from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Clock, Package, Truck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Tracking() {
  const { toast } = useToast();
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingData, setTrackingData] = useState<any>(null);

  const { data: shipments } = useQuery({
    queryKey: ["/api/shipments"],
  });

  const trackingMutation = useMutation({
    mutationFn: async (trackingNum: string) => {
      const response = await apiRequest("GET", `/api/tracking/${trackingNum}`);
      return response.json();
    },
    onSuccess: (data) => {
      setTrackingData(data);
      toast({
        title: "Success",
        description: "Tracking information updated",
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

  const handleTrackPackage = () => {
    if (!trackingNumber.trim()) {
      toast({
        title: "Warning",
        description: "Please enter a tracking number",
        variant: "destructive",
      });
      return;
    }
    trackingMutation.mutate(trackingNumber);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return "bg-emerald-100 text-emerald-800";
      case "in_transit":
      case "in transit":
        return "bg-blue-100 text-blue-800";
      case "created":
      case "picked_up":
        return "bg-amber-100 text-amber-800";
      case "exception":
        return "bg-red-100 text-red-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return <Package className="text-emerald-600" size={16} />;
      case "in_transit":
      case "in transit":
        return <Truck className="text-blue-600" size={16} />;
      case "created":
      case "picked_up":
        return <MapPin className="text-amber-600" size={16} />;
      default:
        return <Clock className="text-slate-600" size={16} />;
    }
  };

  return (
    <>
      <Header 
        title="Tracking" 
        description="Track your shipments in real-time"
      />
      
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Track Package</CardTitle>
                <p className="text-slate-600">Enter tracking number to get real-time updates</p>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-3 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                    <Input 
                      placeholder="Enter tracking number..." 
                      className="pl-10 pr-4 py-2"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleTrackPackage()}
                    />
                  </div>
                  <Button
                    onClick={handleTrackPackage}
                    disabled={trackingMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {trackingMutation.isPending ? "Tracking..." : "Track"}
                  </Button>
                </div>

                {trackingData && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-slate-900">Tracking Number</h4>
                        <p className="text-sm text-slate-600">{trackingNumber}</p>
                      </div>
                      <Badge className={getStatusColor(trackingData.status || 'unknown')}>
                        {trackingData.status || 'Unknown'}
                      </Badge>
                    </div>

                    {trackingData.events && trackingData.events.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-medium text-slate-900">Tracking Events</h4>
                        <div className="space-y-3">
                          {trackingData.events.map((event: any, index: number) => (
                            <div key={index} className="flex items-start space-x-3 p-3 border border-slate-200 rounded-lg">
                              <div className="mt-1">
                                {getStatusIcon(event.status)}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <h5 className="font-medium text-slate-900">{event.description}</h5>
                                  <span className="text-sm text-slate-500">
                                    {new Date(event.timestamp).toLocaleString()}
                                  </span>
                                </div>
                                {event.location && (
                                  <p className="text-sm text-slate-600 mt-1">{event.location}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Shipments</CardTitle>
                <p className="text-slate-600">Quick access to your shipments</p>
              </CardHeader>
              <CardContent>
                {!shipments || shipments.length === 0 ? (
                  <div className="text-center py-8">
                    <Truck className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                    <p className="text-sm text-slate-500">No shipments found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {shipments.slice(0, 5).map((shipment: any) => (
                      <div
                        key={shipment.id}
                        className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                        onClick={() => {
                          setTrackingNumber(shipment.trackingNumber);
                          trackingMutation.mutate(shipment.trackingNumber);
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-slate-900 text-sm">
                              {shipment.trackingNumber}
                            </p>
                            <p className="text-xs text-slate-500">
                              Order #{shipment.orderId}
                            </p>
                          </div>
                          <Badge className={getStatusColor(shipment.status)} variant="secondary">
                            {shipment.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}