import { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Package, 
  Route, 
  Settings,
  Menu,
  X
} from "lucide-react";
import logoPath from "@assets/logo_1752442395960.png";
import { ThemeToggle } from "./theme-toggle";

const navItems = [
  { path: "/", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/orders", icon: Package, label: "Orders" },
  { path: "/tracking", icon: Route, label: "Tracking" },
  { path: "/settings", icon: Settings, label: "Settings" },
];

export default function Sidebar() {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
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
        
        {/* Theme Toggle */}
        <div className="px-3 lg:px-4 pb-4 border-t border-border">
          <div className="flex items-center justify-between px-3 lg:px-4 py-3">
            <span className="text-sm text-muted-foreground">Theme</span>
            <ThemeToggle />
          </div>
        </div>
      </nav>
    </>
  );
}
