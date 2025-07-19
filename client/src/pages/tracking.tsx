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
        console.log('URL tracking param detected:', trackParam);
        setTrackingNumber(trackParam);
        // Small delay to ensure state is updated
        setTimeout(() => {
          console.log('Triggering tracking lookup for:', trackParam);
          trackingMutation.mutate(trackParam);
        }, 100);
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

  const cleanLocationText = (text: string) => {
    // Replace UNI with Quikpik in tracking location text
    return text?.replace(/UNI\b/gi, 'Quikpik') || '';
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
                      disabled={trackingMutation.isPending}
                    />
                  </div>
                  <Button
                    onClick={handleTrackPackage}
                    disabled={trackingMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                  >
                    {trackingMutation.isPending ? (
                      <>
                        <Clock className="mr-2 animate-spin" size={16} />
                        Tracking...
                      </>
                    ) : (
                      "Track Package"
                    )}
                  </Button>
                </div>

                {trackingMutation.isPending && !trackingData && (
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center">
                      <Clock className="text-blue-600 mr-2 animate-spin" size={16} />
                      <div>
                        <h4 className="font-medium text-blue-800">Fetching Tracking Information</h4>
                        <p className="text-sm text-blue-700">Please wait while we retrieve the latest tracking data...</p>
                      </div>
                    </div>
                  </div>
                )}

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
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-foreground">Timeline History</h4>
                          <span className="text-xs text-muted-foreground">
                            {trackingData.data[0].fromDetail.length} events
                          </span>
                        </div>
                        
                        {/* Timeline Container */}
                        <div className="relative">
                          {/* Timeline Line */}
                          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border"></div>
                          
                          <div className="space-y-6">
                            {/* Sort events by pathTime (most recent first) */}
                            {trackingData.data[0].fromDetail
                              .sort((a: any, b: any) => new Date(b.pathTime).getTime() - new Date(a.pathTime).getTime())
                              .map((event: any, index: number) => (
                              <div key={index} className="relative flex items-start space-x-4">
                                {/* Timeline Dot */}
                                <div className="relative z-10 flex items-center justify-center w-12 h-12 bg-background border-2 border-primary rounded-full shadow-sm">
                                  {getStatusIcon(event.pathCode)}
                                </div>
                                
                                {/* Event Content */}
                                <div className="flex-1 min-w-0 pb-6">
                                  <div className="bg-card border border-border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                                    {/* Event Header */}
                                    <div className="flex items-start justify-between mb-2">
                                      <h5 className="font-semibold text-foreground text-sm">
                                        {event.pathInfo}
                                      </h5>
                                      <div className="text-right">
                                        <div className="text-sm font-medium text-foreground">
                                          {new Date(event.pathTime).toLocaleDateString()}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                          {new Date(event.pathTime).toLocaleTimeString()}
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {/* Event Details */}
                                    <div className="space-y-1">
                                      {event.pathLocation && (
                                        <div className="flex items-center text-xs text-muted-foreground">
                                          <MapPin size={12} className="mr-1.5 text-blue-500" />
                                          <span>{cleanLocationText(event.pathLocation)}</span>
                                        </div>
                                      )}
                                      <div className="flex items-center justify-between text-xs">
                                        <div className="flex items-center text-muted-foreground">
                                          <Clock size={12} className="mr-1.5 text-amber-500" />
                                          <span>{event.timezone || 'UTC'}</span>
                                        </div>
                                        {event.pathCode && (
                                          <div className="text-xs text-muted-foreground">
                                            Code: {event.pathCode}
                                          </div>
                                        )}
                                      </div>
                                      {event.flightNo && (
                                        <div className="flex items-center text-xs text-muted-foreground">
                                          <Truck size={12} className="mr-1.5 text-green-500" />
                                          <span>Flight: {event.flightNo}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {/* Summary Footer */}
                        <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-dashed border-muted-foreground/20">
                          <div className="flex items-center justify-between">
                            <div>
                              <h5 className="font-medium text-foreground text-sm">Current Status</h5>
                              <p className="text-xs text-muted-foreground mt-1">
                                {trackingData.data[0].fromDetail
                                  .sort((a: any, b: any) => new Date(b.pathTime).getTime() - new Date(a.pathTime).getTime())[0]?.pathInfo || 'No recent updates'}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-xs text-muted-foreground">Tracking by</div>
                              <div className="font-medium text-sm">Quikpik</div>
                            </div>
                          </div>
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