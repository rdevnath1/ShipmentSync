import { Bell, User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  title: string;
  description: string;
}

export default function Header({ title, description }: HeaderProps) {
  return (
    <header className="bg-background border-b border-border px-4 lg:px-6 py-4 pt-16 lg:pt-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-xl lg:text-2xl font-semibold text-foreground">{title}</h2>
          <p className="text-sm lg:text-base text-muted-foreground">{description}</p>
        </div>
        <div className="flex items-center space-x-2 lg:space-x-4">
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="text-muted-foreground" size={20} />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
          </Button>
          
          <div className="flex items-center space-x-2 lg:space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <User className="text-white" size={16} />
            </div>
            <div className="text-sm hidden sm:block">
              <p className="font-medium text-foreground">Admin User</p>
              <p className="text-muted-foreground">admin@company.com</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
