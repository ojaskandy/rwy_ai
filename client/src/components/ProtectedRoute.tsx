import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect to auth immediately if not authenticated (after loading)
  useEffect(() => {
    if (!loading && !user) {
      setLocation('/auth');
    }
  }, [loading, user, setLocation]);

  // Show loading spinner while checking authentication with pink theme
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FFC5D3' }}>
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-pink-600 to-pink-700 rounded-xl flex items-center justify-center shadow-lg mb-4 mx-auto animate-pulse">
            <span className="text-2xl">✈️</span>
          </div>
          <p className="text-pink-800 font-medium">Loading Runway AI...</p>
        </div>
      </div>
    );
  }

  // Still loading auth or redirecting
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FFC5D3' }}>
        <div className="text-center">
          <p className="text-pink-800 font-medium">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // User is authenticated, render children
  return <>{children}</>;
};

export default ProtectedRoute; 