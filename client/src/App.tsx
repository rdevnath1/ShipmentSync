import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import Dashboard from "@/pages/dashboard";
import Orders from "@/pages/orders";
import Analytics from "@/pages/analytics";
import AuditLogs from "@/pages/audit-logs";
import Tracking from "@/pages/tracking";
import Settings from "@/pages/settings";
import Login from "@/pages/login";
import NotFound from "@/pages/not-found";
import Sidebar from "@/components/sidebar";
import { useAuth } from "@/hooks/useAuth";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Public routes (available without authentication)
  return (
    <Switch>
      <Route path="/tracking" component={Tracking} />
      <Route path="*">
        {isAuthenticated ? (
          <div className="min-h-screen flex">
            <Sidebar />
            <main className="flex-1 lg:ml-64">
              <Switch>
                <Route path="/" component={Dashboard} />
                <Route path="/orders" component={Orders} />
                <Route path="/analytics" component={Analytics} />
                <Route path="/audit-logs" component={AuditLogs} />
                <Route path="/settings" component={Settings} />
                <Route component={NotFound} />
              </Switch>
            </main>
          </div>
        ) : (
          <Login />
        )}
      </Route>
    </Switch>
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
