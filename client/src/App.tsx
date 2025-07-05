import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme-provider";
import { ErrorBoundary } from "@/components/error-boundary";
import InventoryPage from "@/pages/inventory";
import MobileScanPage from "@/pages/mobile-scan";
import MobileScanAdvancedPage from "@/pages/mobile-scan-advanced";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={InventoryPage} />
      <Route path="/mobile-scan" component={MobileScanPage} />
      <Route path="/mobile-scan-advanced" component={MobileScanAdvancedPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="system" storageKey="inventory-ui-theme">
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
