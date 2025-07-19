import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface DebugJiayouModalProps {
  orderId: number;
  trackingNumber?: string;
  onClose: () => void;
}

export default function DebugJiayouModal({ orderId, trackingNumber, onClose }: DebugJiayouModalProps) {
  const [debugResult, setDebugResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleDebug = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest("GET", `/api/debug/jiayou/${orderId}`);
      const result = await response.json();
      setDebugResult(result);
      
      toast({
        title: "Debug Complete",
        description: result.success ? "Order verified successfully" : "Issues found with order",
        variant: result.success ? "default" : "destructive",
      });
    } catch (error) {
      toast({
        title: "Debug Failed",
        description: "Failed to debug order",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Debug Jiayou Order #{orderId}</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ×
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Button 
              onClick={handleDebug} 
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? "Debugging..." : "Debug Order"}
              <AlertCircle size={16} />
            </Button>
            {trackingNumber && (
              <Badge variant="outline" className="flex items-center gap-1">
                <ExternalLink size={12} />
                {trackingNumber}
              </Badge>
            )}
          </div>

          {debugResult && (
            <div className="space-y-4">
              <div className={`p-4 rounded-lg border ${
                debugResult.success 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {debugResult.success ? (
                    <CheckCircle className="text-green-600" size={20} />
                  ) : (
                    <AlertCircle className="text-red-600" size={20} />
                  )}
                  <span className={`font-medium ${
                    debugResult.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {debugResult.success ? 'Order Verified' : 'Issues Found'}
                  </span>
                </div>
                <p className={`text-sm ${
                  debugResult.success ? 'text-green-700' : 'text-red-700'
                }`}>
                  {debugResult.message || debugResult.error}
                </p>
              </div>

              {debugResult.orderData && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Database Order Data</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="font-medium">Order Number:</span>
                        <br />
                        {debugResult.orderData.orderNumber}
                      </div>
                      <div>
                        <span className="font-medium">Reference:</span>
                        <br />
                        {debugResult.orderData.referenceNumber}
                      </div>
                      <div>
                        <span className="font-medium">Status:</span>
                        <br />
                        <Badge variant={debugResult.orderData.status === 'shipped' ? 'default' : 'secondary'}>
                          {debugResult.orderData.status}
                        </Badge>
                      </div>
                      <div>
                        <span className="font-medium">Jiayou Order ID:</span>
                        <br />
                        {debugResult.orderData.jiayouOrderId || 'Not set'}
                      </div>
                      <div>
                        <span className="font-medium">Tracking Number:</span>
                        <br />
                        {debugResult.orderData.trackingNumber || 'Not set'}
                      </div>
                      <div>
                        <span className="font-medium">Label Path:</span>
                        <br />
                        {debugResult.orderData.labelPath ? (
                          <a 
                            href={debugResult.orderData.labelPath} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <ExternalLink size={12} />
                            View Label
                          </a>
                        ) : (
                          'Not set'
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {debugResult.trackingData && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Jiayou Tracking Response</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                      {JSON.stringify(debugResult.trackingData, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}