import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import Dashboard from "@/pages/dashboard";
import Orders from "@/pages/orders";
import Tracking from "@/pages/tracking";
import Settings from "@/pages/settings";
import LabelAccess from "@/pages/label-access";
import NotFound from "@/pages/not-found";
import Sidebar from "@/components/sidebar";

function Router() {
  return (
    <div className="min-h-screen flex">
      <Switch>
        {/* Public customer-facing pages (no sidebar) */}
        <Route path="/label-access" component={LabelAccess} />
        
        {/* Main dashboard pages (with sidebar) */}
        <Route>
          <div className="min-h-screen flex">
            <Sidebar />
            <main className="flex-1 lg:ml-64">
              <Switch>
                <Route path="/" component={Dashboard} />
                <Route path="/orders" component={Orders} />
                <Route path="/tracking" component={Tracking} />
                <Route path="/settings" component={Settings} />
                <Route component={NotFound} />
              </Switch>
            </main>
          </div>
        </Route>
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="quikpik-theme">
        <TooltipProvider>
          <div className="bg-background min-h-screen">
            <Toaster />
            <Router />
          </div>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
