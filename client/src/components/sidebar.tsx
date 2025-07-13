import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Package, 
  Truck, 
  Tag, 
  Route, 
  Settings 
} from "lucide-react";

const navItems = [
  { path: "/", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/orders", icon: Package, label: "Orders" },
  { path: "/shipments", icon: Truck, label: "Shipments" },
  { path: "/labels", icon: Tag, label: "Labels" },
  { path: "/tracking", icon: Route, label: "Tracking" },
  { path: "/settings", icon: Settings, label: "Settings" },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <nav className="bg-white border-r border-slate-200 w-64 fixed h-full left-0 top-0 overflow-y-auto">
      <div className="p-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Truck className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-800">Jiayou SMS</h1>
            <p className="text-sm text-slate-500">Shipment Management</p>
          </div>
        </div>
      </div>
      
      <div className="px-4 pb-4">
        <ul className="space-y-2">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = location === path;
            return (
              <li key={path}>
                <Link href={path}>
                  <a className={`flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                    isActive 
                      ? "text-blue-600 bg-blue-50" 
                      : "text-slate-600 hover:text-blue-600 hover:bg-blue-50"
                  }`}>
                    <Icon size={20} />
                    <span>{label}</span>
                  </a>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
