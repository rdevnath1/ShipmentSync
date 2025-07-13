import { useQuery } from "@tanstack/react-query";
import Header from "@/components/header";
import OrderTable from "@/components/order-table";

export default function Orders() {
  const { data: orders } = useQuery({
    queryKey: ["/api/orders"],
  });

  return (
    <>
      <Header 
        title="Orders" 
        description="Manage your orders from ShipStation"
      />
      
      <div className="p-6">
        <OrderTable orders={orders || []} />
      </div>
    </>
  );
}
