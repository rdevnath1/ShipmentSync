import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import Dashboard from "@/pages/dashboard";
import MasterDashboard from "@/pages/master-dashboard";
import Orders from "@/pages/orders";
import Analytics from "@/pages/analytics";
import AuditLogs from "@/pages/audit-logs";
import Organizations from "@/pages/organizations";
import Tracking from "@/pages/tracking";
import Settings from "@/pages/settings";
import Tools from "@/pages/tools";
import Login from "@/pages/login";
import NotFound from "@/pages/not-found";
import RateCalculatorPage from "@/pages/rate-calculator";
import LandingPage from "@/pages/landing";
import CarriersRateShopper from "@/pages/carriers-rate-shopper";
import Sidebar from "@/components/sidebar";
import { useAuth } from "@/hooks/useAuth";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Public routes (available without authentication)
  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/tracking" component={Tracking} />
        <Route path="/login" component={Login} />
        <Route path="/" component={LandingPage} />
        <Route>
          <Login />
        </Route>
      </Switch>
    );
  }

  // Role-based dashboard routing
  const getDashboardComponent = () => {
    return user?.role === 'master' ? MasterDashboard : Dashboard;
  };

  // Authenticated routes
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="flex-1 lg:ml-64">
        <Switch>
          <Route path="/app" component={getDashboardComponent()} />
          <Route path="/app/orders" component={Orders} />
          <Route path="/app/organizations" component={Organizations} />
          <Route path="/app/analytics" component={Analytics} />
          <Route path="/app/audit-logs" component={AuditLogs} />
          <Route path="/app/carriers-rate-shopper" component={CarriersRateShopper} />
          <Route path="/app/rate-calculator" component={RateCalculatorPage} />
          <Route path="/app/settings" component={Settings} />
          <Route path="/tracking" component={Tracking} />
          <Route path="/" component={getDashboardComponent()} />
          <Route component={NotFound} />
        </Switch>
      </main>
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
