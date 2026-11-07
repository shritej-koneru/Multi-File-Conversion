import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import LandingPage from "@/pages/landing";
import { useEffect } from "react";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/story" component={LandingPage} />
      <Route path="/convert" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    // Clean up the server-issued session (stored by file-upload) when the user leaves.
    // The old visibilitychange handler is gone: it wiped files whenever the tab was merely
    // hidden, and it targeted a random id that never matched the upload session.
    const handlePageHide = () => {
      const sessionId = sessionStorage.getItem('sessionId');
      if (sessionId) navigator.sendBeacon(`/api/cleanup/${sessionId}`);
    };

    window.addEventListener('pagehide', handlePageHide);
    return () => window.removeEventListener('pagehide', handlePageHide);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
