import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Printer, Download, Package, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface BatchPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: any[];
}

export default function BatchPrintModal({ isOpen, onClose, orders }: BatchPrintModalProps) {
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Filter to only shipped orders with tracking numbers
  const shippedOrders = orders.filter(order => 
    order.status === 'shipped' && order.trackingNumber
  );

  const batchPrintMutation = useMutation({
    mutationFn: async (orderIds: number[]) => {
      // Get all tracking numbers for the selected orders
      const trackingNumbers = shippedOrders
        .filter(order => orderIds.includes(order.id))
        .map(order => order.trackingNumber);
      
      const response = await apiRequest("POST", "/api/labels/batch-print", { 
        trackingNumbers 
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.labels && data.labels.length > 0) {
        // Open each label in a new tab for printing
        data.labels.forEach((label: any, index: number) => {
          setTimeout(() => {
            window.open(label.labelPath, '_blank');
          }, index * 200); // Stagger the opens slightly
        });
        
        toast({
          title: "Batch Print Success",
          description: `${data.labels.length} labels opened for printing`,
        });
        
        onClose();
        setSelectedOrders([]);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Batch Print Error",
        description: error.message || "Failed to print labels",
        variant: "destructive",
      });
    },
  });

  const handleOrderSelect = (orderId: number, checked: boolean) => {
    if (checked) {
      setSelectedOrders(prev => [...prev, orderId]);
    } else {
      setSelectedOrders(prev => prev.filter(id => id !== orderId));
    }
  };

  const handleSelectAll = () => {
    if (selectedOrders.length === shippedOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(shippedOrders.map(order => order.id));
    }
  };

  const handleBatchPrint = () => {
    if (selectedOrders.length === 0) {
      toast({
        title: "No Orders Selected",
        description: "Please select at least one order to print labels",
        variant: "destructive",
      });
      return;
    }
    
    batchPrintMutation.mutate(selectedOrders);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Printer className="h-5 w-5" />
            <span>Batch Print Shipping Labels</span>
          </DialogTitle>
          <DialogDescription>
            Select shipped orders to print their labels in batch for efficient processing
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {shippedOrders.length === 0 ? (
            <div className="flex-1 flex items-center justify-center py-8">
              <div className="text-center">
                <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Orders Ready</h3>
                <p className="text-muted-foreground">No shipped orders with tracking numbers available for printing</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                  >
                    {selectedOrders.length === shippedOrders.length ? "Deselect All" : "Select All"}
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {selectedOrders.length} of {shippedOrders.length} selected
                  </span>
                </div>
                <Badge variant="secondary">
                  {shippedOrders.length} Ready to Print
                </Badge>
              </div>

              <div className="flex-1 overflow-y-auto border rounded-lg">
                <div className="space-y-2 p-4">
                  {shippedOrders.map((order) => {
                    const shippingAddress = order.shippingAddress as any;
                    const isSelected = selectedOrders.includes(order.id);
                    
                    return (
                      <div
                        key={order.id}
                        className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                          isSelected ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : 'hover:bg-muted'
                        }`}
                      >
                        <Checkbox
                          id={`order-${order.id}`}
                          checked={isSelected}
                          onCheckedChange={(checked) => handleOrderSelect(order.id, checked as boolean)}
                        />
                        
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                          <div>
                            <div className="font-medium">#{order.orderNumber}</div>
                            <div className="text-muted-foreground">{order.trackingNumber}</div>
                          </div>
                          <div>
                            <div className="font-medium">{order.customerName}</div>
                            <div className="text-muted-foreground">{shippingAddress?.city}, {shippingAddress?.state}</div>
                          </div>
                          <div className="flex items-center justify-end">
                            {order.shippingCost && (
                              <Badge variant="outline" className="text-green-600">
                                ${parseFloat(order.shippingCost).toFixed(2)}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {selectedOrders.length > 0 && (
              <span className="flex items-center space-x-1">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>{selectedOrders.length} labels will be opened for printing</span>
              </span>
            )}
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleBatchPrint}
              disabled={selectedOrders.length === 0 || batchPrintMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Printer className="mr-2 h-4 w-4" />
              {batchPrintMutation.isPending 
                ? `Printing ${selectedOrders.length} Labels...` 
                : `Print ${selectedOrders.length} Labels`
              }
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}