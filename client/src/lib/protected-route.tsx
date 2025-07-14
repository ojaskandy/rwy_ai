import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route, RouteProps } from "wouter";
import { useEffect, useState } from "react";
import { checkOnboardingStatus } from "@/lib/onboardingUtils";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: React.ComponentType<any>;
}) {
  const { user, isLoading } = useAuth();
  const [onboardingStatus, setOnboardingStatus] = useState<any>(null);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);

  useEffect(() => {
    if (user && user.authProvider !== 'guest') {
      checkOnboardingStatus()
        .then((status) => {
          setOnboardingStatus(status);
          setIsCheckingOnboarding(false);
        })
        .catch(() => {
          setIsCheckingOnboarding(false);
        });
    } else {
      setIsCheckingOnboarding(false);
    }
  }, [user]);

  if (isLoading || isCheckingOnboarding) {
    return (
      <Route path={path}>
        <div className="flex flex-col items-center justify-center min-h-screen bg-black">
          <div className="relative mb-2">
            <Loader2 className="h-12 w-12 md:h-16 md:w-16 animate-spin text-red-600" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-white">T</span>
            </div>
          </div>
          <div className="flex items-center">
            <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-red-500 to-red-300 bg-clip-text text-transparent">CoachT</span>
          </div>
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/" />
      </Route>
    );
  }

  // Check if user needs onboarding (but not if they're already on the onboarding page)
  if (
    user.authProvider !== 'guest' &&
    onboardingStatus &&
    !onboardingStatus.hasCompletedOnboarding &&
    !onboardingStatus.hasPaid &&
    !onboardingStatus.hasCodeBypass &&
    path !== '/onboarding'
  ) {
    return (
      <Route path={path}>
        <Redirect to="/onboarding" />
      </Route>
    );
  }

  return (
    <Route path={path}>
      <Component />
    </Route>
  );
}