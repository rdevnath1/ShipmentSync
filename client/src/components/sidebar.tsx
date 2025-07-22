import { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Package, 
  Route, 
  BarChart3,
  Settings,
  Shield,
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

export default function Sidebar() {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Role-based navigation
  const getNavItems = () => {
    if (user?.role === 'master') {
      // Master admin gets full navigation + admin features
      return [
        { path: "/app", icon: LayoutDashboard, label: "Master Dashboard" },
        { path: "/app/organizations", icon: User, label: "Organizations" },
        { path: "/app/orders", icon: Package, label: "All Orders" },
        { path: "/app/analytics", icon: BarChart3, label: "Analytics" },
        { path: "/app/audit-logs", icon: Shield, label: "Audit Logs" },
        { path: "/app/rate-calculator", icon: BarChart3, label: "Rate Calculator" },
        { path: "/tracking", icon: Route, label: "Tracking" },
        { path: "/app/settings", icon: Settings, label: "Settings" },
      ];
    } else {
      // Clients get simplified 3-section navigation
      return [
        { path: "/app", icon: Package, label: "Shipments" },
        { path: "/tracking", icon: Route, label: "Tracking" },
        { path: "/app/tools", icon: Settings, label: "Tools" },
      ];
    }
  };

  const navItems = getNavItems();

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
        bg-background border-r border-border h-full overflow-y-auto z-50
        fixed top-0 left-0 transition-transform duration-300 ease-in-out
        w-64 lg:w-64 flex flex-col
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-4 lg:p-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center">
              <img src={logoPath} alt="Quikpik Logo" className="w-6 h-6 lg:w-8 lg:h-8" />
            </div>
            <div>
              <h1 className="text-lg lg:text-xl font-semibold text-foreground">Quikpik</h1>
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
        

      </nav>
    </>
  );
}
