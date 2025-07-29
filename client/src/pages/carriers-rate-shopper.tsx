import { MiddlewareAnalytics } from "@/components/MiddlewareAnalytics";

export default function CarriersRateShopper() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Carriers Rate Shopper</h1>
        <p className="text-muted-foreground mt-2">
          Analyze shipping rates across carriers and track routing decisions made by our intelligent middleware system
        </p>
      </div>
      
      <MiddlewareAnalytics />
    </div>
  );
}