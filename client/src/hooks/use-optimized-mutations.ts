import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Optimized mutations with proper caching and error handling
export function useDeleteOrderMutation() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: number) => {
      const response = await apiRequest("DELETE", `/api/orders/${orderId}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete order');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Order deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function usePrintLabelMutation() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (orderId: number) => {
      const response = await apiRequest("POST", `/api/shipments/${orderId}/print`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to print label');
      }
      return response.json();
    },
    onSuccess: (data) => {
      if (data.labelPath) {
        window.open(data.labelPath, '_blank');
        toast({
          title: "Label Opened",
          description: `Label for tracking #${data.trackingNumber} opened in new tab`,
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Print Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useCreateShipmentMutation() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (shipmentData: any) => {
      const response = await apiRequest("POST", "/api/shipments", shipmentData);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create shipment');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Shipment Created",
        description: `Tracking number: ${data.trackingNumber}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Shipment Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function usePullOrdersMutation() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/orders/pull-shipstation");
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to sync orders');
      }
      return response.json();
    },
    onSuccess: (data) => {
      let description = data.message;
      if (data.created > 0 || data.updated > 0) {
        description += ` (${data.created} new, ${data.updated} updated)`;
      }
      
      toast({
        title: "Sync Complete",
        description: description,
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Sync Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}