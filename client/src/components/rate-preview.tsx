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
    pickupZipCode: "",
    deliveryZipCode: ""
  });
  
  const [weight, setWeight] = useState<number>(8); // Default 8 oz
  const [weightUnit, setWeightUnit] = useState<string>("oz"); // Default to ounces
  const [dimensions, setDimensions] = useState<Dimensions>({
    length: 10,
    width: 10,
    height: 5
  });

  const ratePreviewMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/rates/preview", data);
      const result = await response.json();
      console.log("Rate preview response:", result);
      return result;
    },
  });

  const handleGetRates = () => {
    if (!rateRequest.pickupZipCode || !rateRequest.deliveryZipCode) {
      return;
    }

    // Convert weight to kg for API (Jiayou expects kg)
    const weightInKg = weightUnit === "lb" ? weight * 0.453592 : weight * 0.0283495;
    
    // Convert dimensions from inches to cm for API (Jiayou expects cm)
    const dimensionsInCm = {
      length: Math.round(dimensions.length * 2.54),
      width: Math.round(dimensions.width * 2.54),
      height: Math.round(dimensions.height * 2.54)
    };
    
    ratePreviewMutation.mutate({
      pickupZipCode: rateRequest.pickupZipCode,
      deliveryZipCode: rateRequest.deliveryZipCode,
      weight: weightInKg,
      dimensions: dimensionsInCm,
      serviceType: 'standard',
      channelCode: 'US001'
    });
  };

  const handleRateRequestChange = (field: keyof RateRequest, value: string) => {
    setRateRequest(prev => ({ ...prev, [field]: value }));
  };

  const handleDimensionChange = (field: keyof Dimensions, value: number) => {
    setDimensions(prev => ({ ...prev, [field]: value }));
  };

  const { data: rateData, error, isLoading } = ratePreviewMutation;

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

      {rateData?.success && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Rate Calculator Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Estimated Cost */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <div className="font-medium">Estimated Shipping Cost</div>
                <div className="text-sm text-muted-foreground">
                  Zone {rateData.preview.rateCalculation.zone} • Weight: {weight}kg
                </div>
              </div>
              <div className="text-2xl font-bold text-green-600">
                {rateData.preview.estimatedCost.formatted}
              </div>
            </div>

            {/* Estimated Delivery */}
            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <Clock className="h-5 w-5 text-blue-600" />
              <div>
                <div className="font-medium">Estimated Delivery</div>
                <div className="text-sm text-muted-foreground">
                  {rateData.preview.estimatedDelivery.description}
                </div>
                <div className="text-sm text-blue-600">
                  Est. {rateData.preview.estimatedDelivery.estimatedDate}
                </div>
              </div>
            </div>

            

            

            {/* Warnings */}
            {rateData.warnings && rateData.warnings.length > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium mb-1">Please Note:</div>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {rateData.warnings.map((warning: string, index: number) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Rate Breakdown */}
            <details className="border rounded-lg p-4">
              <summary className="font-medium cursor-pointer">Rate Calculation Details</summary>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Base Weight:</span>
                  <span>{rateData.preview.rateCalculation.baseWeight}kg</span>
                </div>
                <div className="flex justify-between">
                  <span>Dimensional Weight:</span>
                  <span>{rateData.preview.rateCalculation.factors.dimensionalWeight.toFixed(3)}kg</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping Zone:</span>
                  <span>{rateData.preview.rateCalculation.zone}</span>
                </div>
                <div className="flex justify-between">
                  <span>Zone Multiplier:</span>
                  <span>{rateData.preview.rateCalculation.factors.zoneFactor}x</span>
                </div>
              </div>
            </details>

            {onRateSelected && (
              <Button 
                onClick={() => onRateSelected(rateData.preview)}
                className="w-full"
              >
                Select This Rate
              </Button>
            )}

            
          </CardContent>
        </Card>
      )}
    </div>
  );
}