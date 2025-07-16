import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Package, 
  Route, 
  Settings 
} from "lucide-react";
import logoPath from "@assets/logo_1752442395960.png";

const navItems = [
  { path: "/", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/orders", icon: Package, label: "Orders" },
  { path: "/tracking", icon: Route, label: "Tracking" },
  { path: "/settings", icon: Settings, label: "Settings" },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <nav className="bg-background border-r border-border w-64 fixed h-full left-0 top-0 overflow-y-auto">
      <div className="p-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 flex items-center justify-center">
            <img src={logoPath} alt="Quikpik Logo" className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Quikpik</h1>
            <p className="text-sm text-muted-foreground">Shipment Management</p>
          </div>
        </div>
      </div>
      <div className="px-4 pb-4">
        <ul className="space-y-2">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = location === path;
            return (
              <li key={path}>
                <Link href={path} className={`flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                  isActive 
                    ? "text-primary bg-accent" 
                    : "text-muted-foreground hover:text-primary hover:bg-accent"
                }`}>
                  <Icon size={20} />
                  <span>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
