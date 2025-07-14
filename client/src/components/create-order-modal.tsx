import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import { X } from "lucide-react";

const createOrderSchema = z.object({
  orderNumber: z.string().min(1, "Order number is required"),
  customerName: z.string().min(1, "Customer name is required"),
  customerEmail: z.string().email("Valid email is required"),
  customerPhone: z.string().min(1, "Phone number is required"),
  shippingAddress: z.object({
    name: z.string().min(1, "Name is required"),
    street1: z.string().min(1, "Street address is required"),
    street2: z.string().optional(),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    postalCode: z.string().min(1, "Postal code is required"),
    country: z.string().default("US"),
    phone: z.string().min(1, "Phone is required"),
  }),
  items: z.array(z.object({
    name: z.string().min(1, "Item name is required"),
    sku: z.string().min(1, "SKU is required"),
    quantity: z.number().min(1, "Quantity must be at least 1"),
    unitPrice: z.number().min(0, "Price must be positive"),
    weight: z.object({
      value: z.number().min(0, "Weight must be positive"),
      units: z.string().default("ounces"),
    }),
  })).min(1, "At least one item is required"),
  totalAmount: z.string().min(1, "Total amount is required"),
});

type CreateOrderForm = z.infer<typeof createOrderSchema>;

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateOrderModal({ isOpen, onClose }: CreateOrderModalProps) {
  const [items, setItems] = useState([{ name: "", sku: "", quantity: 1, unitPrice: 0, weight: { value: 0, units: "ounces" } }]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<CreateOrderForm>({
    resolver: zodResolver(createOrderSchema),
    defaultValues: {
      orderNumber: "",
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      shippingAddress: {
        name: "",
        street1: "",
        street2: "",
        city: "",
        state: "",
        postalCode: "",
        country: "US",
        phone: "",
      },
      items: items,
      totalAmount: "0",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: CreateOrderForm) => {
      const response = await apiRequest("POST", "/api/orders/manual", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Order created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      onClose();
      reset();
      setItems([{ name: "", sku: "", quantity: 1, unitPrice: 0, weight: { value: 0, units: "ounces" } }]);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create order",
        variant: "destructive",
      });
    },
  });

  const addItem = () => {
    const newItems = [...items, { name: "", sku: "", quantity: 1, unitPrice: 0, weight: { value: 0, units: "ounces" } }];
    setItems(newItems);
    setValue("items", newItems);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
      setValue("items", newItems);
    }
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      newItems[index][parent][child] = value;
    } else {
      newItems[index][field] = value;
    }
    setItems(newItems);
    setValue("items", newItems);
    
    // Calculate total
    const total = newItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    setValue("totalAmount", total.toFixed(2));
  };

  const onSubmit = (data: CreateOrderForm) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Manual Order</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Order Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="orderNumber">Order Number</Label>
              <Input
                id="orderNumber"
                {...register("orderNumber")}
                placeholder="ORDER-001"
              />
              {errors.orderNumber && (
                <p className="text-sm text-red-500 mt-1">{errors.orderNumber.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="totalAmount">Total Amount</Label>
              <Input
                id="totalAmount"
                {...register("totalAmount")}
                placeholder="0.00"
                readOnly
              />
            </div>
          </div>

          {/* Customer Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Customer Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customerName">Customer Name</Label>
                <Input
                  id="customerName"
                  {...register("customerName")}
                  placeholder="John Doe"
                />
                {errors.customerName && (
                  <p className="text-sm text-red-500 mt-1">{errors.customerName.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="customerEmail">Email</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  {...register("customerEmail")}
                  placeholder="john@example.com"
                />
                {errors.customerEmail && (
                  <p className="text-sm text-red-500 mt-1">{errors.customerEmail.message}</p>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="customerPhone">Phone</Label>
              <Input
                id="customerPhone"
                {...register("customerPhone")}
                placeholder="(555) 123-4567"
              />
              {errors.customerPhone && (
                <p className="text-sm text-red-500 mt-1">{errors.customerPhone.message}</p>
              )}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Shipping Address</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="shippingAddress.name">Name</Label>
                <Input
                  id="shippingAddress.name"
                  {...register("shippingAddress.name")}
                  placeholder="John Doe"
                />
                {errors.shippingAddress?.name && (
                  <p className="text-sm text-red-500 mt-1">{errors.shippingAddress.name.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="shippingAddress.phone">Phone</Label>
                <Input
                  id="shippingAddress.phone"
                  {...register("shippingAddress.phone")}
                  placeholder="(555) 123-4567"
                />
                {errors.shippingAddress?.phone && (
                  <p className="text-sm text-red-500 mt-1">{errors.shippingAddress.phone.message}</p>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="shippingAddress.street1">Street Address</Label>
              <Input
                id="shippingAddress.street1"
                {...register("shippingAddress.street1")}
                placeholder="123 Main St"
              />
              {errors.shippingAddress?.street1 && (
                <p className="text-sm text-red-500 mt-1">{errors.shippingAddress.street1.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="shippingAddress.street2">Street Address 2 (Optional)</Label>
              <Input
                id="shippingAddress.street2"
                {...register("shippingAddress.street2")}
                placeholder="Apt 4B"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="shippingAddress.city">City</Label>
                <Input
                  id="shippingAddress.city"
                  {...register("shippingAddress.city")}
                  placeholder="New York"
                />
                {errors.shippingAddress?.city && (
                  <p className="text-sm text-red-500 mt-1">{errors.shippingAddress.city.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="shippingAddress.state">State</Label>
                <Input
                  id="shippingAddress.state"
                  {...register("shippingAddress.state")}
                  placeholder="NY"
                />
                {errors.shippingAddress?.state && (
                  <p className="text-sm text-red-500 mt-1">{errors.shippingAddress.state.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="shippingAddress.postalCode">Postal Code</Label>
                <Input
                  id="shippingAddress.postalCode"
                  {...register("shippingAddress.postalCode")}
                  placeholder="10001"
                />
                {errors.shippingAddress?.postalCode && (
                  <p className="text-sm text-red-500 mt-1">{errors.shippingAddress.postalCode.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Items</h3>
              <Button type="button" onClick={addItem} variant="outline">
                Add Item
              </Button>
            </div>
            {items.map((item, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Item {index + 1}</h4>
                  {items.length > 1 && (
                    <Button 
                      type="button" 
                      onClick={() => removeItem(index)}
                      variant="outline"
                      size="sm"
                    >
                      <X size={16} />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={item.name}
                      onChange={(e) => updateItem(index, 'name', e.target.value)}
                      placeholder="Product Name"
                    />
                  </div>
                  <div>
                    <Label>SKU</Label>
                    <Input
                      value={item.sku}
                      onChange={(e) => updateItem(index, 'sku', e.target.value)}
                      placeholder="SKU-001"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div>
                    <Label>Unit Price</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label>Weight (oz)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      value={item.weight.value}
                      onChange={(e) => updateItem(index, 'weight.value', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Creating..." : "Create Order"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}