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
import { SubscriptionProvider } from "@/hooks/use-subscription";
import { useOnboarding } from "@/hooks/use-onboarding";
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
import Onboarding from "@/pages/Onboarding";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import Pricing from "@/pages/Pricing";
import Health from "@/pages/Health";
import Early from "@/pages/Early";
import EarlyAccessAdmin from "@/pages/EarlyAccessAdmin";
import AuthCallback from "@/pages/AuthCallback";
import ResetPassword from "@/pages/ResetPassword";

// Component that requires onboarding completion before accessing protected routes
function OnboardingRequiredRoute({ children }: { children: React.ReactNode }) {
  const { needsOnboarding, isLoading } = useOnboarding();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (needsOnboarding) {
    setLocation('/onboarding');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Redirecting to onboarding...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function Router() {
  const [location] = useLocation();
  const shouldShowDock = !location.includes('/privacy') && !location.includes('/health') && !location.includes('/early') && !location.includes('/auth') && !location.includes('/welcome') && !location.includes('/onboarding') && !location.includes('/pricing');

  return (
    <>
      <Switch>
        {/* Authentication pages - accessible without login */}
        <Route path="/auth" component={Auth} />
        <Route path="/auth/callback" component={AuthCallback} />
        <Route path="/auth/reset-password" component={ResetPassword} />

        {/* Welcome page - accessible without login */}
        <Route path="/welcome" component={RunwayAIWelcome} />
        
        {/* Onboarding page - accessible without login */}
        <Route path="/onboarding" component={Onboarding} />
        
        {/* Pricing page - accessible without login */}
        <Route path="/pricing" component={Pricing} />

        {/* Privacy Policy - accessible without login */}
        <Route path="/privacy" component={PrivacyPolicy} />

        {/* Health Monitor - accessible without login but password protected */}
        <Route path="/health" component={Health} />

        {/* Early access waitlist - accessible without login */}
        <Route path="/early" component={Early} />

        {/* All protected routes require authentication AND onboarding completion */}
        <Route path="/" component={() => <ProtectedRoute><OnboardingRequiredRoute><Home /></OnboardingRequiredRoute></ProtectedRoute>} />
        <Route path="/app" component={() => <ProtectedRoute><OnboardingRequiredRoute><Home /></OnboardingRequiredRoute></ProtectedRoute>} />
        <Route path="/profile" component={() => <ProtectedRoute><OnboardingRequiredRoute><Profile /></OnboardingRequiredRoute></ProtectedRoute>} />
        <Route path="/dress-tryon" component={() => <ProtectedRoute><OnboardingRequiredRoute><DressTryOn /></OnboardingRequiredRoute></ProtectedRoute>} />
        <Route path="/interview-coach" component={() => <ProtectedRoute><OnboardingRequiredRoute><InterviewCoach /></OnboardingRequiredRoute></ProtectedRoute>} />
        <Route path="/calendar" component={() => <ProtectedRoute><OnboardingRequiredRoute><PageantCalendar /></OnboardingRequiredRoute></ProtectedRoute>} />
        <Route path="/board" component={() => <ProtectedRoute><OnboardingRequiredRoute><Board /></OnboardingRequiredRoute></ProtectedRoute>} />
        <Route path="/routine" component={() => <ProtectedRoute><OnboardingRequiredRoute><Routine /></OnboardingRequiredRoute></ProtectedRoute>} />
        <Route path="/admin/early-access" component={() => <ProtectedRoute><OnboardingRequiredRoute><EarlyAccessAdmin /></OnboardingRequiredRoute></ProtectedRoute>} />

        {/* Redirect legacy routes to main app (also protected) */}
        <Route path="/practice" component={() => <ProtectedRoute><OnboardingRequiredRoute><div>Redirecting...</div></OnboardingRequiredRoute></ProtectedRoute>} />
        <Route path="/challenges" component={() => <ProtectedRoute><OnboardingRequiredRoute><div>Redirecting...</div></OnboardingRequiredRoute></ProtectedRoute>} />
        <Route path="/workouts" component={() => <ProtectedRoute><OnboardingRequiredRoute><div>Redirecting...</div></OnboardingRequiredRoute></ProtectedRoute>} />

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
            <SubscriptionProvider>
              <Router />
            </SubscriptionProvider>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;