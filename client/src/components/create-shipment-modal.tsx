import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const createShipmentSchema = z.object({
  orderId: z.number(),
  channelCode: z.string().min(1, "Channel code is required"),
  serviceType: z.string().min(1, "Service type is required"),
  weight: z.number().min(0.1, "Weight must be greater than 0"),
  dimensions: z.object({
    length: z.number().min(1, "Length is required"),
    width: z.number().min(1, "Width is required"),
    height: z.number().min(1, "Height is required"),
  }),
});

const availableChannels = [
  { code: "US001", name: "US Standard (Limited Coverage)" },
  { code: "US002", name: "US All Range Standard" },
  { code: "US003", name: "US Economy" },
  { code: "US004", name: "US Special Goods" },
];

type CreateShipmentForm = z.infer<typeof createShipmentSchema>;

interface CreateShipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
}

export default function CreateShipmentModal({ isOpen, onClose, order }: CreateShipmentModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCheckingCoverage, setIsCheckingCoverage] = useState(false);
  const [coverageResult, setCoverageResult] = useState<any>(null);

  const form = useForm<CreateShipmentForm>({
    resolver: zodResolver(createShipmentSchema),
    defaultValues: {
      orderId: 0,
      channelCode: "US002", // Default to US002 for better coverage
      serviceType: "standard",
      weight: 1,
      dimensions: {
        length: 10,
        width: 10,
        height: 10,
      },
    },
  });

  const checkCoverage = async () => {
    if (!order?.shippingAddress?.postalCode) {
      toast({
        title: "Error",
        description: "No postal code found for this order",
        variant: "destructive",
      });
      return;
    }

    setIsCheckingCoverage(true);
    try {
      const response = await apiRequest("POST", "/api/jiayou/check-coverage", {
        channelCode: form.getValues("channelCode"),
        postCode: order.shippingAddress.postalCode,
        dimensions: form.getValues("dimensions"),
        weight: form.getValues("weight"),
      });
      const result = await response.json();
      setCoverageResult(result);
      
      if (result.code === 1 && result.data[0].errMsg) {
        toast({
          title: "Coverage Check",
          description: `Postal code ${order.shippingAddress.postalCode} is not supported by this channel. Try US002, US003, or US004.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Coverage Check",
          description: `Postal code ${order.shippingAddress.postalCode} is supported! Estimated cost: $${result.data[0].totalFee}`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to check coverage",
        variant: "destructive",
      });
    } finally {
      setIsCheckingCoverage(false);
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
      console.log("Sending shipment data:", data);
      const response = await apiRequest("POST", "/api/shipments/create", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/shipments"] });
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label htmlFor="orderId">Order ID</Label>
              <Input
                id="orderId"
                value={`#${order.orderNumber}`}
                disabled
              />
            </div>
            <div>
              <Label htmlFor="channelCode">Shipping Channel</Label>
              <Select
                value={form.watch("channelCode")}
                onValueChange={(value) => form.setValue("channelCode", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select channel" />
                </SelectTrigger>
                <SelectContent>
                  {availableChannels.map((channel) => (
                    <SelectItem key={channel.code} value={channel.code}>
                      {channel.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="serviceType">Service Type</Label>
              <Select
                value={form.watch("serviceType")}
                onValueChange={(value) => form.setValue("serviceType", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select service" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="express">Express</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="economy">Economy</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-6">
            <h4 className="text-md font-medium text-slate-800 mb-4">Recipient Information</h4>
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
                    onClick={checkCoverage}
                    disabled={isCheckingCoverage}
                  >
                    {isCheckingCoverage ? "Checking..." : "Check Coverage"}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-6">
            <h4 className="text-md font-medium text-slate-800 mb-4">Package Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  {...form.register("weight", { valueAsNumber: true })}
                />
                {form.formState.errors.weight && (
                  <p className="text-red-500 text-sm mt-1">
                    {form.formState.errors.weight.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="length">Length (cm)</Label>
                <Input
                  id="length"
                  type="number"
                  {...form.register("dimensions.length", { valueAsNumber: true })}
                />
                {form.formState.errors.dimensions?.length && (
                  <p className="text-red-500 text-sm mt-1">
                    {form.formState.errors.dimensions.length.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="width">Width (cm)</Label>
                <Input
                  id="width"
                  type="number"
                  {...form.register("dimensions.width", { valueAsNumber: true })}
                />
                {form.formState.errors.dimensions?.width && (
                  <p className="text-red-500 text-sm mt-1">
                    {form.formState.errors.dimensions.width.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="height">Height (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  {...form.register("dimensions.height", { valueAsNumber: true })}
                />
                {form.formState.errors.dimensions?.height && (
                  <p className="text-red-500 text-sm mt-1">
                    {form.formState.errors.dimensions.height.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="channelCode">Channel Code</Label>
                <Select
                  value={form.watch("channelCode")}
                  onValueChange={(value) => form.setValue("channelCode", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select channel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CA002">CA002 - Canada Express</SelectItem>
                    <SelectItem value="US001">US001 - US Standard</SelectItem>
                    <SelectItem value="UK001">UK001 - UK Express</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.channelCode && (
                  <p className="text-red-500 text-sm mt-1">
                    {form.formState.errors.channelCode.message}
                  </p>
                )}
              </div>
            </div>
          </div>

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