import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { GoogleOAuthProvider } from '@react-oauth/google';
import Home from "@/pages/Home";
import Landing from "@/pages/Landing";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Practice from "@/pages/Practice";
import EarlyAccess from "@/pages/EarlyAccess";
import Profile from "@/pages/Profile";
import OnboardingPage from "@/pages/OnboardingPage";
import PaymentSuccessPage from "@/pages/PaymentSuccessPage";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
// Use our custom ThemeProvider instead of the shadcn one
import { ThemeProvider } from "./hooks/use-theme";
import MarketingLanding from "@/pages/MarketingLanding";
import WelcomePage from "@/pages/WelcomePage";
import RootRedirector from "@/pages/RootRedirector";
import MobileLandingPage from "@/pages/MobileLanding";
import Challenges from "@/pages/Challenges";
import Workouts from "@/pages/Workouts";
import MaxPunchesChallenge from "@/pages/MaxPunchesChallenge";
import ReactionTimeChallenge from "@/pages/VipersReflexesChallenge";
import BalanceBeamBreakerChallenge from "@/pages/BalanceBeamBreakerChallenge";
import ShifuSaysChallenge from "@/pages/ShifuSaysChallenge";
import PushupsWorkout from "@/pages/PushupsWorkout";
import CrunchesWorkout from "@/pages/CrunchesWorkout";
import JumpingJacksWorkout from "@/pages/JumpingJacksWorkout";
import LiveRoutineDemo from "@/pages/LiveRoutineDemo";
import InternshipApplication from "@/pages/InternshipApplication";
import AdminApplications from "@/pages/AdminApplications";
import SnapFeedback from "@/pages/SnapFeedback";
import Partnership from "@/pages/Partnership";
import GlobalDock from "@/components/GlobalDock";

function Router() {
  return (
    <>
      <Switch>
        {/* Authentication page as default */}
        <Route path="/" component={AuthPage} />

        {/* Welcome page with silhouette zoom interaction */}
        <Route path="/welcome" component={WelcomePage} />

        {/* Marketing landing page moved to /renovate */}
        <Route path="/renovate" component={MarketingLanding} />

        {/* User dashboard after login - This might be redundant if /app is the main target */}
        {/* Consider removing /dashboard if Home (at /app) is the primary post-login page */}
        <Route path="/dashboard" component={Landing} />

        {/* Onboarding flow for new users */}
        <ProtectedRoute path="/onboarding" component={OnboardingPage} />

        {/* Payment success page */}
        <Route path="/payment-success" component={PaymentSuccessPage} />

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
        <Route path="/challenges/reaction-time" component={ReactionTimeChallenge} />

        {/* Balance Beam Challenge page */}
        <Route path="/challenges/balance-beam" component={BalanceBeamBreakerChallenge} />

        {/* Shifu Says Challenge page */}
        <Route path="/challenges/shifu-says" component={ShifuSaysChallenge} />

        {/* Workout pages */}
        <Route path="/workouts/pushups" component={PushupsWorkout} />
        <Route path="/workouts/crunches" component={CrunchesWorkout} />
        <Route path="/workouts/jumping-jacks" component={JumpingJacksWorkout} />

        {/* Live Routine Demo */}
        <Route path="/live-routine" component={LiveRoutineDemo} />

        {/* Snap Feedback */}
        <Route path="/snap-feedback" component={SnapFeedback} />

        {/* Authentication page (also accessible directly) */}
        <Route path="/auth" component={AuthPage} />

        {/* Early access signup page */}
        <Route path="/early-access" component={EarlyAccess} />

        {/* Early access landing page for mobile users */}
        <Route path="/early" component={MobileLandingPage} />

        {/* Internship application page */}
        <Route path="/internship" component={InternshipApplication} />

        {/* Admin applications page */}
        <Route path="/admin/applications" component={AdminApplications} />

        {/* Partnership page */}
        <Route path="/partnership" component={Partnership} />

        {/* 404 page */}
        <Route component={NotFound} />
      </Switch>
      
      {/* Global iOS-style dock */}
      <GlobalDock />
    </>
  );
}

function App() {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  if (!googleClientId) {
    console.error('Google Client ID is not configured');
  }

  return (
    <QueryClientProvider client={queryClient}>
      <GoogleOAuthProvider clientId={googleClientId || ''}>
        <ThemeProvider>
          <TooltipProvider>
            <AuthProvider>
              <Router />
            </AuthProvider>
          </TooltipProvider>
        </ThemeProvider>
      </GoogleOAuthProvider>
    </QueryClientProvider>
  );
}

export default App;