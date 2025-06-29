import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import MobileWarningDialog from "@/components/MobileWarningDialog";
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';

// Schemas for form validation
const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
  beltColor: z.string().optional(),
  experienceTime: z.string().optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { user, registerMutation, googleLoginMutation, showMobileWarning, setShowMobileWarning } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("login");
  const [isMobile, setIsMobile] = useState(false);
  
  // Loading animation states
  const [loading, setLoading] = useState(true);
  const [typedText, setTypedText] = useState("");
  const [logoContrast, setLogoContrast] = useState(false);
  const [gradientVisible, setGradientVisible] = useState(false);
  
  // Password visibility
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  
  // Form handler for registration only
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      beltColor: "white",
      experienceTime: "less_than_1_year",
    },
  });
  
  // Check if user is already logged in
  useEffect(() => {
    if (user) {
      navigate("/app");  // Redirect to main app instead of root
    }
  }, [user, navigate]);
  
  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);


  
  // Animation sequence for loading
  useEffect(() => {
    let text = "CoachT";
    let currentIndex = 0;
    
    // Start gradient animation immediately
    setGradientVisible(true);
    
    const typingInterval = setInterval(() => {
      if (currentIndex <= text.length) {
        setTypedText(text.substring(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
        
        // Add logo contrast after typing
        setTimeout(() => {
          setLogoContrast(true);
          
          // Complete loading
          setTimeout(() => {
            setLoading(false);
          }, 800); // Delay before hiding loading screen
        }, 400); // Delay after typing before contrast effect
      }
    }, 150); // Speed of typing
    
    return () => clearInterval(typingInterval);
  }, []);
  
    // Google OAuth success handler
  const handleGoogleSuccess = (credentialResponse: CredentialResponse) => {
    // Check if we're in a Capacitor app and redirect to external browser
    const isCapacitor = !!(window as any).Capacitor;
    
    if (isCapacitor) {
      // Open external Safari to handle the OAuth flow
      window.open('https://www.coacht.xyz/auth', '_system');
      return;
    }
    
    // Normal web flow
    googleLoginMutation?.mutate(credentialResponse);
  };

  // Google OAuth error handler
  const handleGoogleError = () => {
    console.error('Google login failed');
  };
  
  // Form submission for registration
  const onRegisterSubmit = (data: RegisterFormValues) => {
    registerMutation.mutate(data);
  };

  // If user is logged in, show confirmation
  if (user) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center overflow-hidden relative">
        {/* Background gradients */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-0 w-1/3 h-1/3 bg-red-700/20 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-1/3 h-1/3 bg-red-700/20 rounded-full blur-[120px] translate-x-1/2 translate-y-1/2" />
          <div className="absolute top-1/2 left-1/2 w-1/3 h-1/3 bg-red-700/10 rounded-full blur-[150px] -translate-x-1/2 -translate-y-1/2" />
        </div>
        
        <motion.div
          className="w-full max-w-md px-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="border-red-900/30 bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-lg shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-green-400">
                ✅ Successfully Logged In!
              </CardTitle>
              <CardDescription className="text-gray-300">
                Redirecting to your dashboard...
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              {user.picture && (
                <img 
                  src={user.picture} 
                  alt="Profile" 
                  className="w-16 h-16 rounded-full mx-auto mb-4 border-2 border-red-500"
                />
              )}
              <p className="text-white text-lg mb-2">
                Welcome, <span className="font-semibold text-red-400">{user.name || user.username}</span>!
              </p>
              {user.email && (
                <p className="text-gray-400 text-sm">{user.email}</p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center overflow-hidden relative">
      {/* Background gradients */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-1/3 h-1/3 bg-red-700/20 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-1/3 h-1/3 bg-red-700/20 rounded-full blur-[120px] translate-x-1/2 translate-y-1/2" />
        <div className="absolute top-1/2 left-1/2 w-1/3 h-1/3 bg-red-700/10 rounded-full blur-[150px] -translate-x-1/2 -translate-y-1/2" />
      </div>
      
      {/* Mobile Warning Dialog */}
      <MobileWarningDialog
        open={showMobileWarning}
        onOpenChange={setShowMobileWarning}
      />
      
      {/* Loading screen */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black overflow-hidden">
          {/* Sweeping Red Gradient from Top to Bottom */}
          <motion.div
            className="absolute inset-x-0 top-0 h-full bg-gradient-to-b from-red-500 via-red-600 to-red-700"
            initial={{ y: "-100%" }}
            animate={{ y: gradientVisible ? "0%" : "-100%" }}
            transition={{ duration: 1.2, ease: "easeInOut" }} // Adjust duration as needed
          />

          {/* CoachT Logo that stays throughout animation */}
          <motion.div 
            className={`relative z-20 transition-all duration-500 ease-in-out flex flex-col items-center justify-center
              ${logoContrast ? 'scale-110' : 'scale-100'}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }} // Logo fades in after gradient starts
          >
            <div className={`flex flex-col items-center justify-center transition-all duration-500 
              ${logoContrast ? 'ring-4 ring-black p-4 rounded-xl bg-red-600' : ''}`}>
              {/* Logo icon above text */}
              <div className={`h-24 w-24 rounded-full bg-gradient-to-br from-red-700 to-red-600 flex items-center justify-center 
                shadow-[0_0_20px_rgba(220,38,38,0.6)] mb-4 transition-all duration-500
                ${logoContrast ? 'ring-2 ring-black' : ''}`}>
                <span className="material-icons text-white text-5xl">sports_martial_arts</span>
              </div>
              
              {/* CoachT Text with properly positioned cursor */}
              <h1 className="text-6xl md:text-8xl font-bold relative inline-block text-white">
                <span className="relative">
                  {typedText}
                  <span className="inline-block h-[0.8em] w-[3px] ml-[2px] align-middle bg-white animate-blink"></span>
                </span>
              </h1>
            </div>
          </motion.div>
        </div>
      )}
      
      {/* Main content - only show after loading */}
      {!loading && (
        <>
          {/* Logo */}
          <motion.div
            className="relative z-10 mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-full bg-gradient-to-br from-red-700 to-red-600 flex items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.6)]">
                <span className="material-icons text-white text-2xl">sports_martial_arts</span>
              </div>
              <h1 className="text-3xl font-bold text-white">CoachT</h1>
            </div>
          </motion.div>
          
          {/* Auth Card */}
          <motion.div
            className="w-full max-w-md px-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="border-red-900/30 bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-lg shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent pointer-events-none"></div>
              
              <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-2 bg-black/50 border-b border-gray-800 rounded-none w-full h-auto p-0">
                  <TabsTrigger 
                    value="login" 
                    className="data-[state=active]:bg-gradient-to-b data-[state=active]:from-red-700 data-[state=active]:to-red-800 data-[state=active]:text-white rounded-none py-3 text-gray-400"
                  >
                    Login
                  </TabsTrigger>
                  <TabsTrigger 
                    value="register" 
                    className="data-[state=active]:bg-gradient-to-b data-[state=active]:from-red-700 data-[state=active]:to-red-800 data-[state=active]:text-white rounded-none py-3 text-gray-400"
                  >
                    Register
                  </TabsTrigger>
                </TabsList>
                
                {/* Google OAuth Login */}
                <TabsContent value="login" className="m-0">
                  <CardHeader>
                    <CardTitle className="text-xl sm:text-2xl font-bold">
                      <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-red-300">
                        Login to Your Account
                      </span>
                    </CardTitle>
                    <CardDescription className="text-sm sm:text-base text-gray-300">
                      Continue with Google to access your CoachT dashboard
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="flex flex-col items-center space-y-4">
                    {/* Google Login Button - Always displayed */}
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={handleGoogleError}
                      text="continue_with"
                      shape="pill"
                      theme="filled_black"
                      size="large"
                      width={300}
                    />
                    
                    {/* Display Google login error */}
                    {googleLoginMutation?.isError && (
                      <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-3 w-full">
                        <div className="flex items-center">
                          <span className="material-icons text-red-400 mr-2">error</span>
                          <span className="text-red-300 text-sm">
                            {googleLoginMutation.error?.message || 'Google login failed'}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {/* Loading state */}
                    {googleLoginMutation?.isPending && (
                      <div className="flex items-center text-gray-300">
                        <span className="material-icons animate-spin mr-2">autorenew</span>
                        Signing you in...
                      </div>
                    )}
                  </CardContent>
                </TabsContent>
                
                {/* Register Form */}
                <TabsContent value="register" className="m-0">
                  <CardHeader>
                    <CardTitle className="text-xl sm:text-2xl font-bold text-red-500">
                      Create an Account
                    </CardTitle>
                    <CardDescription className="text-sm sm:text-base text-gray-300">
                      Register to save your training sessions and settings
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <Form {...registerForm}>
                      <form id="register-form" onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                        <FormField
                          control={registerForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white">Username</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Choose a username" 
                                  {...field} 
                                  className="bg-gray-800/70 border-gray-700/50 text-white focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30"
                                />
                              </FormControl>
                              <FormMessage className="text-red-400" />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={registerForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white">Email Address</FormLabel>
                              <FormControl>
                                <Input 
                                  type="email"
                                  placeholder="Enter your email address" 
                                  {...field} 
                                  className="bg-gray-800/70 border-gray-700/50 text-white focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30"
                                />
                              </FormControl>
                              <FormMessage className="text-red-400" />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={registerForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white">Password</FormLabel>
                              <div className="relative">
                                <FormControl>
                                  <Input 
                                    type={showRegisterPassword ? "text" : "password"}
                                    placeholder="Create a password" 
                                    {...field}
                                    className="bg-gray-800/70 border-gray-700/50 text-white focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30 pr-10"
                                  />
                                </FormControl>
                                <button 
                                  type="button"
                                  onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                                >
                                  <span className="material-icons text-xl">
                                    {showRegisterPassword ? "visibility_off" : "visibility"}
                                  </span>
                                </button>
                              </div>
                              <FormMessage className="text-red-400" />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={registerForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white">Confirm Password</FormLabel>
                              <FormControl>
                                <Input 
                                  type="password"
                                  placeholder="Confirm your password" 
                                  {...field}
                                  className="bg-gray-800/70 border-gray-700/50 text-white focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30"
                                />
                              </FormControl>
                              <FormMessage className="text-red-400" />
                            </FormItem>
                          )}
                        />
                        
                        {/* Belt and Experience - only on desktop */}
                        {!isMobile && (
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={registerForm.control}
                              name="beltColor"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-white">Belt Color</FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger className="bg-gray-800/70 border-gray-700/50 text-white focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30">
                                        <SelectValue placeholder="Select belt" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="bg-gray-800 border-gray-700 text-white">
                                      <SelectItem value="white">White</SelectItem>
                                      <SelectItem value="yellow">Yellow</SelectItem>
                                      <SelectItem value="orange">Orange</SelectItem>
                                      <SelectItem value="green">Green</SelectItem>
                                      <SelectItem value="blue">Blue</SelectItem>
                                      <SelectItem value="red">Red</SelectItem>
                                      <SelectItem value="black">Black</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage className="text-red-400" />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={registerForm.control}
                              name="experienceTime"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-white">Experience</FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger className="bg-gray-800/70 border-gray-700/50 text-white focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30">
                                        <SelectValue placeholder="Select experience" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="bg-gray-800 border-gray-700 text-white">
                                      <SelectItem value="less_than_1_year">Less than 1 year</SelectItem>
                                      <SelectItem value="1_to_3_years">1-3 years</SelectItem>
                                      <SelectItem value="3_to_5_years">3-5 years</SelectItem>
                                      <SelectItem value="5_plus_years">5+ years</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage className="text-red-400" />
                                </FormItem>
                              )}
                            />
                          </div>
                        )}
                      </form>
                    </Form>
                  </CardContent>
                  
                  <CardFooter className="flex flex-col gap-4">
                    <Button 
                      type="submit"
                      form="register-form"
                      className="w-full bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white py-5"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? (
                        <div className="flex items-center">
                          <span className="material-icons animate-spin mr-2">autorenew</span>
                          Creating Account...
                        </div>
                      ) : (
                        <>
                          <span className="material-icons mr-2">person_add</span>
                          Create Account
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </TabsContent>
              </Tabs>
            </Card>
          </motion.div>
          
          {/* Feature cards - only show on desktop */}
          {!isMobile && (
            <motion.div
              className="mt-8 w-full max-w-4xl px-4 grid grid-cols-1 md:grid-cols-3 gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="p-5 rounded-2xl backdrop-blur-lg border border-red-500/20 bg-gradient-to-br from-gray-900/80 to-black/80 shadow-lg hover:scale-105 transition-transform duration-300">
                <div className="mb-3 h-10 w-10 rounded-full bg-red-700/20 flex items-center justify-center">
                  <span className="material-icons text-red-500">analytics</span>
                </div>
                <h3 className="text-lg font-semibold text-red-400 mb-2">Real-time Form Analysis</h3>
                <p className="text-sm text-gray-300">Perfect your Taekwondo stances with AI-powered pose tracking</p>
              </div>
              
              <div className="p-5 rounded-2xl backdrop-blur-lg border border-red-500/20 bg-gradient-to-br from-gray-900/80 to-black/80 shadow-lg hover:scale-105 transition-transform duration-300">
                <div className="mb-3 h-10 w-10 rounded-full bg-red-700/20 flex items-center justify-center">
                  <span className="material-icons text-red-500">compare</span>
                </div>
                <h3 className="text-lg font-semibold text-red-400 mb-2">Comparison Training</h3>
                <p className="text-sm text-gray-300">Compare your technique with reference performances</p>
              </div>
              
              <div className="p-5 rounded-2xl backdrop-blur-lg border border-red-500/20 bg-gradient-to-br from-gray-900/80 to-black/80 shadow-lg hover:scale-105 transition-transform duration-300">
                <div className="mb-3 h-10 w-10 rounded-full bg-red-700/20 flex items-center justify-center">
                  <span className="material-icons text-red-500">insights</span>
                </div>
                <h3 className="text-lg font-semibold text-red-400 mb-2">Performance Metrics</h3>
                <p className="text-sm text-gray-300">Track improvement with detailed analysis reports</p>
              </div>
            </motion.div>
          )}
          
          {/* Footer */}
          <motion.div
            className="mt-8 text-center text-gray-500 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            © 2025 CoachT. All rights reserved.
          </motion.div>
        </>
      )}
    </div>
  );
}