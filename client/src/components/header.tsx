import { useState, useEffect } from "react";
import { Bell, User, LogOut, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  title: string;
  description: string;
}

export default function Header({ title, description }: HeaderProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Utility function to format tracking numbers for display
  const formatTrackingNumber = (trackingNumber: string) => {
    return trackingNumber?.replace(/^GV/g, 'QP') || '';
  };
  
  // Default notifications data
  const defaultNotifications = [
    {
      id: 1,
      title: "Shipment Delivered",
      description: "QP25USA0U020270941 has been delivered",
      time: "2 mins ago",
      unread: true
    },
    {
      id: 2,
      title: "Shipment Delivered", 
      description: "QP25USA0U020270942 has been delivered",
      time: "1 hour ago",
      unread: true
    },
    {
      id: 3,
      title: "Order Imported",
      description: "New order #100006 imported from ShipStation",
      time: "3 hours ago",
      unread: false
    }
  ];

  // Load notifications from localStorage or use defaults
  const [notifications, setNotifications] = useState(() => {
    try {
      const stored = localStorage.getItem('notifications');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading notifications from localStorage:', error);
    }
    return defaultNotifications;
  });

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('notifications', JSON.stringify(notifications));
    } catch (error) {
      console.error('Error saving notifications to localStorage:', error);
    }
  }, [notifications]);

  const unreadCount = notifications.filter(n => n.unread).length;

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notification => ({ 
      ...notification, 
      unread: false 
    })));
    toast({
      title: "All notifications marked as read",
      description: "All notifications have been marked as read",
    });
  };

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout", {});
      
      // Clear all cached data
      queryClient.clear();
      
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account.",
      });
      
      // Force page reload to reset authentication state
      window.location.reload();
    } catch (error) {
      toast({
        title: "Logout Failed",
        description: "Failed to logout properly",
        variant: "destructive",
      });
    }
  };

  return (
    <header className="bg-background border-b border-border px-4 lg:px-6 py-4 pt-16 lg:pt-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-xl lg:text-2xl font-semibold text-foreground">{title}</h2>
          <p className="text-sm lg:text-base text-muted-foreground">{description}</p>
        </div>
        <div className="flex items-center space-x-2 lg:space-x-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="text-muted-foreground" size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs text-primary-foreground font-medium">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>
                <div className="flex items-center justify-between">
                  <span>Notifications</span>
                  <div className="flex items-center space-x-2">
                    {unreadCount > 0 && (
                      <>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={markAllAsRead}
                          className="text-xs h-6 px-2 py-1 text-blue-600 hover:text-blue-800"
                        >
                          <CheckCheck className="mr-1" size={12} />
                          Mark all read
                        </Button>
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                          {unreadCount} new
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.map((notification) => (
                <DropdownMenuItem key={notification.id} className="flex flex-col items-start space-y-1 p-3">
                  <div className="flex items-start justify-between w-full">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium">{notification.title}</p>
                        {notification.unread && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{notification.description}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{notification.time}</span>
                  </div>
                </DropdownMenuItem>
              ))}
              {notifications.length === 0 && (
                <div className="p-3 text-center text-sm text-muted-foreground">
                  No notifications
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 lg:space-x-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-primary">
                    <User className="text-primary-foreground" size={16} />
                  </div>

                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                    <p className="text-xs text-muted-foreground capitalize">{user.role} Account</p>
                    {user.organization && (
                      <p className="text-xs text-muted-foreground">{user.organization.name}</p>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
