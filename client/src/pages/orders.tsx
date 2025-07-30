import { useState } from "react";
import RatePreview from "@/components/rate-preview";
import Header from "@/components/header";
import OrderTable from "@/components/order-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useOrders, useFilteredOrders } from "@/hooks/use-orders";
import { Search, Filter, X, MapPin, Truck, AlertTriangle, CheckCircle } from "lucide-react";

export default function Orders() {
  const [filter, setFilter] = useState<"all" | "pending" | "shipped">("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  
  // Advanced filters
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [carrierFilter, setCarrierFilter] = useState<string>("all");
  const [addressValidationFilter, setAddressValidationFilter] = useState<string>("all");
  const [priceRangeMin, setPriceRangeMin] = useState<string>("");
  const [priceRangeMax, setPriceRangeMax] = useState<string>("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);
  const [domesticOnly, setDomesticOnly] = useState<boolean>(false);
  const [poBoxFilter, setPoBoxFilter] = useState<string>("all");
  
  const { data, isLoading } = useOrders();
  
  // Enhanced filtering logic
  const applyAdvancedFilters = (orders: any[]) => {
    let filtered = orders || [];
    
    // Apply basic filters first
    if (filter !== "all") {
      filtered = filtered.filter(order => {
        if (filter === "pending") return !order.trackingNumber;
        if (filter === "shipped") return !!order.trackingNumber;
        return true;
      });
    }
    
    // Apply date filters
    if (startDate) {
      filtered = filtered.filter(order => 
        new Date(order.orderDate || order.createdAt) >= new Date(startDate)
      );
    }
    if (endDate) {
      filtered = filtered.filter(order => 
        new Date(order.orderDate || order.createdAt) <= new Date(endDate)
      );
    }
    
    // Apply search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(order =>
        order.orderNumber?.toLowerCase().includes(term) ||
        order.customerName?.toLowerCase().includes(term) ||
        order.shipToCity?.toLowerCase().includes(term) ||
        order.shipToState?.toLowerCase().includes(term) ||
        order.shipToPostalCode?.includes(term) ||
        order.trackingNumber?.toLowerCase().includes(term)
      );
    }
    
    // Apply carrier filter
    if (carrierFilter !== "all") {
      filtered = filtered.filter(order => order.carrier === carrierFilter);
    }
    
    // Apply address validation filter
    if (addressValidationFilter !== "all") {
      filtered = filtered.filter(order => {
        if (addressValidationFilter === "validated") return order.addressValidated === true;
        if (addressValidationFilter === "unvalidated") return !order.addressValidated;
        if (addressValidationFilter === "failed") return order.addressValidated === false;
        return true;
      });
    }
    
    // Apply PO Box filter
    if (poBoxFilter !== "all") {
      filtered = filtered.filter(order => {
        const isPoBox = order.shipToAddress1?.toLowerCase().includes('po box') || 
                       order.shipToAddress1?.toLowerCase().includes('p.o. box') ||
                       order.shipToAddress1?.toLowerCase().match(/\bp\.?o\.?\s*box\b/i);
        if (poBoxFilter === "pobox") return isPoBox;
        if (poBoxFilter === "street") return !isPoBox;
        return true;
      });
    }
    
    // Apply domestic filter
    if (domesticOnly) {
      filtered = filtered.filter(order => 
        order.shipToCountryCode === "US" || order.shipToCountryCode === "USA" || !order.shipToCountryCode
      );
    }
    
    // Apply price range filters
    if (priceRangeMin) {
      filtered = filtered.filter(order => 
        parseFloat(order.orderTotal || 0) >= parseFloat(priceRangeMin)
      );
    }
    if (priceRangeMax) {
      filtered = filtered.filter(order => 
        parseFloat(order.orderTotal || 0) <= parseFloat(priceRangeMax)
      );
    }
    
    return filtered;
  };
  
  const filteredOrders = applyAdvancedFilters(data?.orders);
  
  const pendingCount = data?.pendingCount || 0;
  const shippedCount = data?.shippedCount || 0;
  const totalCount = data?.orders?.length || 0;

  const clearAllFilters = () => {
    setStartDate("");
    setEndDate("");
    setSearchTerm("");
    setCarrierFilter("all");
    setAddressValidationFilter("all");
    setPriceRangeMin("");
    setPriceRangeMax("");
    setDomesticOnly(false);
    setPoBoxFilter("all");
  };

  const clearDateFilters = () => {
    setStartDate("");
    setEndDate("");
  };
  
  const hasActiveFilters = startDate || endDate || searchTerm || carrierFilter !== "all" || 
    addressValidationFilter !== "all" || priceRangeMin || priceRangeMax || domesticOnly || poBoxFilter !== "all";

  return (
    <>
      <Header 
        title="Orders" 
        description="Manage orders imported from ShipStation"
      />
      
      <div className="p-4 lg:p-6">
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Order Filters</CardTitle>
              <div className="flex items-center gap-2">
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Clear All
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                >
                  <Filter className="w-4 h-4 mr-1" />
                  Advanced
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search Bar */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by order number, customer, address, or tracking..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            {/* Status Filters */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Status</Label>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                <Button
                  variant={filter === "all" ? "default" : "outline"}
                  onClick={() => setFilter("all")}
                  className="w-full sm:w-auto"
                >
                  All Orders
                  <Badge variant="secondary" className="ml-2">
                    {totalCount}
                  </Badge>
                </Button>
                <Button
                  variant={filter === "pending" ? "default" : "outline"}
                  onClick={() => setFilter("pending")}
                  className="w-full sm:w-auto"
                >
                  Pending
                  <Badge variant="secondary" className="ml-2">
                    {pendingCount}
                  </Badge>
                </Button>
                <Button
                  variant={filter === "shipped" ? "default" : "outline"}
                  onClick={() => setFilter("shipped")}
                  className="w-full sm:w-auto"
                >
                  Shipped
                  <Badge variant="secondary" className="ml-2">
                    {shippedCount}
                  </Badge>
                </Button>
              </div>
            </div>

            {/* Date Range Filters */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Date Range</Label>
              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-1">
                  <Label htmlFor="start-date" className="text-xs text-muted-foreground">From</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="end-date" className="text-xs text-muted-foreground">To</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <Button 
                  variant="outline" 
                  onClick={clearDateFilters}
                  className="w-full sm:w-auto"
                  disabled={!startDate && !endDate}
                >
                  Clear Dates
                </Button>
              </div>
            </div>

            {/* Advanced Filters */}
            {showAdvancedFilters && (
              <>
                <Separator />
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <Label className="text-sm font-medium">Advanced Filters</Label>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Carrier Filter */}
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">Carrier</Label>
                      <Select value={carrierFilter} onValueChange={setCarrierFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="All carriers" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Carriers</SelectItem>
                          <SelectItem value="quikpik">Quikpik</SelectItem>
                          <SelectItem value="fedex">FedEx</SelectItem>
                          <SelectItem value="usps">USPS</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Address Validation Filter */}
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">Address Status</Label>
                      <Select value={addressValidationFilter} onValueChange={setAddressValidationFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="All addresses" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Addresses</SelectItem>
                          <SelectItem value="validated">
                            <div className="flex items-center">
                              <CheckCircle className="w-3 h-3 mr-1 text-green-600" />
                              Validated
                            </div>
                          </SelectItem>
                          <SelectItem value="unvalidated">
                            <div className="flex items-center">
                              <AlertTriangle className="w-3 h-3 mr-1 text-yellow-600" />
                              Unvalidated
                            </div>
                          </SelectItem>
                          <SelectItem value="failed">
                            <div className="flex items-center">
                              <X className="w-3 h-3 mr-1 text-red-600" />
                              Failed
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* PO Box Filter */}
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">Address Type</Label>
                      <Select value={poBoxFilter} onValueChange={setPoBoxFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="All types" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Address Types</SelectItem>
                          <SelectItem value="street">
                            <div className="flex items-center">
                              <MapPin className="w-3 h-3 mr-1" />
                              Street Addresses
                            </div>
                          </SelectItem>
                          <SelectItem value="pobox">PO Boxes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Price Range */}
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">Price Range ($)</Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="Min"
                          value={priceRangeMin}
                          onChange={(e) => setPriceRangeMin(e.target.value)}
                        />
                        <Input
                          type="number"
                          placeholder="Max"
                          value={priceRangeMax}
                          onChange={(e) => setPriceRangeMax(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Domestic Only Checkbox */}
                    <div className="flex items-center space-x-2 pt-6">
                      <Checkbox
                        id="domestic-only"
                        checked={domesticOnly}
                        onCheckedChange={(checked) => setDomesticOnly(checked === true)}
                      />
                      <Label htmlFor="domestic-only" className="text-sm">
                        US Domestic Only
                      </Label>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Results Summary */}
            {(filteredOrders.length !== totalCount || hasActiveFilters) && (
              <div className="pt-2 border-t">
                <div className="flex flex-col sm:flex-row gap-4 text-sm text-muted-foreground">
                  <span>Showing {filteredOrders.length} of {totalCount} orders</span>
                  {hasActiveFilters && (
                    <span className="text-blue-600">• Filters active</span>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        <OrderTable 
          orders={filteredOrders} 
          showShipmentActions={filter === "shipped" || filter === "all"}
          showBatchActions={true}
        />
      </div>
    </>
  );
}
