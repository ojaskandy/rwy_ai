import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/Home";
import NotFound from "@/pages/not-found";
import Profile from "@/pages/Profile";
import Auth from "@/pages/Auth";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AuthProvider } from "@/hooks/use-auth";
// Use our custom ThemeProvider instead of the shadcn one
import { ThemeProvider } from "./hooks/use-theme";
// NEW PAGEANT FEATURES
import DressTryOn from "@/pages/DressTryOn";
import InterviewCoach from "@/pages/InterviewCoach";
import PageantCalendar from "@/pages/PageantCalendar";
import Board from "@/pages/Board";
// LIVE ROUTINE FEATURE
import Routine from "@/pages/Routine";
import GlobalDock from "@/components/GlobalDock";
// RUNWAY AI WELCOME PAGE
import RunwayAIWelcome from "@/pages/RunwayAIWelcome";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import Health from "@/pages/Health";

function Router() {
  const [location] = useLocation();
  const shouldShowDock = !location.includes('/privacy') && !location.includes('/health');

  return (
    <>
      <Switch>
        {/* Authentication page - accessible without login */}
        <Route path="/auth" component={Auth} />

        {/* Welcome page - accessible without login */}
        <Route path="/welcome" component={RunwayAIWelcome} />

        {/* Privacy Policy - accessible without login */}
        <Route path="/privacy" component={PrivacyPolicy} />

        {/* Health Monitor - accessible without login but password protected */}
        <Route path="/health" component={Health} />

        {/* All protected routes require authentication */}
        <Route path="/" component={() => <ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/app" component={() => <ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/profile" component={() => <ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/dress-tryon" component={() => <ProtectedRoute><DressTryOn /></ProtectedRoute>} />
        <Route path="/interview-coach" component={() => <ProtectedRoute><InterviewCoach /></ProtectedRoute>} />
        <Route path="/calendar" component={() => <ProtectedRoute><PageantCalendar /></ProtectedRoute>} />
        <Route path="/board" component={() => <ProtectedRoute><Board /></ProtectedRoute>} />
        <Route path="/routine" component={() => <ProtectedRoute><Routine /></ProtectedRoute>} />

        {/* Redirect legacy routes to main app (also protected) */}
        <Route path="/practice" component={() => <ProtectedRoute><div>Redirecting...</div></ProtectedRoute>} />
        <Route path="/challenges" component={() => <ProtectedRoute><div>Redirecting...</div></ProtectedRoute>} />
        <Route path="/workouts" component={() => <ProtectedRoute><div>Redirecting...</div></ProtectedRoute>} />
        
        <Route path="/onboarding" component={() => {
          window.location.href = '/app';
          return <div>Redirecting...</div>;
        }} />

        {/* 404 page */}
        <Route component={NotFound} />
      </Switch>
      
      {/* Global iOS-style dock - hidden on privacy page */}
      {shouldShowDock && <GlobalDock />}
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;