import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Clock, DollarSign, Truck, MapPin } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";

interface RatePreviewProps {
  onRateSelected?: (rate: any) => void;
  className?: string;
}

interface Address {
  name: string;
  street1: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface Dimensions {
  length: number;
  width: number;
  height: number;
}

export default function RatePreview({ onRateSelected, className }: RatePreviewProps) {
  const [address, setAddress] = useState<Address>({
    name: "",
    street1: "",
    city: "",
    state: "",
    postalCode: "",
    country: "US"
  });
  
  const [weight, setWeight] = useState<number>(0.5);
  const [dimensions, setDimensions] = useState<Dimensions>({
    length: 10,
    width: 10,
    height: 5
  });

  const ratePreviewMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/rates/preview", data);
    },
  });

  const handleGetRates = () => {
    if (!address.name || !address.street1 || !address.city || !address.postalCode) {
      return;
    }

    ratePreviewMutation.mutate({
      shippingAddress: address,
      weight,
      dimensions,
      serviceType: 'standard',
      channelCode: 'US001'
    });
  };

  const handleAddressChange = (field: keyof Address, value: string) => {
    setAddress(prev => ({ ...prev, [field]: value }));
  };

  const handleDimensionChange = (field: keyof Dimensions, value: number) => {
    setDimensions(prev => ({ ...prev, [field]: value }));
  };

  const { data: rateData, error, isLoading } = ratePreviewMutation;

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Rate Preview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Address Input */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Shipping Address</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="name">Recipient Name</Label>
                <Input
                  id="name"
                  value={address.name}
                  onChange={(e) => handleAddressChange('name', e.target.value)}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <Label htmlFor="street1">Street Address</Label>
                <Input
                  id="street1"
                  value={address.street1}
                  onChange={(e) => handleAddressChange('street1', e.target.value)}
                  placeholder="123 Main St"
                />
              </div>
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={address.city}
                  onChange={(e) => handleAddressChange('city', e.target.value)}
                  placeholder="New York"
                />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={address.state}
                  onChange={(e) => handleAddressChange('state', e.target.value)}
                  placeholder="NY"
                  maxLength={2}
                />
              </div>
              <div>
                <Label htmlFor="postalCode">ZIP Code</Label>
                <Input
                  id="postalCode"
                  value={address.postalCode}
                  onChange={(e) => handleAddressChange('postalCode', e.target.value)}
                  placeholder="10001"
                />
              </div>
              <div>
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={address.country}
                  onChange={(e) => handleAddressChange('country', e.target.value)}
                  placeholder="US"
                  maxLength={2}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Package Details */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Package Details</Label>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  min="0.05"
                  value={weight}
                  onChange={(e) => setWeight(parseFloat(e.target.value) || 0.05)}
                />
              </div>
              <div>
                <Label htmlFor="length">Length (cm)</Label>
                <Input
                  id="length"
                  type="number"
                  min="1"
                  value={dimensions.length}
                  onChange={(e) => handleDimensionChange('length', parseInt(e.target.value) || 1)}
                />
              </div>
              <div>
                <Label htmlFor="width">Width (cm)</Label>
                <Input
                  id="width"
                  type="number"
                  min="1"
                  value={dimensions.width}
                  onChange={(e) => handleDimensionChange('width', parseInt(e.target.value) || 1)}
                />
              </div>
              <div>
                <Label htmlFor="height">Height (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  min="1"
                  value={dimensions.height}
                  onChange={(e) => handleDimensionChange('height', parseInt(e.target.value) || 1)}
                />
              </div>
            </div>
          </div>

          <Button 
            onClick={handleGetRates} 
            disabled={isLoading || !address.name || !address.street1}
            className="w-full"
          >
            {isLoading ? "Getting Rates..." : "Get Rate Preview"}
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
              Rate Preview Results
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

            {/* Coverage Info */}
            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <MapPin className="h-5 w-5 text-green-600" />
              <div>
                <div className="font-medium">Service Coverage</div>
                <div className="text-sm text-muted-foreground">
                  {rateData.preview.coverage.serviceArea}
                </div>
                <Badge variant="outline" className="text-green-600 border-green-600 mt-1">
                  Available
                </Badge>
              </div>
            </div>

            {/* Service Options */}
            {rateData.preview.serviceOptions && rateData.preview.serviceOptions.length > 0 && (
              <div>
                <Label className="text-base font-medium mb-3 block">Available Services</Label>
                <div className="space-y-2">
                  {rateData.preview.serviceOptions.map((service: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{service.name}</div>
                        <div className="text-sm text-muted-foreground">{service.description}</div>
                      </div>
                      <Badge variant={service.available ? "default" : "secondary"}>
                        {service.available ? "Available" : "Not Available"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

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

            <div className="text-xs text-muted-foreground text-center">
              Rate valid until: {new Date(rateData.validUntil).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}