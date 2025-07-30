import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Settings,
  RefreshCw
} from 'lucide-react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';

interface AppTabsProps {
  className?: string;
}

export default function AppTabs({ className }: AppTabsProps) {
  const [location, setLocation] = useLocation();

  // Refresh current page
  const handleRefresh = () => {
    window.location.reload();
  };

  // Navigate to settings
  const goToSettings = () => {
    setLocation('/app/settings');
  };

  return (
    <div className={`bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Simple Top Bar */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          QuikPik Dashboard
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Refresh Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <RefreshCw size={16} className="text-gray-600 dark:text-gray-300" />
          </Button>
          
          {/* Settings Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={goToSettings}
            className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Settings size={16} className="text-gray-600 dark:text-gray-300" />
          </Button>
        </div>
      </div>
    </div>
  );
} 