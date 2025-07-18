import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Printer, Package2, Search, Download, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function LabelAccess() {
  const [trackingNumber, setTrackingNumber] = useState("");
  const [searchedTracking, setSearchedTracking] = useState("");
  const { toast } = useToast();

  // Auto-populate tracking number from URL parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const trackParam = urlParams.get('track');
    if (trackParam) {
      setTrackingNumber(trackParam);
    }
  }, []);

  const { data: orders, isLoading } = useQuery({
    queryKey: ["/api/orders"],
    enabled: false, // Don't auto-load all orders
  });

  const handleTrackingSearch = () => {
    if (!trackingNumber.trim()) {
      toast({
        title: "Please enter a tracking number",
        description: "Enter your tracking number to access the shipping label",
        variant: "destructive",
      });
      return;
    }
    setSearchedTracking(trackingNumber.trim());
  };

  const handleDirectLabelAccess = () => {
    if (!trackingNumber.trim()) {
      toast({
        title: "Please enter a tracking number",
        description: "Enter your tracking number to access the shipping label",
        variant: "destructive",
      });
      return;
    }
    
    // Direct link to label - this will redirect to the PDF
    const labelUrl = `/api/labels/${trackingNumber.trim()}`;
    window.open(labelUrl, '_blank');
    
    toast({
      title: "Opening Label",
      description: `Accessing shipping label for tracking #${trackingNumber}`,
    });
  };

  const handleCopyShareLink = () => {
    if (!trackingNumber.trim()) {
      toast({
        title: "Please enter a tracking number",
        description: "Enter your tracking number first",
        variant: "destructive",
      });
      return;
    }
    
    const shareUrl = `${window.location.origin}/api/labels/${trackingNumber.trim()}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      toast({
        title: "Link Copied",
        description: "Direct label link copied to clipboard",
      });
    }).catch(() => {
      toast({
        title: "Share Link", 
        description: shareUrl,
      });
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center space-x-3">
            <Package2 className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Jiayou Shipping</h1>
              <p className="text-sm text-muted-foreground">Access Your Shipping Labels</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Get Your Shipping Label</CardTitle>
            <p className="text-muted-foreground">
              Enter your tracking number to access and print your shipping label
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Tracking Number Input */}
            <div className="space-y-2">
              <Label htmlFor="tracking">Tracking Number</Label>
              <div className="flex space-x-2">
                <Input
                  id="tracking"
                  placeholder="Enter tracking number (e.g., GV25USA0U019511600)"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="flex-1"
                  onKeyPress={(e) => e.key === 'Enter' && handleDirectLabelAccess()}
                />
                <Button 
                  onClick={handleDirectLabelAccess}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Printer className="mr-2" size={16} />
                  Print Label
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                onClick={handleCopyShareLink}
                className="w-full"
              >
                <ExternalLink className="mr-2" size={16} />
                Copy Direct Link
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.open(`/tracking?track=${trackingNumber}`, '_blank')}
                disabled={!trackingNumber.trim()}
                className="w-full"
              >
                <Search className="mr-2" size={16} />
                Track Package
              </Button>
            </div>

            {/* Information Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
              <Card className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Printer className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm">Easy Printing</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Access your label directly - no account required
                    </p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Download className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-sm">Direct Download</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Labels open as PDF for easy downloading
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Instructions */}
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <h3 className="font-medium text-sm">How to use:</h3>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Enter your tracking number in the field above</li>
                <li>• Click "Print Label" to open the shipping label</li>
                <li>• Use "Copy Direct Link" to share with others</li>
                <li>• The label will open as a PDF ready for printing</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}