import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, X, AlertTriangle, CheckCircle, Info, AlertCircle, Wallet, Package, Truck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Notification {
  id: string;
  type: "info" | "warning" | "error" | "success";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationCenterProps {
  className?: string;
}

export default function NotificationCenter({ className }: NotificationCenterProps) {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Fetch wallet data for low balance checks
  const { data: walletData } = useQuery({
    queryKey: ["/api/wallet"],
    refetchInterval: 30000, // Check every 30 seconds
  });

  // Fetch recent orders for notifications
  const { data: ordersData } = useQuery({
    queryKey: ["/api/orders"],
    refetchInterval: 60000, // Check every minute
  });

  const walletBalance = walletData?.balance || 0;
  const orders = ordersData?.orders || [];

  // Generate notifications based on current state
  useEffect(() => {
    const newNotifications: Notification[] = [];

    // Low balance alert (threshold: $50)
    if (walletBalance < 50 && walletBalance > 0) {
      newNotifications.push({
        id: "low-balance",
        type: "warning",
        title: "Low Wallet Balance",
        message: `Your wallet balance is $${walletBalance.toFixed(2)}. Consider adding funds to avoid shipping delays.`,
        timestamp: new Date(),
        read: false,
        action: {
          label: "Add Funds",
          onClick: () => {
            // Navigate to wallet settings
            window.location.href = "/app/settings#wallet";
          }
        }
      });
    }

    // Critical balance alert (threshold: $10)
    if (walletBalance < 10 && walletBalance > 0) {
      newNotifications.push({
        id: "critical-balance",
        type: "error",
        title: "Critical Balance Alert",
        message: `Your wallet balance is critically low at $${walletBalance.toFixed(2)}. Shipments may fail.`,
        timestamp: new Date(),
        read: false,
        action: {
          label: "Add Funds Now",
          onClick: () => {
            window.location.href = "/app/settings#wallet";
          }
        }
      });
    }

    // Failed shipments alert
    const failedOrders = orders.filter((order: any) => 
      order.status === "failed" || order.shipmentError
    );
    if (failedOrders.length > 0) {
      newNotifications.push({
        id: "failed-shipments",
        type: "error",
        title: "Failed Shipments",
        message: `${failedOrders.length} shipment${failedOrders.length > 1 ? 's have' : ' has'} failed. Please review and retry.`,
        timestamp: new Date(),
        read: false,
        action: {
          label: "View Orders",
          onClick: () => {
            window.location.href = "/app/orders";
          }
        }
      });
    }

    // Pending orders requiring attention
    const pendingOrders = orders.filter((order: any) => 
      !order.trackingNumber && !order.shipmentError
    );
    if (pendingOrders.length > 10) {
      newNotifications.push({
        id: "pending-orders",
        type: "info",
        title: "Many Pending Orders",
        message: `You have ${pendingOrders.length} pending orders waiting for shipment.`,
        timestamp: new Date(),
        read: false,
        action: {
          label: "Process Orders",
          onClick: () => {
            window.location.href = "/app/orders";
          }
        }
      });
    }

    // Update notifications state, avoiding duplicates
    setNotifications(prev => {
      const existingIds = prev.map(n => n.id);
      const filteredNew = newNotifications.filter(n => !existingIds.includes(n.id));
      return [...prev, ...filteredNew];
    });
  }, [walletBalance, orders]);

  // Mark notification as read
  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  // Dismiss notification
  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  // Clear all notifications
  const clearAll = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      default:
        return <Info className="w-4 h-4 text-blue-600" />;
    }
  };

  const getBorderColor = (type: string) => {
    switch (type) {
      case "warning":
        return "border-l-yellow-500";
      case "error":
        return "border-l-red-500";
      case "success":
        return "border-l-green-500";
      default:
        return "border-l-blue-500";
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Notification Bell */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 z-50">
          <Card className="shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Notifications</CardTitle>
                <div className="flex items-center space-x-2">
                  {notifications.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAll}
                      className="text-xs"
                    >
                      Clear All
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="p-1"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No new notifications</p>
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border-l-4 ${getBorderColor(notification.type)} ${
                        notification.read ? "bg-muted/50" : "bg-background"
                      } hover:bg-muted/30 transition-colors`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          {getIcon(notification.type)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <h4 className="text-sm font-medium">{notification.title}</h4>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-blue-600 rounded-full" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {notification.timestamp.toLocaleTimeString()}
                            </p>
                            {notification.action && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={notification.action.onClick}
                                className="mt-2 text-xs"
                              >
                                {notification.action.label}
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 ml-2">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                              className="p-1 text-xs"
                            >
                              Mark Read
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => dismissNotification(notification.id)}
                            className="p-1"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}