import {
  useState,
  createContext,
  useContext,
  ReactNode,
  useEffect,
} from "react";
import { useMutation } from "@tanstack/react-query";
import { CredentialResponse } from "@react-oauth/google";

// Define types for auth
type User = {
  id: number;
  username: string;
  email?: string;
  name?: string;
  picture?: string;
  authProvider?: "local" | "google";
};

type LoginCredentials = {
  username: string;
  password: string;
};

type RegisterCredentials = {
  username: string;
  password: string;
};

type AuthContextType = {
  user: User | null;
  loginMutation: any;
  registerMutation: any;
  googleLoginMutation: any;
  logoutMutation: any;
  showMobileWarning: boolean;
  setShowMobileWarning: (show: boolean) => void;
  isMobileDevice: boolean;
};

// Create auth context
const AuthContext = createContext<AuthContextType | null>(null);

// Provider component
type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [showMobileWarning, setShowMobileWarning] = useState<boolean>(false);
  const [isMobileDevice, setIsMobileDevice] = useState<boolean>(false);

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

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Login failed");
      }

      return await response.json();
    },
    onSuccess: (data: User) => {
      setUser(data);
      console.log("Login successful:", data);

      const mobileWarningShown = sessionStorage.getItem("mobileWarningShown");
      if (isMobileDevice && !mobileWarningShown) {
        setShowMobileWarning(true);
        sessionStorage.setItem("mobileWarningShown", "true");
      }
    },
    onError: (error: Error) => {
      console.error("Login failed:", error.message);
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (credentials: RegisterCredentials) => {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Registration failed");
      }

      return await response.json();
    },
    onSuccess: (data: User) => {
      setUser(data);
      console.log("Registration successful:", data);

      const mobileWarningShown = sessionStorage.getItem("mobileWarningShown");
      if (isMobileDevice && !mobileWarningShown) {
        setShowMobileWarning(true);
        sessionStorage.setItem("mobileWarningShown", "true");
      }
    },
  });

  // Google OAuth login mutation — supports web & native
  const googleLoginMutation = useMutation({
    mutationFn: async (data: { credential?: string; idToken?: string }) => {
      let url = "/api/auth/google";
      let payload: any = {};

      if (data.idToken) {
        // Mobile native flow
        url = "/api/mobile-login";
        payload = { idToken: data.idToken };
      } else if (data.credential) {
        // Web flow
        payload = { credential: data.credential };
      } else {
        throw new Error("No Google token provided");
      }

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Google login failed");
      }

      return await response.json();
    },
    onSuccess: (data: User) => {
      setUser(data);
      console.log("Google login successful:", data);

      const mobileWarningShown = sessionStorage.getItem("mobileWarningShown");
      if (isMobileDevice && !mobileWarningShown) {
        setShowMobileWarning(true);
        sessionStorage.setItem("mobileWarningShown", "true");
      }
    },
    onError: (error: Error) => {
      console.error("Google login failed:", error.message);
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Logout failed");
      }
    },
    onSuccess: () => {
      setUser(null);
      console.log("Logout successful");
    },
    onError: (error: Error) => {
      console.error("Logout failed:", error.message);
    },
  });

  const value = {
    user,
    loginMutation,
    registerMutation,
    googleLoginMutation,
    logoutMutation,
    showMobileWarning,
    setShowMobileWarning,
    isMobileDevice,
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
