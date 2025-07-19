import { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Package, 
  Route, 
  BarChart3,
  Settings,
  Menu,
  X,
  LogOut,
  User
} from "lucide-react";
import logoPath from "@assets/logo_1752442395960.png";
import { ThemeToggle } from "./theme-toggle";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

const navItems = [
  { path: "/", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/orders", icon: Package, label: "Orders" },
  { path: "/analytics", icon: BarChart3, label: "Analytics" },
  { path: "/tracking", icon: Route, label: "Tracking" },
  { path: "/settings", icon: Settings, label: "Settings" },
];

export default function Sidebar() {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
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
    <>
      {/* Mobile menu button */}
      <button
        onClick={toggleMobileMenu}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-background border border-border shadow-sm"
      >
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={toggleMobileMenu}
        />
      )}

      {/* Sidebar */}
      <nav className={`
        bg-background border-r border-border h-screen overflow-y-auto z-50
        fixed top-0 left-0 transition-transform duration-300 ease-in-out
        w-64 flex flex-col
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
      `}>
        <div className="p-4 lg:p-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center">
              <img src={logoPath} alt="Quikpik Logo" className="w-6 h-6 lg:w-8 lg:h-8" />
            </div>
            <div>
              <h1 className="text-lg lg:text-xl font-semibold text-foreground">Quikpik</h1>
              <p className="text-xs lg:text-sm text-muted-foreground">Shipment Management</p>
            </div>
          </div>
        </div>
        <div className="px-3 lg:px-4 pb-4 flex-1">
          <ul className="space-y-1 lg:space-y-2">
            {navItems.map(({ path, icon: Icon, label }) => {
              const isActive = location === path;
              return (
                <li key={path}>
                  <Link 
                    href={path} 
                    className={`flex items-center space-x-3 px-3 lg:px-4 py-3 rounded-lg font-medium transition-colors touch-manipulation ${
                      isActive 
                        ? "text-primary bg-accent" 
                        : "text-muted-foreground hover:text-primary hover:bg-accent"
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Icon size={20} />
                    <span>{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
        
        {/* User Profile & Actions */}
        <div className="px-3 lg:px-4 pb-4 border-t border-border">
          <div className="py-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start px-3 lg:px-4">
                  <User className="mr-3" size={16} />
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium">
                      {user?.firstName} {user?.lastName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {user?.organization?.name || user?.email}
                    </span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                    <p className="text-xs text-muted-foreground capitalize">{user?.role} Account</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {/* Theme Toggle */}
          <div className="flex items-center justify-between px-3 lg:px-4 py-3">
            <span className="text-sm text-muted-foreground">Theme</span>
            <ThemeToggle />
          </div>
        </div>
      </nav>
    </>
  );
}
