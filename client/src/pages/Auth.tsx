import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { Eye, EyeOff, Mail, Lock, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { motion, AnimatePresence } from 'framer-motion';
import rwyaiHomeImage from '@assets/rwyai_home.png'; // Import the rwyai_home.png

const Auth = () => {
  const [authMode, setAuthMode] = useState<'landing' | 'signIn' | 'signUp' | 'forgotPassword'>('landing');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [agreedToPolicy, setAgreedToPolicy] = useState(false);

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

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setMessage(null);
    setAgreedToPolicy(false);
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

    if (authMode === 'signUp' && password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      setLoading(false);
      return;
    }

    if (authMode === 'signUp' && !agreedToPolicy) {
      setMessage({ type: 'error', text: 'Please agree to our Privacy Policy to continue' });
      setLoading(false);
      return;
    }

    try {
      if (authMode === 'signUp') {
        const { user: newUser, error } = await signUp(email, password);
        if (error) {
          setMessage({ type: 'error', text: error.message });
        } else if (newUser) {
          setMessage({
            type: 'success',
            text: 'Account created successfully! Please check your email to verify your account.'
          });
        }
      } else if (authMode === 'signIn') {
        const { user: loggedInUser, error } = await signIn(email, password);
        if (error) {
          setMessage({ type: 'error', text: error.message });
        } else if (loggedInUser) {
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
        setAuthMode('signIn'); // Go back to sign in after sending reset link
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An unexpected error occurred. Please try again.' });
    }

    setLoading(false);
  };

const whyRunwayAICards = [
  {
    text: "We all need a little help",
    highlight: "before the spotlight hits.",
    emoji: "💫"
  },
  {
    text: "Runway AI is like your pageant bestie — giving sweet, honest feedback on your walk, your answers,",
    highlight: "and everything in between.",
    emoji: "💁‍♀️"
  },
  {
    text: "It's not about being perfect, it's about",
    highlight: "growing with every step (in heels, of course).",
    emoji: "👠"
  },
  {
    text: "We're not flawless —",
    highlight: "but we're pretty fabulous trying.",
    emoji: "✨"
  }
];

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-8" style={{ backgroundColor: '#FFB6C1' }}>
      {/* Remove floating background elements */}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-10 min-h-[calc(100vh-64px)] flex flex-col justify-between items-center"
      >
        {/* Animation Container - top 2/3rds, initially just pink background */}
        <div className="flex-grow flex items-center justify-center relative w-full h-full">
          <AnimatePresence>
            {authMode === 'landing' && (
              <motion.img
                key="rwyai-home-animation"
                src={rwyaiHomeImage}
                alt="Runway AI Home Image"
                initial={{ opacity: 0, x: 0, y: 0, scale: 1 }}
                animate={{
                  opacity: [0, 1, 1, 1, 0],
                  x: [0, 0, 0, 0, 0],
                  y: [0, 0, 0, 0, 0],
                  scale: [1, 1, 1.5, 1.5, 1.5]
                }}
                transition={{
                  duration: 5,
                  ease: [0.42, 0, 0.58, 1],
                  times: [0, 0.1, 0.3, 0.5, 1],
                  delay: 1
                }}
                className="w-96 h-96 object-contain mt-12"
              />
            )}
          </AnimatePresence>

          {authMode === 'landing' && (
            <motion.div
              key="why-runway-ai"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 4.5 }}
              className="absolute top-[7%] left-[12%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center space-y-4 w-full max-w-xs px-4 py-4"
            >
              <div className="space-y-4 w-full">
                {whyRunwayAICards.map((card, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: index % 2 === 0 ? -100 : 100, rotate: 0 }}
                    animate={{
                      opacity: 1,
                      x: 0,
                      rotate: index % 2 === 0 ? -2 : 2
                    }}
                    transition={{
                      duration: 0.8,
                      delay: 4.5 + index * 0.3,
                      type: "spring",
                      stiffness: 100
                    }}
                    viewport={{ once: true, margin: "-10%" }}
                    whileHover={{
                      scale: 1.05,
                      rotate: index % 2 === 0 ? -3 : 3,
                      transition: { duration: 0.3 }
                    }}
                    className={`max-w-sm ${index % 2 === 0 ? 'ml-0 mr-auto' : 'ml-auto mr-0'} bg-white/95 backdrop-blur-sm rounded-3xl p-3 shadow-xl border border-pink-200 hover:shadow-2xl transition-all duration-300`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-xl flex-shrink-0">{card.emoji}</div>
                      <div>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {card.text}{" "}
                          <span className="text-pink-600 font-bold bg-pink-100 px-2 py-1 rounded-lg text-sm">
                            {card.highlight}
                          </span>
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          <AnimatePresence mode="popLayout">
            {authMode !== 'landing' && (
              <motion.div
                key="auth-form-view"
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ 
                  duration: 0.4, 
                  ease: [0.22, 1, 0.36, 1],
                  scale: { type: "spring", stiffness: 150, damping: 15 }
                }}
                className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-none border-none p-8 min-w-80 max-w-sm space-y-6 flex flex-col items-center"
              >
                {/* Back button for form views */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ 
                    duration: 0.3, 
                    ease: "easeOut", 
                    delay: 0.1 
                  }}
                  className="self-start"
                >
                  <Button
                    onClick={() => { setAuthMode('landing'); resetForm(); }}
                    variant="ghost"
                    className="text-pink-600 hover:text-pink-700 p-2 text-sm font-semibold rounded-full flex items-center gap-1 transition-all hover:bg-pink-100"
                  >
                    <motion.span
                      whileHover={{ x: -3 }}
                      transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    >←</motion.span> Back
                  </Button>
                </motion.div>

                <div className="text-center mb-6">
                  <motion.h1
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-3xl font-bold text-pink-800 mb-2"
                  >
                    {authMode === 'forgotPassword'
                      ? 'Reset Your Password'
                      : authMode === 'signUp'
                      ? 'Create Your Account'
                      : 'Welcome Back'
                    }
                  </motion.h1>
                  {authMode !== 'signIn' && (
                    <p className="text-pink-600 text-base">
                      {authMode === 'forgotPassword'
                        ? 'Enter your email to receive a reset link.'
                        : authMode === 'signUp'
                        ? 'Enter the world of Runway AI.'
                        : 'Sign in to continue your journey.'
                      }
                    </p>
                  )}
                </div>

                <form onSubmit={authMode === 'forgotPassword' ? handleForgotPassword : handleSubmit} className="space-y-6 w-full" role="form" aria-label={authMode === 'signUp' ? 'Sign up form' : 'Sign in form'}>
                  {/* Email Field */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <label htmlFor="email" className="sr-only">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-500" />
                      </div>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-12 min-h-[48px] h-14 border-2 border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-400/60 rounded-xl text-lg bg-gray-100 placeholder:text-gray-500 text-gray-900 transition-all duration-150"
                        placeholder="Email Address"
                        required
                        aria-describedby="email-description"
                      />
                    </div>
                  </motion.div>

                  {/* Password Field */}
                  {authMode !== 'forgotPassword' && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      <label htmlFor="password" className="sr-only">
                        Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Lock className="h-5 w-5 text-gray-500" />
                        </div>
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-12 pr-12 min-h-[48px] h-14 border-2 border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-400/60 rounded-xl text-lg bg-gray-100 placeholder:text-gray-500 text-gray-900 transition-all duration-150"
                          placeholder="Password"
                          required
                          minLength={6}
                          aria-describedby="password-description"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-600 hover:text-gray-800 transition-colors"
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
                    {authMode === 'signUp' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <label htmlFor="confirmPassword" className="sr-only">
                          Confirm Password
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Lock className="h-5 w-5 text-gray-500" />
                          </div>
                          <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="pl-12 pr-12 min-h-[48px] h-14 border-2 border-gray-300 focus:border-pink-500 focus:ring-2 focus:ring-pink-400/60 rounded-xl text-lg bg-gray-100 placeholder:text-gray-500 text-gray-900 transition-all duration-150"
                            placeholder="Confirm Password"
                            required
                            minLength={6}
                            aria-describedby="confirm-password-description"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-600 hover:text-gray-800 transition-colors"
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

                  {/* Privacy Policy Agreement */}
                  <AnimatePresence>
                    {authMode === 'signUp' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-4"
                      >
                        <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                          <Checkbox
                            id="privacy-agreement"
                            checked={agreedToPolicy}
                            onCheckedChange={(checked) => setAgreedToPolicy(checked as boolean)}
                            className="mt-1 h-5 w-5 border-2 border-pink-500 data-[state=checked]:bg-pink-500 data-[state=checked]:border-pink-500"
                            required={authMode === 'signUp'}
                          />
                          <label
                            htmlFor="privacy-agreement"
                            className="text-sm text-gray-800 leading-relaxed cursor-pointer"
                          >
                            I agree to the{' '}
                            <Link
                              href="/privacy"
                              className="text-pink-600 hover:text-pink-700 font-semibold underline"
                              target="_blank"
                            >
                              Terms of Service
                            </Link>
                            {' '}and{' '}
                            <Link
                              href="/privacy"
                              className="text-pink-600 hover:text-pink-700 font-semibold underline"
                              target="_blank"
                            >
                              Privacy Policy
                            </Link>
                            {' '}and understand how my data will be collected and used.
                          </label>
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
                        <Alert className={`border-2 ${message.type === 'error' ? 'border-red-300 bg-red-50/80' : 'border-green-300 bg-green-50/80'} rounded-xl`}>
                          <AlertDescription className={`font-medium ${message.type === 'error' ? 'text-red-700' : 'text-green-700'}`}>
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
                        aria-label={authMode === 'forgotPassword' ? 'Send password reset link' : authMode === 'signUp' ? 'Create new account' : 'Sign in to your account'}
                        className="w-full min-h-[48px] h-14 bg-pink-600 hover:bg-pink-700 text-white font-semibold text-lg rounded-xl shadow-xl transition-all duration-200 transform hover:scale-105 hover:-translate-y-0.5 hover:shadow-[0_0_20px_#ec4899] disabled:hover:scale-100 disabled:hover:translate-y-0 disabled:hover:shadow-xl backdrop-blur-sm"
                      >
                        {loading ? (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-center"
                          >
                            <Loader2 className="w-5 h-5 animate-spin mr-3" />
                            <span>
                              {authMode === 'forgotPassword'
                                ? 'Sending...' 
                                : authMode === 'signUp'
                                ? 'Preparing Your Crown...' 
                                : 'Entering the Spotlight...'}
                            </span>
                          </motion.div>
                        ) : (
                          <span>
                            {authMode === 'forgotPassword'
                              ? '✨ Send Reset Link'
                              : authMode === 'signUp'
                              ? '👑 Create Account'
                              : 'Enter the Runway'}
                          </span>
                        )}
                      </Button>
                    </motion.div>
                  </motion.div>

                  {/* Forgot Password Link */}
                  {authMode === 'signIn' && (
                    <div className="text-center mt-4">
                      <button
                        type="button"
                        onClick={() => { setAuthMode('forgotPassword'); resetForm(); }}
                        className="text-sm text-pink-600 hover:text-pink-700 font-semibold transition-colors"
                      >
                        Forgot your runway code?
                      </button>
                    </div>
                  )}

                  {/* Back to Sign In / Sign Up toggle */}
                  {authMode === 'forgotPassword' && (
                    <div className="text-center mt-4">
                      <button
                        type="button"
                        onClick={() => { setAuthMode('signIn'); resetForm(); }}
                        className="text-sm text-pink-600 hover:text-pink-700 font-semibold transition-colors"
                      >
                        ← Back to Sign In
                      </button>
                    </div>
                  )}
                  {(authMode === 'signIn' || authMode === 'signUp') && (
                    <div className="text-center mt-4">
                      {authMode === 'signIn' ? (
                        <p className="text-sm text-pink-800">
                          Don't have an account?{' '}
                          <Link
                            href="#"
                            onClick={() => { setAuthMode('signUp'); resetForm(); }}
                            className="text-pink-600 hover:text-pink-700 font-semibold underline"
                          >
                            Sign Up
                          </Link>
                        </p>
                      ) : (
                        <p className="text-sm text-pink-800">
                          Already have an account?{' '}
                          <Link
                            href="#"
                            onClick={() => { setAuthMode('signIn'); resetForm(); }}
                            className="text-pink-600 hover:text-pink-700 font-semibold underline"
                          >
                            Sign In
                          </Link>
                        </p>
                      )}
                    </div>
                  )}
                </form>

                {/* Terms and Privacy - Removed duplicate */}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {/* Content - bottom 1/3rd */}
        <AnimatePresence mode="wait">
          {authMode === 'landing' && (
            <motion.div
              key="landing-content"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
              transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
              className="flex flex-col items-center text-center space-y-8 w-full px-4 pt-16 pb-4"
              style={{ minHeight: '33vh' }} // Ensure it occupies bottom 1/3rd
            >
              <h1 className="text-5xl font-extrabold text-gray-900 leading-tight tracking-tighter">
                Win Your Crown
              </h1>
              
              <motion.div
                whileTap={{
                  scale: 0.98,
                  boxShadow: 'inset 0 4px 8px rgba(0,0,0,0.1)',
                  background: 'rgba(0,0,0,0.1)'
                }}
                className="w-full max-w-xs"
              >
                <Button
                  onClick={() => { setAuthMode('signUp'); resetForm(); }}
                  className="w-full min-h-[64px] h-16 bg-black hover:bg-gray-800 text-white font-bold text-xl rounded-full shadow-lg transition-all duration-300 tracking-wide uppercase"
                >
                  Get Started
                </Button>
              </motion.div>

              <p className="text-base text-gray-600 mt-4">
                Already have an account?{' '}
                <Link
                  href="#"
                  onClick={() => { setAuthMode('signIn'); resetForm(); }}
                  className="text-pink-600 hover:text-pink-700 font-semibold underline"
                >
                  Sign In
                </Link>
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer (always visible) */}
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0 }}
          className="text-center text-sm text-pink-800 font-medium pb-4"
        >
          <p>&copy; 2025 Runway AI. Empowering pageant queens worldwide. ✨</p>
        </motion.div>
      </motion.div>
    </main>
  );
};

export default Auth; 