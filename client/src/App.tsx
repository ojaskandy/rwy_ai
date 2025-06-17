import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/Home";
import Landing from "@/pages/Landing";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Practice from "@/pages/Practice";
import EarlyAccess from "@/pages/EarlyAccess";
import Profile from "@/pages/Profile";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
// Use our custom ThemeProvider instead of the shadcn one
import { ThemeProvider } from "./hooks/use-theme";
import MarketingLanding from "@/pages/MarketingLanding";
import RootRedirector from "@/pages/RootRedirector";
import MobileLandingPage from "@/pages/MobileLanding";
import Challenges from "@/pages/Challenges";
import Workouts from "@/pages/Workouts";
import MaxPunchesChallenge from "@/pages/MaxPunchesChallenge";
import ReactionTimeChallenge from "@/pages/VipersReflexesChallenge";
import BalanceBeamBreakerChallenge from "@/pages/BalanceBeamBreakerChallenge";
import PushupsWorkout from "@/pages/PushupsWorkout";
import CrunchesWorkout from "@/pages/CrunchesWorkout";
import JumpingJacksWorkout from "@/pages/JumpingJacksWorkout";
import LiveRoutineDemo from "@/pages/LiveRoutineDemo";
import InternshipApplication from "@/pages/InternshipApplication";

function Router() {
  return (
    <Switch>
      {/* Root path now uses RootRedirector */}
      <Route path="/" component={RootRedirector} />
      
      {/* Marketing landing page moved to /welcome */}
      <Route path="/welcome" component={MarketingLanding} />
      
      {/* User dashboard after login - This might be redundant if /app is the main target */}
      {/* Consider removing /dashboard if Home (at /app) is the primary post-login page */}
      <Route path="/dashboard" component={Landing} />
      
      {/* Main application with camera tracking */}
      <ProtectedRoute path="/app" component={Home} />
      
      {/* Practice page with moves library */}
      <ProtectedRoute path="/practice" component={Practice} />

      {/* User profile page */}
      <ProtectedRoute path="/profile" component={Profile} />
      
      {/* Challenges page */}
      <ProtectedRoute path="/challenges" component={Challenges} />

      {/* Workouts page */}
      <ProtectedRoute path="/workouts" component={Workouts} />

      {/* Max Punches Challenge page */}
      <ProtectedRoute path="/challenges/max-punches" component={MaxPunchesChallenge} />

      {/* Viper's Reflexes Challenge page */}
      <ProtectedRoute path="/challenges/reaction-time" component={ReactionTimeChallenge} />

      {/* Balance Beam Challenge page */}
      <ProtectedRoute path="/challenges/balance-beam" component={BalanceBeamBreakerChallenge} />

      {/* Workout pages */}
      <ProtectedRoute path="/workouts/pushups" component={PushupsWorkout} />
      <ProtectedRoute path="/workouts/crunches" component={CrunchesWorkout} />
      <ProtectedRoute path="/workouts/jumping-jacks" component={JumpingJacksWorkout} />

      {/* Live Routine Demo */}
      <ProtectedRoute path="/live-routine" component={LiveRoutineDemo} />

      {/* Authentication page */}
      <Route path="/auth" component={AuthPage} />
      
      {/* Early access signup page */}
      <Route path="/early-access" component={EarlyAccess} />
      
      {/* Early access landing page for mobile users */}
      <Route path="/early" component={MobileLandingPage} />
      
      {/* Internship application page */}
      <Route path="/internship" component={InternshipApplication} />
      
      {/* 404 page */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <AuthProvider>
            <Toaster />
            <Router />
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
