import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Header from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Clock, Package, Truck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";

export default function Tracking() {
  const { toast } = useToast();
  const [location] = useLocation();
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

  // Check for tracking parameter in URL and trigger tracking immediately
  useEffect(() => {
    const searchParams = location.split('?')[1];
    if (searchParams) {
      const urlParams = new URLSearchParams(searchParams);
      const trackParam = urlParams.get('track');
      if (trackParam && trackParam !== trackingNumber) {
        setTrackingNumber(trackParam);
        // Trigger tracking lookup immediately
        trackingMutation.mutate(trackParam);
      }
    }
  }, [location]); // Only depend on location to prevent loops

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

  const getStatusIcon = (pathCode: string) => {
    // Map Quikpik path codes to appropriate icons
    switch (pathCode) {
      case "120": // Parcel data received
        return <Package className="text-blue-600" size={16} />;
      case "315": // Order received  
        return <Clock className="text-amber-600" size={16} />;
      case "310": // Picked up
      case "320": // In transit
        return <Truck className="text-blue-600" size={16} />;
      case "410": // Delivered
        return <Package className="text-emerald-600" size={16} />;
      case "510": // Exception
        return <MapPin className="text-red-600" size={16} />;
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
      
      <div className="p-4 lg:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base lg:text-lg">Track Package</CardTitle>
                <p className="text-sm lg:text-base text-muted-foreground">Enter tracking number to get real-time updates</p>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-3 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
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
                    className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                  >
                    {trackingMutation.isPending ? "Tracking..." : "Track"}
                  </Button>
                </div>

                {trackingData && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div>
                        <h4 className="font-medium text-foreground">Tracking Number</h4>
                        <p className="text-sm text-muted-foreground">{trackingNumber}</p>
                      </div>
                      <Badge className={getStatusColor(trackingData.status || 'unknown')}>
                        {trackingData.status || 'Unknown'}
                      </Badge>
                    </div>

                    {/* Show tracking response based on Quikpik API structure */}
                    {trackingData.code === 0 && trackingData.message ? (
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-center">
                          <Clock className="text-amber-600 mr-2" size={16} />
                          <div>
                            <h4 className="font-medium text-amber-800">Tracking Not Available Yet</h4>
                            <p className="text-sm text-amber-700">{trackingData.message}</p>
                          </div>
                        </div>
                      </div>
                    ) : trackingData.data && trackingData.data[0] && trackingData.data[0].fromDetail ? (
                      <div className="space-y-3">
                        <h4 className="font-medium text-foreground">Tracking History</h4>
                        <div className="space-y-3">
                          {trackingData.data[0].fromDetail.map((event: any, index: number) => (
                            <div key={index} className="flex items-start space-x-3 p-3 border border-border rounded-lg">
                              <div className="mt-1">
                                {getStatusIcon(event.pathCode)}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <h5 className="font-medium text-foreground">{event.pathInfo}</h5>
                                  <span className="text-sm text-muted-foreground">
                                    {new Date(event.pathTime).toLocaleString()}
                                  </span>
                                </div>
                                {event.pathLocation && (
                                  <p className="text-sm text-muted-foreground mt-1 flex items-center">
                                    <MapPin size={12} className="mr-1" />
                                    {event.pathLocation}
                                  </p>
                                )}
                                {event.timezone && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Timezone: {event.timezone}
                                  </p>
                                )}
                                {event.flightNo && (
                                  <p className="text-xs text-muted-foreground">
                                    Flight: {event.flightNo}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 p-3 bg-muted rounded-lg">
                          <h5 className="font-medium text-foreground mb-2">Package Status</h5>
                          <p className="text-sm text-muted-foreground">
                            Latest Update: {trackingData.data[0].fromDetail[0]?.pathInfo || 'No updates available'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Tracking provided by Quikpik • Total events: {trackingData.data[0].fromDetail.length}
                          </p>
                        </div>
                      </div>
                    ) : trackingData.code === 1 && trackingData.data ? (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center">
                          <Package className="text-green-600 mr-2" size={16} />
                          <div>
                            <h4 className="font-medium text-green-800">Package Found</h4>
                            <p className="text-sm text-green-700">
                              Tracking number is valid but detailed tracking events are not yet available.
                            </p>
                            <p className="text-xs text-green-600 mt-1">
                              Tracking Number: {trackingData.data[0]?.trackingNo || trackingNumber}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center">
                          <Package className="text-red-600 mr-2" size={16} />
                          <div>
                            <h4 className="font-medium text-red-800">Tracking Error</h4>
                            <p className="text-sm text-red-700">Unable to retrieve tracking information for this number.</p>
                            <p className="text-xs text-red-600 mt-1">
                              Please verify the tracking number and try again.
                            </p>
                          </div>
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
                <p className="text-muted-foreground">Quick access to your shipments</p>
              </CardHeader>
              <CardContent>
                {!shipments || shipments.length === 0 ? (
                  <div className="text-center py-8">
                    <Truck className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No shipments found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {shipments.slice(0, 5).map((shipment: any) => (
                      <div
                        key={shipment.id}
                        className="p-3 border border-border rounded-lg hover:bg-muted cursor-pointer transition-colors"
                        onClick={() => {
                          setTrackingNumber(shipment.trackingNumber);
                          trackingMutation.mutate(shipment.trackingNumber);
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-foreground text-sm">
                              {shipment.trackingNumber}
                            </p>
                            <p className="text-xs text-muted-foreground">
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