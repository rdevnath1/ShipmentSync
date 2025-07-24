import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package, TruckIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface BatchRateModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedOrders: any[];
}

interface RateResult {
  orderId: number;
  orderNumber: string;
  destination: string;
  rates: {
    carrier: string;
    service: string;
    rate: number;
    deliveryDays: string;
  }[];
  cheapest: {
    carrier: string;
    rate: number;
  };
}

export default function BatchRateModal({ isOpen, onClose, selectedOrders }: BatchRateModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [rateResults, setRateResults] = useState<RateResult[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && selectedOrders.length > 0) {
      fetchRatesForOrders();
    }
  }, [isOpen, selectedOrders]);

  const fetchRatesForOrders = async () => {
    setIsLoading(true);
    const results: RateResult[] = [];

    try {
      // Fetch rates for each order
      for (const order of selectedOrders) {
        const shippingAddress = order.shippingAddress as any;
        const response = await apiRequest("POST", "/api/rates/compare", {
          fromZip: "11430", // Default pickup location
          toZip: shippingAddress.postalCode,
          weight: 16, // Default 1 lb
          dimensions: { length: 10, width: 8, height: 6 }, // Default dimensions
        });
        
        const rateData = await response.json();
        
        if (response.ok && rateData.rates && rateData.rates.length > 0) {
          results.push({
            orderId: order.id,
            orderNumber: order.orderNumber,
            destination: `${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.postalCode}`,
            rates: rateData.rates,
            cheapest: rateData.cheapest,
          });
        }
      }
      
      setRateResults(results);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch rates for all orders",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate totals by carrier
  const calculateTotalsByCarrier = () => {
    const totals: { [carrier: string]: number } = {};
    
    rateResults.forEach(result => {
      result.rates.forEach(rate => {
        if (!totals[rate.carrier]) {
          totals[rate.carrier] = 0;
        }
        totals[rate.carrier] += rate.rate;
      });
    });
    
    return totals;
  };

  const carrierTotals = calculateTotalsByCarrier();
  const carriers = rateResults.length > 0 ? rateResults[0].rates.map(r => r.carrier) : [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Batch Rate Comparison</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Comparing rates for {selectedOrders.length} selected orders
          </p>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2">Fetching rates...</span>
          </div>
        ) : (
          <>
            {rateResults.length > 0 && (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order</TableHead>
                        <TableHead>Destination</TableHead>
                        {carriers.map(carrier => (
                          <TableHead key={carrier} className="text-center">
                            <div className="capitalize">{carrier}</div>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rateResults.map(result => (
                        <TableRow key={result.orderId}>
                          <TableCell className="font-medium">
                            #{result.orderNumber}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {result.destination}
                          </TableCell>
                          {result.rates.map(rate => {
                            const isCheapest = result.cheapest && rate.carrier === result.cheapest.carrier;
                            return (
                              <TableCell key={rate.carrier} className="text-center">
                                <div className={`${isCheapest ? 'font-bold text-green-600' : ''}`}>
                                  ${rate.rate.toFixed(2)}
                                  {isCheapest && (
                                    <Badge variant="outline" className="ml-1 text-xs">
                                      Best
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {rate.deliveryDays}
                                </div>
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                      
                      {/* Total Row */}
                      <TableRow className="border-t-2 font-bold">
                        <TableCell colSpan={2}>
                          Total for {rateResults.length} orders
                        </TableCell>
                        {carriers.map(carrier => {
                          const total = carrierTotals[carrier] || 0;
                          const isLowest = Math.min(...Object.values(carrierTotals)) === total;
                          return (
                            <TableCell key={carrier} className="text-center">
                              <div className={`text-lg ${isLowest ? 'text-green-600' : ''}`}>
                                ${total.toFixed(2)}
                                {isLowest && (
                                  <Badge variant="outline" className="ml-1">
                                    Lowest Total
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Summary</h4>
                  <div className="space-y-1 text-sm">
                    <p>Orders compared: {rateResults.length}</p>
                    <p>
                      Best individual rates total: $
                      {rateResults.reduce((sum, r) => sum + (r.cheapest?.rate || 0), 0).toFixed(2)}
                    </p>
                    <p>
                      Lowest batch total: ${Math.min(...Object.values(carrierTotals)).toFixed(2)} 
                      ({carriers.find(c => carrierTotals[c] === Math.min(...Object.values(carrierTotals)))})
                    </p>
                  </div>
                </div>
              </>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}