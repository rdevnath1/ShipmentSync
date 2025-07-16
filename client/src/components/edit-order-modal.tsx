import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const editOrderSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  customerEmail: z.string().email("Valid email is required"),
  customerPhone: z.string().optional(),
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
  totalAmount: z.string().min(1, "Total amount is required"),
});

type EditOrderForm = z.infer<typeof editOrderSchema>;

interface EditOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
}

export default function EditOrderModal({ isOpen, onClose, order }: EditOrderModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<EditOrderForm>({
    resolver: zodResolver(editOrderSchema),
    defaultValues: {
      customerName: "",
      customerEmail: "",
      customerPhone: "",
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
      totalAmount: "",
    },
  });

  // Update form when order changes
  useEffect(() => {
    if (order) {
      form.setValue("customerName", order.customerName || "");
      form.setValue("customerEmail", order.customerEmail || "");
      form.setValue("customerPhone", order.customerPhone || "");
      form.setValue("totalAmount", order.totalAmount || "");
      
      // Set address from the order
      if (order.shippingAddress) {
        form.setValue("shippingAddress", {
          name: order.shippingAddress.name || "",
          company: order.shippingAddress.company || "",
          street1: order.shippingAddress.street1 || "",
          street2: order.shippingAddress.street2 || "",
          city: order.shippingAddress.city || "",
          state: order.shippingAddress.state || "",
          postalCode: order.shippingAddress.postalCode || "",
          country: order.shippingAddress.country || "US",
          phone: order.shippingAddress.phone || "",
        });
      }
    }
  }, [order, form]);

  const editOrderMutation = useMutation({
    mutationFn: async (data: EditOrderForm) => {
      const response = await apiRequest("PUT", `/api/orders/${order.id}`, data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Order updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update order",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EditOrderForm) => {
    editOrderMutation.mutate(data);
  };

  if (!order) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Order</DialogTitle>
          <DialogDescription>
            Edit order details for #{order.orderNumber}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Customer Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customerName">Customer Name</Label>
              <Input
                id="customerName"
                {...form.register("customerName")}
              />
              {form.formState.errors.customerName && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.customerName.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="customerEmail">Customer Email</Label>
              <Input
                id="customerEmail"
                type="email"
                {...form.register("customerEmail")}
              />
              {form.formState.errors.customerEmail && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.customerEmail.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="customerPhone">Customer Phone</Label>
              <Input
                id="customerPhone"
                {...form.register("customerPhone")}
              />
            </div>

            <div>
              <Label htmlFor="totalAmount">Total Amount</Label>
              <Input
                id="totalAmount"
                {...form.register("totalAmount")}
              />
              {form.formState.errors.totalAmount && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.totalAmount.message}
                </p>
              )}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-medium mb-4">Shipping Address</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="shippingAddress.name">Recipient Name</Label>
                <Input
                  id="shippingAddress.name"
                  {...form.register("shippingAddress.name")}
                />
                {form.formState.errors.shippingAddress?.name && (
                  <p className="text-red-500 text-sm mt-1">
                    {form.formState.errors.shippingAddress.name.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="shippingAddress.company">Company</Label>
                <Input
                  id="shippingAddress.company"
                  {...form.register("shippingAddress.company")}
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="shippingAddress.street1">Street Address</Label>
                <Input
                  id="shippingAddress.street1"
                  {...form.register("shippingAddress.street1")}
                />
                {form.formState.errors.shippingAddress?.street1 && (
                  <p className="text-red-500 text-sm mt-1">
                    {form.formState.errors.shippingAddress.street1.message}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="shippingAddress.street2">Street Address Line 2</Label>
                <Input
                  id="shippingAddress.street2"
                  {...form.register("shippingAddress.street2")}
                />
              </div>

              <div>
                <Label htmlFor="shippingAddress.city">City</Label>
                <Input
                  id="shippingAddress.city"
                  {...form.register("shippingAddress.city")}
                />
                {form.formState.errors.shippingAddress?.city && (
                  <p className="text-red-500 text-sm mt-1">
                    {form.formState.errors.shippingAddress.city.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="shippingAddress.state">State</Label>
                <Input
                  id="shippingAddress.state"
                  {...form.register("shippingAddress.state")}
                />
                {form.formState.errors.shippingAddress?.state && (
                  <p className="text-red-500 text-sm mt-1">
                    {form.formState.errors.shippingAddress.state.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="shippingAddress.postalCode">Postal Code</Label>
                <Input
                  id="shippingAddress.postalCode"
                  {...form.register("shippingAddress.postalCode")}
                />
                {form.formState.errors.shippingAddress?.postalCode && (
                  <p className="text-red-500 text-sm mt-1">
                    {form.formState.errors.shippingAddress.postalCode.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="shippingAddress.country">Country</Label>
                <Input
                  id="shippingAddress.country"
                  {...form.register("shippingAddress.country")}
                />
                {form.formState.errors.shippingAddress?.country && (
                  <p className="text-red-500 text-sm mt-1">
                    {form.formState.errors.shippingAddress.country.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="shippingAddress.phone">Phone</Label>
                <Input
                  id="shippingAddress.phone"
                  {...form.register("shippingAddress.phone")}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={editOrderMutation.isPending}>
              {editOrderMutation.isPending ? "Updating..." : "Update Order"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}