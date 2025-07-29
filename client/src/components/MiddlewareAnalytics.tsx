import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpRight, Package, TrendingUp, DollarSign, Percent } from "lucide-react";
import { format } from "date-fns";

interface MiddlewareSummary {
  totalOrders: number;
  quikpikOrders: number;
  traditionalOrders: number;
  totalSaved: number;
  averageSavings: number;
  captureRate: number;
}

interface RoutingDecision {
  id: number;
  orderId: string;
  routedTo: 'quikpik' | 'traditional';
  reason: string;
  saved: number;
  quikpikRate: number;
  alternativeRate: number;
  timestamp: string;
}

export function MiddlewareAnalytics() {
  // Fetch analytics summary
  const { data: summary, isLoading: summaryLoading } = useQuery<MiddlewareSummary>({
    queryKey: ['/api/middleware/analytics/summary'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Fetch recent routing decisions
  const { data: recentDecisions, isLoading: decisionsLoading } = useQuery<RoutingDecision[]>({
    queryKey: ['/api/middleware/analytics/recent']
  });

  if (summaryLoading || decisionsLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders Processed</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalOrders || 0}</div>
            <p className="text-xs text-muted-foreground">
              Automatically routed by middleware
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Saved</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${summary?.totalSaved?.toFixed(2) || '0.00'}</div>
            <p className="text-xs text-muted-foreground">
              Compared to traditional carriers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Savings</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${summary?.averageSavings?.toFixed(2) || '0.00'}</div>
            <p className="text-xs text-muted-foreground">
              Per shipment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quikpik Capture Rate</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.captureRate?.toFixed(1) || '0'}%</div>
            <Progress value={summary?.captureRate || 0} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Routing Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Routing Breakdown</CardTitle>
          <CardDescription>How your orders are being automatically routed</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <span className="text-sm font-medium">Routed to Quikpik</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {summary?.quikpikOrders || 0} orders ({((summary?.quikpikOrders || 0) / (summary?.totalOrders || 1) * 100).toFixed(1)}%)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-3 w-3 rounded-full bg-blue-500" />
                <span className="text-sm font-medium">Routed to Traditional Carriers</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {summary?.traditionalOrders || 0} orders ({((summary?.traditionalOrders || 0) / (summary?.totalOrders || 1) * 100).toFixed(1)}%)
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Routing Decisions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Routing Decisions</CardTitle>
          <CardDescription>Real-time transparency of middleware routing logic</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentDecisions?.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No routing decisions yet. Orders will appear here as they're processed by the middleware.
              </p>
            ) : (
              recentDecisions?.map((decision) => (
                <div key={decision.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">Order #{decision.orderId}</span>
                      <Badge variant={decision.routedTo === 'quikpik' ? 'default' : 'secondary'}>
                        {decision.routedTo === 'quikpik' ? 'Quikpik' : 'Traditional'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{decision.reason}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(decision.timestamp), 'MMM dd, HH:mm')}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-1">
                      <span className="text-sm font-medium">
                        ${decision.quikpikRate.toFixed(2)}
                      </span>
                      <span className="text-xs text-muted-foreground">vs</span>
                      <span className="text-sm text-muted-foreground">
                        ${decision.alternativeRate.toFixed(2)}
                      </span>
                    </div>
                    {decision.saved > 0 && (
                      <div className="flex items-center text-green-600 text-sm">
                        <ArrowUpRight className="h-3 w-3" />
                        <span>Saved ${decision.saved.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}