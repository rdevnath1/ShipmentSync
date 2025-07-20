import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Webhook, CheckCircle, XCircle, Clock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";

interface WebhookActivityProps {
  className?: string;
}

export default function WebhookActivity({ className }: WebhookActivityProps) {
  const { data: activity, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/webhooks/activity"],
    queryFn: () => apiRequest("GET", "/api/webhooks/activity"),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (error) {
    return (
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load webhook activity. This feature may not be available for your user level.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5" />
            Recent Webhook Activity
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4 animate-spin" />
              Loading webhook activity...
            </div>
          </div>
        ) : activity?.activity?.length > 0 ? (
          <div className="space-y-3">
            {activity.activity.map((webhook: any) => (
              <div
                key={webhook.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-full ${
                    webhook.success 
                      ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400' 
                      : 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400'
                  }`}>
                    {webhook.success ? (
                      <CheckCircle className="h-3.5 w-3.5" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5" />
                    )}
                  </div>
                  
                  <div>
                    <div className="font-medium text-sm">
                      {formatWebhookAction(webhook.action)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {webhook.carrier && (
                        <Badge variant="outline" className="mr-2 text-xs">
                          {webhook.carrier.toUpperCase()}
                        </Badge>
                      )}
                      {webhook.resourceId && `ID: ${webhook.resourceId}`}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-muted-foreground">
                    {formatTimestamp(webhook.timestamp)}
                  </div>
                  {webhook.error && (
                    <div className="text-xs text-red-600 max-w-32 truncate" title={webhook.error}>
                      {webhook.error}
                    </div>
                  )}
                </div>
              </div>
            ))}

            <div className="text-center pt-2">
              <div className="text-xs text-muted-foreground">
                Showing {activity.total} recent webhook events
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Webhook className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No webhook activity yet</p>
            <p className="text-xs mt-1">Webhook events will appear here when carriers send updates</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Helper functions
function formatWebhookAction(action: string): string {
  const actionMap: Record<string, string> = {
    'webhook_received': 'Webhook Received',
    'webhook_error': 'Webhook Error',
    'tracking_update': 'Tracking Update',
    'order_delivered_webhook': 'Order Delivered',
    'shipment_status_change': 'Status Change'
  };
  
  return actionMap[action] || action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  } else {
    return date.toLocaleDateString();
  }
}