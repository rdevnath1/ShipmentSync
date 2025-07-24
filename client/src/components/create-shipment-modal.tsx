import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const createShipmentSchema = z.object({
  orderId: z.number(),
  weight: z.number().min(0.1, "Weight must be greater than 0"),
  dimensions: z.object({
    length: z.number().min(1, "Length is required"),
    width: z.number().min(1, "Width is required"),
    height: z.number().min(1, "Height is required"),
  }),
});

type CreateShipmentForm = z.infer<typeof createShipmentSchema>;

interface CreateShipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
}

export default function CreateShipmentModal({ isOpen, onClose, order }: CreateShipmentModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCheckingRates, setIsCheckingRates] = useState(false);
  const [ratesResult, setRatesResult] = useState<any>(null);
  const [selectedCarrier, setSelectedCarrier] = useState<string>("");

  const form = useForm<CreateShipmentForm>({
    resolver: zodResolver(createShipmentSchema),
    defaultValues: {
      orderId: 0,
      weight: 8, // Default to 8 oz to exceed Quikpik minimum requirements (0.227 kg > 0.05 kg)
      dimensions: {
        length: 10,
        width: 10,
        height: 10,
      },
    },
  });

  const checkRates = async () => {
    if (!order?.shippingAddress?.postalCode) {
      toast({
        title: "Error",
        description: "No postal code found for this order",
        variant: "destructive",
      });
      return;
    }

    setIsCheckingRates(true);
    try {
      const response = await apiRequest("POST", "/api/rates/compare", {
        fromZip: "11430", // Default pickup location
        toZip: order.shippingAddress.postalCode,
        weight: form.getValues("weight"), // Already in oz
        dimensions: form.getValues("dimensions"),
      });
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || "Failed to get rates");
      }
      
      setRatesResult(result);
      
      if (result.count === 0) {
        toast({
          title: "No Rates Available",
          description: `No carriers can ship to postal code ${order.shippingAddress.postalCode}`,
          variant: "destructive",
        });
      } else {
        // Automatically select the cheapest carrier
        if (result.cheapest) {
          setSelectedCarrier(result.cheapest.carrier);
          toast({
            title: "Rates Available",
            description: `${result.count} carrier(s) available. Best rate: ${result.cheapest.carrier.toUpperCase()} at $${result.cheapest.rate.toFixed(2)}`,
          });
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to check rates",
        variant: "destructive",
      });
    } finally {
      setIsCheckingRates(false);
    }
  };

  // Update form when order changes
  useEffect(() => {
    if (order) {
      form.setValue("orderId", order.id);
      console.log("Setting order ID:", order.id);
    }
  }, [order, form]);

  const createShipmentMutation = useMutation({
    mutationFn: async (data: CreateShipmentForm) => {
      // Check if a carrier is selected
      if (!selectedCarrier) {
        throw new Error("Please select a carrier first");
      }
      
      const shipmentData = {
        ...data,
        carrier: selectedCarrier,
        channelCode: "US001", // Always use US001 for Quikpik
        serviceType: "standard" // Always use standard service
      };
      console.log("Sending shipment data:", shipmentData);
      const response = await apiRequest("POST", "/api/shipments/create", shipmentData);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/shipments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders/pending"] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create shipment",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateShipmentForm) => {
    console.log("Form submitted with data:", data);
    createShipmentMutation.mutate(data);
  };

  if (!order) return null;

  const shippingAddress = order.shippingAddress as any;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Shipment</DialogTitle>
          <DialogDescription>
            Create a new shipment for order #{order.orderNumber}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <Label htmlFor="orderId">Order ID</Label>
              <Input
                id="orderId"
                value={`#${order.orderNumber}`}
                disabled
              />
            </div>
          </div>

          <div className="border-t border-slate-200 pt-6">
            <h4 className="text-md font-medium text-foreground mb-4">Recipient Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Name</Label>
                <Input value={shippingAddress?.name || ""} disabled />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={shippingAddress?.phone || ""} disabled />
              </div>
              <div className="md:col-span-2">
                <Label>Address</Label>
                <Textarea
                  value={`${shippingAddress?.street1 || ""} ${shippingAddress?.street2 || ""}`}
                  disabled
                  rows={3}
                />
              </div>
              <div>
                <Label>City</Label>
                <Input value={shippingAddress?.city || ""} disabled />
              </div>
              <div>
                <Label>Postal Code</Label>
                <div className="flex gap-2">
                  <Input value={shippingAddress?.postalCode || ""} disabled />
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={checkRates}
                    disabled={isCheckingRates}
                  >
                    {isCheckingRates ? "Checking..." : "Compare Rates"}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-6">
            <h4 className="text-md font-medium text-foreground mb-4">Package Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="weight">Weight</Label>
                <div className="flex gap-2">
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    min="0.1"
                    className="flex-1"
                    {...form.register("weight", { valueAsNumber: true })}
                  />
                  <select className="w-16 px-2 py-1 border border-input bg-background text-sm rounded-md" defaultValue="oz">
                    <option value="oz">Oz</option>
                    <option value="lb">Lb</option>
                  </select>
                </div>
                {form.formState.errors.weight && (
                  <p className="text-red-500 text-sm mt-1">
                    {form.formState.errors.weight.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="length">Length (in)</Label>
                <Input
                  id="length"
                  type="number"
                  step="0.1"
                  {...form.register("dimensions.length", { valueAsNumber: true })}
                />
                {form.formState.errors.dimensions?.length && (
                  <p className="text-red-500 text-sm mt-1">
                    {form.formState.errors.dimensions.length.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="width">Width (in)</Label>
                <Input
                  id="width"
                  type="number"
                  step="0.1"
                  {...form.register("dimensions.width", { valueAsNumber: true })}
                />
                {form.formState.errors.dimensions?.width && (
                  <p className="text-red-500 text-sm mt-1">
                    {form.formState.errors.dimensions.width.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="height">Height (in)</Label>
                <Input
                  id="height"
                  type="number"
                  step="0.1"
                  {...form.register("dimensions.height", { valueAsNumber: true })}
                />
                {form.formState.errors.dimensions?.height && (
                  <p className="text-red-500 text-sm mt-1">
                    {form.formState.errors.dimensions.height.message}
                  </p>
                )}
              </div>

            </div>
          </div>

          {/* Carrier Selection */}
          {!ratesResult && (
            <div className="border-t border-slate-200 pt-6">
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Click "Compare Rates" above to see shipping options from USPS, Quikpik, FedEx, and DHL before creating your shipment.
                </p>
              </div>
            </div>
          )}
          
          {ratesResult && ratesResult.rates && ratesResult.rates.length > 0 && (
            <div className="border-t border-slate-200 pt-6">
              <h4 className="text-md font-medium text-foreground mb-4">Select Carrier</h4>
              <div className="space-y-3">
                {ratesResult.rates.map((rate: any, index: number) => {
                  const isSelected = selectedCarrier === rate.carrier;
                  const isCheapest = ratesResult.cheapest && rate.carrier === ratesResult.cheapest.carrier;
                  return (
                    <div 
                      key={index}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' 
                          : 'hover:border-slate-300'
                      }`}
                      onClick={() => setSelectedCarrier(rate.carrier)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <input 
                            type="radio" 
                            checked={isSelected}
                            onChange={() => setSelectedCarrier(rate.carrier)}
                            className="h-4 w-4 text-blue-600"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="font-medium capitalize">{rate.carrier}</h5>
                              {isCheapest && (
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                  Best Rate
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {rate.service} • {rate.deliveryDays}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold">
                            ${rate.rate.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-slate-200">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createShipmentMutation.isPending}
            >
              {createShipmentMutation.isPending ? "Creating..." : "Create Shipment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}