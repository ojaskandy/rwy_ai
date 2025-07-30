import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Alert, AlertDescription } from '@/components/ui/alert';

const AuthCallback = () => {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          setStatus('error');
          setMessage(error.message || 'Authentication failed');
          return;
        }

        if (data?.session) {
          setStatus('success');
          setMessage('Authentication successful! Redirecting...');
          
          // Wait a moment to show success message, then redirect
          setTimeout(() => {
            setLocation('/');
          }, 2000);
        } else {
          // Handle the URL fragment for email confirmation
          const { error: sessionError } = await supabase.auth.getSession();
          if (sessionError) {
            setStatus('error');
            setMessage('Failed to verify email. Please try again.');
          } else {
            setStatus('success');
            setMessage('Email verified successfully! You can now sign in.');
            setTimeout(() => {
              setLocation('/auth');
            }, 2000);
          }
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setStatus('error');
        setMessage('An unexpected error occurred. Please try again.');
      }
    };

    handleAuthCallback();
  }, [setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
            <h2 className="text-xl font-semibold mb-2">Verifying...</h2>
            <p className="text-gray-600">Please wait while we verify your authentication.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
            <h2 className="text-xl font-semibold mb-2 text-green-700">Success!</h2>
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-800">
                {message}
              </AlertDescription>
            </Alert>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="h-12 w-12 mx-auto mb-4 text-red-600" />
            <h2 className="text-xl font-semibold mb-2 text-red-700">Error</h2>
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">
                {message}
              </AlertDescription>
            </Alert>
            <button
              onClick={() => setLocation('/auth')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Go to Sign In
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthCallback; 