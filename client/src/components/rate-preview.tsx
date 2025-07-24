import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Clock, DollarSign, Truck, MapPin } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";

interface RatePreviewProps {
  onRateSelected?: (rate: any) => void;
  className?: string;
}

interface RateRequest {
  pickupZipCode: string;
  deliveryZipCode: string;
}

interface Dimensions {
  length: number;
  width: number;
  height: number;
}

export default function RatePreview({ onRateSelected, className }: RatePreviewProps) {
  const [rateRequest, setRateRequest] = useState<RateRequest>({
    pickupZipCode: "11430",
    deliveryZipCode: "02108"
  });
  
  const [weight, setWeight] = useState<number>(8); // Default 8 oz
  const [weightUnit, setWeightUnit] = useState<string>("oz"); // Default to ounces
  const [dimensions, setDimensions] = useState<Dimensions>({
    length: 2,
    width: 2,
    height: 2
  });

  const ratePreviewMutation = useMutation({
    mutationFn: async (data: any) => {
      // Convert to ounces for the API
      const weightInOz = data.weightUnit === "lb" ? data.weight * 16 : data.weight;
      
      const response = await apiRequest("POST", "/api/rates/compare", {
        fromZip: data.pickupZipCode,
        toZip: data.deliveryZipCode,
        weight: weightInOz,
        dimensions: data.dimensions
      });
      const result = await response.json();
      
      if (!response.ok) {
        // Handle specific error cases with user-friendly messages
        if (result.error && result.error.includes('not covered')) {
          throw new Error(`ZIP code ${data.deliveryZipCode} is not in our shipping network. Try: 10001, 33101, 60601, or 90210`);
        }
        throw new Error(result.error || 'Failed to get shipping rates');
      }
      
      return result;
    }
  });

  const handleGetRates = () => {
    if (!rateRequest.pickupZipCode || !rateRequest.deliveryZipCode) {
      return;
    }

    ratePreviewMutation.mutate({
      pickupZipCode: rateRequest.pickupZipCode,
      deliveryZipCode: rateRequest.deliveryZipCode,
      weight: weight,
      weightUnit: weightUnit,
      dimensions: dimensions
    });
  };

  const handleRateRequestChange = (field: keyof RateRequest, value: string) => {
    setRateRequest(prev => ({ ...prev, [field]: value }));
  };

  const handleDimensionChange = (field: keyof Dimensions, value: number) => {
    setDimensions(prev => ({ ...prev, [field]: value }));
  };

  const rateData = ratePreviewMutation.data;
  const error = ratePreviewMutation.error;
  const isLoading = ratePreviewMutation.isPending;

  // Debug logging
  console.log("Rate data:", rateData);
  console.log("Error:", error);
  console.log("Loading:", isLoading);

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardContent className="space-y-4">
          {/* ZIP Code Details */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pickupZipCode">Pickup ZIP Code</Label>
                <Input
                  id="pickupZipCode"
                  value={rateRequest.pickupZipCode}
                  onChange={(e) => handleRateRequestChange('pickupZipCode', e.target.value)}
                  placeholder="10001"
                  maxLength={5}
                />
              </div>
              <div>
                <Label htmlFor="deliveryZipCode">Delivery ZIP Code</Label>
                <Input
                  id="deliveryZipCode"
                  value={rateRequest.deliveryZipCode}
                  onChange={(e) => handleRateRequestChange('deliveryZipCode', e.target.value)}
                  placeholder="90210"
                  maxLength={5}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Package Details */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Package Details</Label>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <div className="md:col-span-2">
                <Label htmlFor="weight">Weight</Label>
                <div className="flex gap-2">
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={weight}
                    onChange={(e) => setWeight(parseFloat(e.target.value) || 0.1)}
                    className="flex-1"
                  />
                  <Select value={weightUnit} onValueChange={setWeightUnit}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="oz">Oz</SelectItem>
                      <SelectItem value="lb">Lb</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="length">Length (in)</Label>
                <Input
                  id="length"
                  type="number"
                  step="0.1"
                  min="1"
                  value={dimensions.length}
                  onChange={(e) => handleDimensionChange('length', parseFloat(e.target.value) || 1)}
                />
              </div>
              <div>
                <Label htmlFor="width">Width (in)</Label>
                <Input
                  id="width"
                  type="number"
                  step="0.1"
                  min="1"
                  value={dimensions.width}
                  onChange={(e) => handleDimensionChange('width', parseFloat(e.target.value) || 1)}
                />
              </div>
              <div>
                <Label htmlFor="height">Height (in)</Label>
                <Input
                  id="height"
                  type="number"
                  step="0.1"
                  min="1"
                  value={dimensions.height}
                  onChange={(e) => handleDimensionChange('height', parseFloat(e.target.value) || 1)}
                />
              </div>
            </div>
          </div>

          

          <Button 
            onClick={handleGetRates} 
            disabled={isLoading || !rateRequest.pickupZipCode || !rateRequest.deliveryZipCode}
            className="w-full"
          >
            {isLoading ? "Calculating Rates..." : "Calculate Rates"}
          </Button>
          
          {/* Error Display */}
          {ratePreviewMutation.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {ratePreviewMutation.error.message || "Failed to calculate shipping rate"}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Rate Results */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error instanceof Error ? error.message : "Failed to get rate preview"}
          </AlertDescription>
        </Alert>
      )}

      {rateData?.rates && rateData.rates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Shipping Rate Comparison</CardTitle>
            {rateData.cheapest && (
              <p className="text-sm text-muted-foreground">
                {rateData.count} carrier{rateData.count > 1 ? 's' : ''} available • Best rate: ${rateData.cheapest.rate.toFixed(2)}
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {rateData.rates.map((rate: any, index: number) => {
                const isCheapest = rateData.cheapest && rate.carrier === rateData.cheapest.carrier;
                return (
                  <div 
                    key={index}
                    className={`p-4 border rounded-lg transition-all ${
                      isCheapest 
                        ? 'border-green-500 bg-green-50 dark:bg-green-950 ring-2 ring-green-500/20' 
                        : 'hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {rate.logo && (
                          <img 
                            src={rate.logo} 
                            alt={rate.carrier} 
                            className="h-8 w-auto object-contain"
                          />
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium capitalize">{rate.carrier}</h4>
                            {isCheapest && (
                              <Badge variant="default" className="bg-green-500">
                                Best Rate
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {rate.service} • {rate.deliveryDays} {typeof rate.deliveryDays === 'number' ? 'days' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">
                          ${rate.rate.toFixed(2)}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{rate.deliveryDays} {typeof rate.deliveryDays === 'number' ? 'days' : ''}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {rateData.rates.length === 1 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Only showing Quikpik rates. Add FedEx or DHL accounts in Settings to compare rates across carriers.
                </AlertDescription>
              </Alert>
            )}

            {onRateSelected && rateData.cheapest && (
              <Button 
                onClick={() => onRateSelected(rateData.cheapest)}
                className="w-full"
              >
                Use {rateData.cheapest.carrier.toUpperCase()} (${rateData.cheapest.rate.toFixed(2)})
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}