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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const editShipmentSchema = z.object({
  trackingNumber: z.string().min(1, "Tracking number is required"),
  channelCode: z.string().min(1, "Channel code is required"),
  serviceType: z.string().min(1, "Service type is required"),
  weight: z.number().min(0.001, "Weight must be greater than 0"),
  dimensions: z.object({
    length: z.number().min(1, "Length is required"),
    width: z.number().min(1, "Width is required"),
    height: z.number().min(1, "Height is required"),
  }),
  status: z.string().min(1, "Status is required"),
  shippingAddress: z.object({
    name: z.string().min(1, "Name is required"),
    company: z.string().optional(),
    street1: z.string().min(1, "Street address is required"),
    street2: z.string().optional(),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    postalCode: z.string().min(1, "Postal code is required"),
    country: z.string().min(1, "Country is required"),
    phone: z.string().optional(),
  }),
});

type EditShipmentForm = z.infer<typeof editShipmentSchema>;

interface EditShipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipment: any;
}

export default function EditShipmentModal({ isOpen, onClose, shipment }: EditShipmentModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<EditShipmentForm>({
    resolver: zodResolver(editShipmentSchema),
    defaultValues: {
      trackingNumber: "",
      channelCode: "US001",
      serviceType: "standard",
      weight: 0.227,
      dimensions: {
        length: 10,
        width: 10,
        height: 10,
      },
      status: "created",
      shippingAddress: {
        name: "",
        company: "",
        street1: "",
        street2: "",
        city: "",
        state: "",
        postalCode: "",
        country: "US",
        phone: "",
      },
    },
  });

  // Update form when shipment changes
  useEffect(() => {
    if (shipment) {
      form.setValue("trackingNumber", shipment.trackingNumber || "");
      form.setValue("channelCode", shipment.channelCode || "US001");
      form.setValue("serviceType", shipment.serviceType || "standard");
      form.setValue("weight", parseFloat(shipment.weight) || 0.227);
      form.setValue("dimensions", shipment.dimensions || { length: 10, width: 10, height: 10 });
      form.setValue("status", shipment.status || "created");
      
      // Set address from related order
      if (shipment.order && shipment.order.shippingAddress) {
        form.setValue("shippingAddress", {
          name: shipment.order.shippingAddress.name || "",
          company: shipment.order.shippingAddress.company || "",
          street1: shipment.order.shippingAddress.street1 || "",
          street2: shipment.order.shippingAddress.street2 || "",
          city: shipment.order.shippingAddress.city || "",
          state: shipment.order.shippingAddress.state || "",
          postalCode: shipment.order.shippingAddress.postalCode || "",
          country: shipment.order.shippingAddress.country || "US",
          phone: shipment.order.shippingAddress.phone || "",
        });
      }
    }
  }, [shipment, form]);

  const editShipmentMutation = useMutation({
    mutationFn: async (data: EditShipmentForm) => {
      const response = await apiRequest("PUT", `/api/shipments/${shipment.id}`, data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Shipment updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/shipments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update shipment",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EditShipmentForm) => {
    editShipmentMutation.mutate(data);
  };

  if (!shipment) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Shipment</DialogTitle>
          <DialogDescription>
            Edit shipment details for tracking #{shipment.trackingNumber}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="trackingNumber">Tracking Number</Label>
              <Input
                id="trackingNumber"
                {...form.register("trackingNumber")}
              />
              {form.formState.errors.trackingNumber && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.trackingNumber.message}
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={form.watch("status")}
                onValueChange={(value) => form.setValue("status", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created">Created</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="in_transit">In Transit</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.status && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.status.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="channelCode">Channel Code</Label>
              <Input
                id="channelCode"
                value="US001"
                disabled
                className="bg-gray-50"
              />
              <p className="text-sm text-gray-500 mt-1">US001 is the only supported channel</p>
            </div>
            
            <div>
              <Label htmlFor="serviceType">Service Type</Label>
              <Input
                id="serviceType"
                value="Standard"
                disabled
                className="bg-gray-50"
              />
              <p className="text-sm text-gray-500 mt-1">Standard is the only supported service</p>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-6">
            <h4 className="text-md font-medium text-slate-800 mb-4">Shipping Address</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Recipient Name</Label>
                <Input
                  id="name"
                  {...form.register("shippingAddress.name")}
                />
                {form.formState.errors.shippingAddress?.name && (
                  <p className="text-red-500 text-sm mt-1">
                    {form.formState.errors.shippingAddress.name.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="company">Company (Optional)</Label>
                <Input
                  id="company"
                  {...form.register("shippingAddress.company")}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="street1">Street Address</Label>
                <Input
                  id="street1"
                  {...form.register("shippingAddress.street1")}
                />
                {form.formState.errors.shippingAddress?.street1 && (
                  <p className="text-red-500 text-sm mt-1">
                    {form.formState.errors.shippingAddress.street1.message}
                  </p>
                )}
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="street2">Street Address 2 (Optional)</Label>
                <Input
                  id="street2"
                  {...form.register("shippingAddress.street2")}
                />
              </div>
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  {...form.register("shippingAddress.city")}
                />
                {form.formState.errors.shippingAddress?.city && (
                  <p className="text-red-500 text-sm mt-1">
                    {form.formState.errors.shippingAddress.city.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  {...form.register("shippingAddress.state")}
                />
                {form.formState.errors.shippingAddress?.state && (
                  <p className="text-red-500 text-sm mt-1">
                    {form.formState.errors.shippingAddress.state.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="postalCode">Postal Code</Label>
                <Input
                  id="postalCode"
                  {...form.register("shippingAddress.postalCode")}
                />
                {form.formState.errors.shippingAddress?.postalCode && (
                  <p className="text-red-500 text-sm mt-1">
                    {form.formState.errors.shippingAddress.postalCode.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  {...form.register("shippingAddress.country")}
                />
                {form.formState.errors.shippingAddress?.country && (
                  <p className="text-red-500 text-sm mt-1">
                    {form.formState.errors.shippingAddress.country.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="phone">Phone (Optional)</Label>
                <Input
                  id="phone"
                  {...form.register("shippingAddress.phone")}
                />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-6">
            <h4 className="text-md font-medium text-slate-800 mb-4">Package Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.001"
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
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-slate-200">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={editShipmentMutation.isPending}
            >
              {editShipmentMutation.isPending ? "Updating..." : "Update Shipment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}