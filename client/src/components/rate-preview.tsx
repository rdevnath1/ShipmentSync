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
    deliveryZipCode: "90210"
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
      
      if (!response.ok) {
        // Handle specific error cases with user-friendly messages
        if (result.error && result.error.includes('not covered')) {
          throw new Error(`ZIP code ${data.deliveryZipCode} is not in our shipping network. Try: 10001, 33101, 60601, or 90210`);
        }
        throw new Error(result.error || 'Failed to get shipping rate');
      }
      
      return result;
    }
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

          {/* Working ZIP Codes Helper */}
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">✅ Guaranteed Working ZIP Codes:</p>
              <p className="text-xs">• 10001 (NY - Zone 1) • 33101 (Miami - Zone 3) • 60601 (Chicago - Zone 5) • 90210 (LA - Zone 8)</p>
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

      {rateData?.success && (
        <Card>
          <CardHeader className="flex flex-col space-y-1.5 p-6 pl-[8px] pr-[8px] pt-[1px] pb-[1px]">
          </CardHeader>
          <CardContent className="p-6 space-y-4 ml-[0px] mr-[0px] mt-[0px] mb-[0px] pl-[24px] pr-[24px] pt-[15px] pb-[15px]">
            {/* Dual Rate Display for Master Users or Single Rate for Regular Users */}
            {rateData.preview.dualRates ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                {/* Internal Rate */}
                <div className="flex flex-col justify-between p-4 border rounded-lg bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                  <div>
                    <div className="font-medium text-green-800 dark:text-green-200">Internal Rate</div>
                    <div className="text-sm text-green-600 dark:text-green-400">
                      {rateData.preview.rateCalculation.zone} • Your Cost
                    </div>
                  </div>
                  <div className="text-xl font-bold text-green-600 mt-2">
                    {rateData.preview.dualRates.internal.formatted}
                  </div>
                </div>

                {/* Customer Rate */}
                <div className="flex flex-col justify-between p-4 border rounded-lg bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                  <div>
                    <div className="font-medium text-blue-800 dark:text-blue-200">Customer Rate</div>
                    <div className="text-sm text-blue-600 dark:text-blue-400">
                      {rateData.preview.rateCalculation.zone} • Customer Price
                    </div>
                  </div>
                  <div className="text-xl font-bold text-blue-600 mt-2">
                    {rateData.preview.dualRates.customer.formatted}
                  </div>
                </div>

                {/* Profit Margin */}
                {rateData.preview.dualRates.profitMargin && (
                  <div className="col-span-full p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800">
                    <div className="flex justify-between items-center">
                      <div className="text-yellow-800 dark:text-yellow-200 font-medium">Profit Margin</div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-yellow-700 dark:text-yellow-300">
                          +${rateData.preview.dualRates.profitMargin.amount.toFixed(2)}
                        </div>
                        <div className="text-sm text-yellow-600 dark:text-yellow-400">
                          {rateData.preview.dualRates.profitMargin.percentage.toFixed(1)}% markup
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Single Rate Display */}
                <div className="flex flex-col justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">Estimated Shipping Cost</div>
                    <div className="text-sm text-muted-foreground">
                      {rateData.preview.rateCalculation.zone}
                    </div>
                  </div>
                  <div className="text-xl font-bold text-green-600 mt-2">
                    {rateData.preview.estimatedCost.formatted}
                  </div>
                </div>

                {/* Estimated Delivery */}
                <div className="flex flex-col gap-2 p-4 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <div className="font-medium">Estimated Delivery</div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {rateData.preview.estimatedDelivery.description}
                  </div>
                </div>

                {/* Rate Breakdown */}
                <div className="border rounded-lg p-4 bg-muted/30">
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Base Weight:</span>
                      <span>{(rateData.preview.rateCalculation.baseWeight * 35.274).toFixed(1)} oz</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Zone:</span>
                      <span>{rateData.preview.rateCalculation.zone}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Delivery and Details - Always Show */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Estimated Delivery */}
              <div className="flex flex-col gap-2 p-4 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <div className="font-medium">Estimated Delivery</div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {rateData.preview.estimatedDelivery.description}
                </div>
              </div>

              {/* Package Details */}
              <div className="border rounded-lg p-4 bg-muted/30">
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Weight:</span>
                    <span>{(rateData.preview.rateCalculation.baseWeight * 35.274).toFixed(1)} oz</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Zone:</span>
                    <span>{rateData.preview.rateCalculation.zone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Service:</span>
                    <span>Standard</span>
                  </div>
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