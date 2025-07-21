import {
  useState,
  createContext,
  useContext,
  ReactNode,
  useEffect,
} from "react";

// Define types for the guest user context
type User = {
  id: number;
  username: string;
  email?: string;
  fullName?: string;
  picture?: string;
  authProvider?: "guest";
  profileCompleted?: boolean;
  taekwondoExperience?: string;
};

type AuthContextType = {
  user: User | null;
  isCheckingSession: boolean;
  showMobileWarning: boolean;
  setShowMobileWarning: (show: boolean) => void;
  isMobileDevice: boolean;
  // Simplified mutations that do nothing but maintain API compatibility
  loginMutation: { mutate: () => void; isLoading: boolean };
  registerMutation: { mutate: () => void; isLoading: boolean };
  googleLoginMutation: { mutate: () => void; isLoading: boolean };
  completeProfileMutation: { mutate: () => void; isLoading: boolean };
  logoutMutation: { mutate: () => void; isLoading: boolean };
  guestLoginMutation: { mutate: () => void; isLoading: boolean };
};

// Default guest user for Runway AI
const DEFAULT_GUEST_USER: User = {
  id: 1,
  username: "guest_user",
  email: "guest@runwayai.com",
  fullName: "Guest User",
  picture: undefined,
  authProvider: "guest",
  profileCompleted: true,
  taekwondoExperience: "beginner",
};

// Create auth context
const AuthContext = createContext<AuthContextType | null>(null);

// Provider component
type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(DEFAULT_GUEST_USER);
  const [isCheckingSession, setIsCheckingSession] = useState<boolean>(false); // No session checking needed
  const [showMobileWarning, setShowMobileWarning] = useState<boolean>(false);
  const [isMobileDevice, setIsMobileDevice] = useState<boolean>(false);

  // Set user to default guest immediately
  useEffect(() => {
    setUser(DEFAULT_GUEST_USER);
    setIsCheckingSession(false);
  }, []);

  // Check if device is mobile
  useEffect(() => {
    const checkMobileDevice = () => {
      const isMobileBySize = window.innerWidth < 768;
      const isMobileByAgent =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent,
        );
      const isIPad = /iPad/i.test(navigator.userAgent);

      setIsMobileDevice(isMobileBySize && isMobileByAgent && !isIPad);
    };

    checkMobileDevice();
    window.addEventListener("resize", checkMobileDevice);
    return () => window.removeEventListener("resize", checkMobileDevice);
  }, []);

  // Stub mutations that do nothing but maintain compatibility
  const createStubMutation = () => ({
    mutate: () => {
      console.log("Authentication disabled - guest user mode");
    },
    isLoading: false,
  });

  const value = {
    user,
    isCheckingSession,
    showMobileWarning,
    setShowMobileWarning,
    isMobileDevice,
    loginMutation: createStubMutation(),
    registerMutation: createStubMutation(),
    googleLoginMutation: createStubMutation(),
    completeProfileMutation: createStubMutation(),
    logoutMutation: createStubMutation(),
    guestLoginMutation: createStubMutation(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook for using the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
