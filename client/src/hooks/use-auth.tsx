import { useState, createContext, useContext, ReactNode, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { CredentialResponse } from '@react-oauth/google';

// Define types for auth
type User = {
  id: number;
  username: string;
  email?: string;
  name?: string;
  picture?: string;
  authProvider?: 'local' | 'google';
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
      // Check screen size
      const isMobileBySize = window.innerWidth < 768;
      
      // Check user agent for mobile devices
      const isMobileByAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
      
      // We treat iPads as tablets (acceptable), so exclude them from warning
      const isIPad = /iPad/i.test(navigator.userAgent);
      
      setIsMobileDevice(isMobileBySize && (isMobileByAgent && !isIPad));
    };
    
    checkMobileDevice();
    
    // Add resize listener
    window.addEventListener("resize", checkMobileDevice);
    return () => window.removeEventListener("resize", checkMobileDevice);
  }, []);
  
  // Real login mutation that calls the server
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      console.log('Login attempt:', credentials);
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
        credentials: 'include', // Include cookies for session
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }
      
      return await response.json();
    },
    onSuccess: (data: User) => {
      setUser(data);
      console.log('Login successful:', data);
      
      // Show mobile warning if on a mobile device and warning hasn't been shown
      // We check sessionStorage to ensure it only shows once per session
      const mobileWarningShown = sessionStorage.getItem('mobileWarningShown');
      if (isMobileDevice && !mobileWarningShown) {
        setShowMobileWarning(true);
        sessionStorage.setItem('mobileWarningShown', 'true');
      }
    },
    onError: (error: Error) => {
      console.error('Login failed:', error.message);
      // Error will be handled by the form component
    }
  });
  
  // Real register mutation that calls the server
  const registerMutation = useMutation({
    mutationFn: async (credentials: RegisterCredentials) => {
      console.log('Register attempt:', credentials);
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Registration failed');
      }
      
      return await response.json();
    },
    onSuccess: (data: User) => {
      setUser(data);
      console.log('Registration successful:', data);
      
      // Show mobile warning if on a mobile device and warning hasn't been shown
      // We check sessionStorage to ensure it only shows once per session
      const mobileWarningShown = sessionStorage.getItem('mobileWarningShown');
      if (isMobileDevice && !mobileWarningShown) {
        setShowMobileWarning(true);
        sessionStorage.setItem('mobileWarningShown', 'true');
      }
    }
  });

  // Google OAuth login mutation
  const googleLoginMutation = useMutation({
    mutationFn: async (credentialResponse: CredentialResponse) => {
      console.log('Google login attempt');
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ credential: credentialResponse.credential }),
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Google login failed');
      }
      
      return await response.json();
    },
    onSuccess: (data: User) => {
      setUser(data);
      console.log('Google login successful:', data);
      
      // Show mobile warning if on a mobile device and warning hasn't been shown
      const mobileWarningShown = sessionStorage.getItem('mobileWarningShown');
      if (isMobileDevice && !mobileWarningShown) {
        setShowMobileWarning(true);
        sessionStorage.setItem('mobileWarningShown', 'true');
      }
    },
    onError: (error: Error) => {
      console.error('Google login failed:', error.message);
    }
  });

  // Real logout mutation that calls the server
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Logout failed');
      }
    },
    onSuccess: () => {
      setUser(null);
      console.log('Logout successful');
    },
    onError: (error: Error) => {
      console.error('Logout failed:', error.message);
    }
  });
  
  const value = {
    user,
    loginMutation,
    registerMutation,
    googleLoginMutation,
    logoutMutation,
    showMobileWarning,
    setShowMobileWarning,
    isMobileDevice
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook for using the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}