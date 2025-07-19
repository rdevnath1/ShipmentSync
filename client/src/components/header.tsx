import { Bell, User, Package, Truck, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface HeaderProps {
  title: string;
  description: string;
}

export default function Header({ title, description }: HeaderProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Mock notifications data - in real app this would come from an API
  const notifications = [
    {
      id: 1,
      type: 'shipment',
      icon: Truck,
      title: 'Shipment Delivered',
      description: 'Order #GV25USA0U019511600 has been delivered',
      time: '2 minutes ago',
      isRead: false
    },
    {
      id: 2,
      type: 'order',
      icon: Package,
      title: 'New Order Imported',
      description: '5 new orders imported from ShipStation',
      time: '1 hour ago',
      isRead: false
    },
    {
      id: 3,
      type: 'success',
      icon: CheckCircle,
      title: 'Label Generated',
      description: 'Shipping label created for order #12345',
      time: '3 hours ago',
      isRead: true
    }
  ];

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <header className="bg-background border-b border-border px-4 lg:px-6 py-4 pt-16 lg:pt-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-xl lg:text-2xl font-semibold text-foreground">{title}</h2>
          <p className="text-sm lg:text-base text-muted-foreground">{description}</p>
        </div>
        <div className="flex items-center space-x-2 lg:space-x-4">
          {/* Notifications Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="text-muted-foreground" size={20} />
                {unreadCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 w-5 h-5 text-xs flex items-center justify-center p-0"
                  >
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex items-center justify-between">
                Notifications
                <Badge variant="secondary">{unreadCount} new</Badge>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.map((notification) => {
                const IconComponent = notification.icon;
                return (
                  <DropdownMenuItem 
                    key={notification.id}
                    className={`flex items-start space-x-3 py-3 cursor-pointer ${
                      !notification.isRead ? 'bg-blue-50 dark:bg-blue-950/20' : ''
                    }`}
                  >
                    <div className={`p-2 rounded-full ${
                      notification.type === 'shipment' ? 'bg-emerald-100 dark:bg-emerald-900/30' :
                      notification.type === 'order' ? 'bg-blue-100 dark:bg-blue-900/30' :
                      'bg-green-100 dark:bg-green-900/30'
                    }`}>
                      <IconComponent 
                        size={14} 
                        className={
                          notification.type === 'shipment' ? 'text-emerald-600 dark:text-emerald-400' :
                          notification.type === 'order' ? 'text-blue-600 dark:text-blue-400' :
                          'text-green-600 dark:text-green-400'
                        }
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{notification.title}</p>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{notification.description}</p>
                      <p className="text-xs text-muted-foreground">{notification.time}</p>
                    </div>
                  </DropdownMenuItem>
                );
              })}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-center text-sm text-blue-600 hover:text-blue-700">
                View all notifications
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* User Profile */}
          <div className="flex items-center space-x-2 lg:space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <User className="text-white" size={16} />
            </div>
            <div className="text-sm hidden sm:block">
              <p className="font-medium text-foreground">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-muted-foreground">{user?.email}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
