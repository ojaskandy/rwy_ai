import React from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { LogIn, UserPlus } from 'lucide-react';

interface AuthButtonProps {
  variant?: 'signin' | 'signup';
  className?: string;
}

const AuthButton: React.FC<AuthButtonProps> = ({ 
  variant = 'signin', 
  className = '' 
}) => {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Don't show button if user is already authenticated
  if (user) {
    return null;
  }

  const handleClick = () => {
    setLocation('/auth');
  };

  return (
    <Button
      onClick={handleClick}
      className={`${className} bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium shadow-lg transition-all duration-200 transform hover:scale-105`}
    >
      {variant === 'signup' ? (
        <>
          <UserPlus className="w-4 h-4 mr-2" />
          Sign Up
        </>
      ) : (
        <>
          <LogIn className="w-4 h-4 mr-2" />
          Sign In
        </>
      )}
    </Button>
  );
};

export default AuthButton; 