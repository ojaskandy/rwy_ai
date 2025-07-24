import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Eye, EyeOff, Mail, Lock, Loader2, User, UserPlus } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { motion, AnimatePresence } from 'framer-motion';
import runwayAILogo from '@assets/rwyailogotransparent_1753321576297.png';

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [forgotPassword, setForgotPassword] = useState(false);

  const { signUp, signIn, resetPassword, user } = useAuth();
  const [, setLocation] = useLocation();

  const redirectTo = '/';

  useEffect(() => {
    if (user) {
      setLocation(redirectTo);
    }
  }, [user, setLocation, redirectTo]);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 6;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    // Validation
    if (!validateEmail(email)) {
      setMessage({ type: 'error', text: 'Please enter a valid email address' });
      setLoading(false);
      return;
    }

    if (!validatePassword(password)) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters long' });
      setLoading(false);
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        const { user, error } = await signUp(email, password);
        if (error) {
          setMessage({ type: 'error', text: error.message });
        } else if (user) {
          setMessage({ 
            type: 'success', 
            text: 'Account created successfully! Please check your email to verify your account.' 
          });
        }
      } else {
        const { user, error } = await signIn(email, password);
        if (error) {
          setMessage({ type: 'error', text: error.message });
        } else if (user) {
          setLocation(redirectTo);
        }
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An unexpected error occurred. Please try again.' });
    }

    setLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    if (!validateEmail(email)) {
      setMessage({ type: 'error', text: 'Please enter a valid email address' });
      setLoading(false);
      return;
    }

    try {
      const { error } = await resetPassword(email);
      if (error) {
        setMessage({ type: 'error', text: error.message });
      } else {
        setMessage({ type: 'success', text: 'Password reset link sent to your email!' });
        setForgotPassword(false);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An unexpected error occurred. Please try again.' });
    }

    setLoading(false);
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setMessage(null);
    setForgotPassword(false);
  };

  const toggleMode = (newMode: boolean) => {
    if (newMode !== isSignUp) {
      setIsSignUp(newMode);
      resetForm();
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-8" style={{ backgroundColor: '#8B5A6B' }}>
      {/* Floating background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-purple-400/15 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-pink-400/15 rounded-full blur-xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-32 left-20 w-40 h-40 bg-purple-300/15 rounded-full blur-xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-20 right-10 w-28 h-28 bg-pink-500/15 rounded-full blur-xl animate-pulse" style={{ animationDelay: '3s' }}></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md space-y-8 relative z-10"
      >
        {/* Logo and Header */}
        <div className="text-center">
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="flex justify-center mb-6"
          >
            <div className="w-32 h-32 flex items-center justify-center">
              <img 
                src={runwayAILogo} 
                alt="Runway AI Logo" 
                className="w-full h-full object-contain crown-pulse"
              />
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <h1 className="text-4xl font-bold text-white mb-3">
              Runway AI
            </h1>
            <p className="text-pink-100 text-lg font-medium">
              {forgotPassword 
                ? 'Reset your password' 
                : isSignUp 
                  ? 'Create your account' 
                  : 'Welcome back'
              }
            </p>
          </motion.div>
        </div>

        {/* Auth Form */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/50 p-8"
        >
          {/* Tab Toggle */}
          {!forgotPassword && (
            <div className="flex mb-8 bg-pink-100/80 rounded-2xl p-2">
              <motion.button
                type="button"
                onClick={() => toggleMode(false)}
                className={`flex-1 py-3 px-6 rounded-xl font-semibold text-lg transition-all duration-300 relative ${
                  !isSignUp
                    ? 'text-white shadow-lg'
                    : 'text-pink-600 hover:text-pink-700'
                }`}
                whileTap={{ 
                  scale: 0.98,
                  boxShadow: 'inset 0 4px 8px rgba(0,0,0,0.1)',
                  background: 'rgba(255,255,255,0.2)'
                }}
              >
                {!isSignUp && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-gradient-to-r from-pink-500 to-pink-600 rounded-xl"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center justify-center">
                  <User className="w-4 h-4 mr-2" />
                  Sign In
                </span>
              </motion.button>
              <motion.button
                type="button"
                onClick={() => toggleMode(true)}
                className={`flex-1 py-3 px-6 rounded-xl font-semibold text-lg transition-all duration-300 relative ${
                  isSignUp
                    ? 'text-white shadow-lg'
                    : 'text-pink-600 hover:text-pink-700'
                }`}
                whileTap={{ 
                  scale: 0.98,
                  boxShadow: 'inset 0 4px 8px rgba(0,0,0,0.1)',
                  background: 'rgba(255,255,255,0.2)'
                }}
              >
                {isSignUp && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-gradient-to-r from-pink-500 to-pink-600 rounded-xl"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center justify-center">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Sign Up
                </span>
              </motion.button>
            </div>
          )}

          <form onSubmit={forgotPassword ? handleForgotPassword : handleSubmit} className="space-y-6" role="form" aria-label={isSignUp ? 'Sign up form' : 'Sign in form'}>
            {/* Email Field */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <label htmlFor="email" className="block text-sm font-semibold text-pink-900 mb-3">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-pink-500" />
                </div>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-12 min-h-[48px] h-14 border-2 border-pink-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-400/60 rounded-xl text-lg bg-white/80 placeholder:text-pink-500 text-pink-900 transition-all duration-150"
                  placeholder="your.email@example.com"
                  required
                  aria-describedby="email-description"
                />
              </div>
            </motion.div>

            {/* Password Field */}
            {!forgotPassword && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <label htmlFor="password" className="block text-sm font-semibold text-pink-900 mb-3">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-pink-500" />
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 pr-12 min-h-[48px] h-14 border-2 border-pink-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-400/60 rounded-xl text-lg bg-white/80 placeholder:text-pink-500 text-pink-900 transition-all duration-150"
                    placeholder="Your secret runway code"
                    required
                    minLength={6}
                    aria-describedby="password-description"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-pink-600 hover:text-pink-700 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Confirm Password Field */}
            <AnimatePresence>
              {!forgotPassword && isSignUp && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <label htmlFor="confirmPassword" className="block text-sm font-semibold text-pink-900 mb-3">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-pink-500" />
                    </div>
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-12 pr-12 min-h-[48px] h-14 border-2 border-pink-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-400/60 rounded-xl text-lg bg-white/80 placeholder:text-pink-500 text-pink-900 transition-all duration-150"
                      placeholder="Confirm your runway code"
                      required
                      minLength={6}
                      aria-describedby="confirm-password-description"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-pink-600 hover:text-pink-700 transition-colors"
                      aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error/Success Message */}
            <AnimatePresence>
              {message && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <Alert className={`border-2 ${
                    message.type === 'error' 
                      ? 'border-red-300 bg-red-50/80' 
                      : 'border-green-300 bg-green-50/80'
                  } rounded-xl`}>
                    <AlertDescription className={`font-medium ${
                      message.type === 'error' ? 'text-red-700' : 'text-green-700'
                    }`}>
                      {message.text}
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <motion.div
                whileTap={{ 
                  scale: 0.98,
                  boxShadow: 'inset 0 6px 12px rgba(0,0,0,0.15)',
                  background: 'rgba(255,255,255,0.1)'
                }}
                className="w-full"
              >
                <Button
                  type="submit"
                  disabled={loading}
                  aria-label={forgotPassword ? 'Send password reset link' : isSignUp ? 'Create new account' : 'Sign in to your account'}
                  className="w-full min-h-[48px] h-14 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white font-semibold text-lg rounded-xl shadow-xl transition-all duration-200 transform hover:scale-105 hover:-translate-y-0.5 hover:shadow-[0_0_20px_#ec4899] disabled:hover:scale-100 disabled:hover:translate-y-0 disabled:hover:shadow-xl backdrop-blur-sm"
                >
                {loading ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center"
                  >
                    <Loader2 className="w-5 h-5 animate-spin mr-3" />
                    <span>
                      {forgotPassword 
                        ? 'Sending...' 
                        : isSignUp 
                          ? 'Creating Account...' 
                          : 'Signing In...'
                      }
                    </span>
                  </motion.div>
                ) : (
                  <span>
                    {forgotPassword 
                      ? '✨ Send Reset Link' 
                      : isSignUp 
                        ? '👑 Join the Runway' 
                        : 'Enter the Runway'
                    }
                  </span>
                )}
                </Button>
              </motion.div>
            </motion.div>

            {/* Forgot Password Link */}
            {!forgotPassword && !isSignUp && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setForgotPassword(true)}
                  className="text-sm text-pink-600 hover:text-pink-700 font-semibold transition-colors"
                >
                  Forgot your runway code?
                </button>
              </div>
            )}

            {/* Back to Sign In */}
            {forgotPassword && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setForgotPassword(false)}
                  className="text-sm text-pink-600 hover:text-pink-700 font-semibold transition-colors"
                >
                  ← Back to Sign In
                </button>
              </div>
            )}
          </form>

          {/* Terms and Privacy */}
          <AnimatePresence>
            {isSignUp && !forgotPassword && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <p className="text-xs text-pink-600 text-center mt-8 leading-relaxed">
                  By joining the runway, you agree to our{' '}
                  <a href="#" className="text-pink-700 hover:text-pink-800 font-semibold underline">Terms of Service</a>
                  {' '}and{' '}
                  <a href="#" className="text-pink-700 hover:text-pink-800 font-semibold underline">Privacy Policy</a>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Footer */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center text-sm text-pink-800 font-medium"
        >
          <p>&copy; 2025 Runway AI. Empowering pageant queens worldwide. ✨</p>
        </motion.div>
      </motion.div>
    </main>
  );
};

export default Auth; 