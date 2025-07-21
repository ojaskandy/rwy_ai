import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/Home";
import NotFound from "@/pages/not-found";
import Profile from "@/pages/Profile";
import { AuthProvider } from "@/hooks/use-auth";
// Use our custom ThemeProvider instead of the shadcn one
import { ThemeProvider } from "./hooks/use-theme";
// NEW PAGEANT FEATURES
import DressTryOn from "@/pages/DressTryOn";
import InterviewCoach from "@/pages/InterviewCoach";
import PageantCalendar from "@/pages/PageantCalendar";
// LIVE ROUTINE FEATURE
import Routine from "@/pages/Routine";
import GlobalDock from "@/components/GlobalDock";

function Router() {
  return (
    <>
      <Switch>
        {/* Default route redirects to main app */}
        <Route path="/" component={Home} />

        {/* Main application with pose tracking */}
        <Route path="/app" component={Home} />

        {/* User profile page */}
        <Route path="/profile" component={Profile} />

        {/* NEW PAGEANT FEATURES */}
        {/* Virtual Dress Try-On & Style Coach */}
        <Route path="/dress-tryon" component={DressTryOn} />

        {/* Interview & Communication Coach */}
        <Route path="/interview-coach" component={InterviewCoach} />

        {/* Pageant Calendar */}
        <Route path="/calendar" component={PageantCalendar} />

        {/* LIVE ROUTINE FEATURE */}
        <Route path="/routine" component={Routine} />

        {/* Redirect legacy routes to main app */}
        <Route path="/practice" component={() => {
          window.location.href = '/';
          return <div>Redirecting...</div>;
        }} />
        
        <Route path="/challenges" component={() => {
          window.location.href = '/';
          return <div>Redirecting...</div>;
        }} />
        
        <Route path="/workouts" component={() => {
          window.location.href = '/';
          return <div>Redirecting...</div>;
        }} />

        {/* Redirect auth and onboarding to main app */}
        <Route path="/auth" component={() => {
          window.location.href = '/app';
          return <div>Redirecting...</div>;
        }} />
        
        <Route path="/onboarding" component={() => {
          window.location.href = '/app';
          return <div>Redirecting...</div>;
        }} />

        {/* 404 page */}
        <Route component={NotFound} />
      </Switch>
      
      {/* Global iOS-style dock */}
      <GlobalDock />
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