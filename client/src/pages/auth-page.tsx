import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import MobileWarningDialog from "@/components/MobileWarningDialog";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import { GoogleAuth } from "@codetrix-studio/capacitor-google-auth";
import { Capacitor } from "@capacitor/core";

// Profile setup schema
const profileSetupSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  username: z.string().min(3, "Username must be at least 3 characters").regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  taekwondoExperience: z.enum(["less_than_1_year", "1_3_years", "3_5_years", "5_plus_years"], {
    required_error: "Please select your taekwondo experience level"
  }),
});

type ProfileSetupFormValues = z.infer<typeof profileSetupSchema>;

// Initialize GoogleAuth for native platforms
if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android") {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || 
                   import.meta.env.VITE_IOS_GOOGLE_CLIENT_ID ||
                   "269594573382-27n2ur2h48vceeh3vd0k7dudnf2ak74c.apps.googleusercontent.com";

  GoogleAuth.initialize({
    scopes: ["profile", "email"],
    clientId: clientId,
  });
}

export default function AuthPage() {
  const {
    user,
    isCheckingSession,
    googleLoginMutation,
    completeProfileMutation,
    showMobileWarning,
    setShowMobileWarning,
  } = useAuth();
  const [, navigate] = useLocation();
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [typedText, setTypedText] = useState("");
  const [logoContrast, setLogoContrast] = useState(false);
  const [gradientVisible, setGradientVisible] = useState(false);

  const isNative = Capacitor.isNativePlatform();
  const isIOS = Capacitor.getPlatform() === "ios";

  const profileForm = useForm<ProfileSetupFormValues>({
    resolver: zodResolver(profileSetupSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      username: user?.username || "",
      taekwondoExperience: "less_than_1_year",
    },
  });

  useEffect(() => {
    // Only handle user navigation after session check is complete
    if (!isCheckingSession && user) {
      console.log("Auth check complete. User:", user);
      if (user.profileCompleted) {
        console.log("Profile completed, navigating to /app");
        navigate("/app", { replace: true });
      } else {
        console.log("Profile not completed, showing setup form");
        setShowProfileSetup(true);
        // Pre-fill form with existing data
        profileForm.setValue("fullName", user.fullName || "");
        profileForm.setValue("username", user.username || "");
      }
    }
  }, [user, isCheckingSession, navigate, profileForm]);

  useEffect(() => {
    let text = "CoachT";
    let currentIndex = 0;
    setGradientVisible(true);

    const typingInterval = setInterval(() => {
      if (currentIndex <= text.length) {
        setTypedText(text.substring(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
        setTimeout(() => {
          setLogoContrast(true);
          setTimeout(() => setLoading(false), 800);
        }, 400);
      }
    }, 150);

    return () => clearInterval(typingInterval);
  }, []);

  const handleGoogleSuccess = (credentialResponse: CredentialResponse) => {
    googleLoginMutation?.mutate(credentialResponse);
  };

  const handleGoogleError = () => {
    console.error("Google login failed");
  };

  const handleIOSBrowserLogin = async () => {
    try {
      const webLoginUrl = "https://www.coacht.xyz/auth";
      
      if ((window as any).Capacitor?.Plugins?.Browser) {
        await (window as any).Capacitor.Plugins.Browser.open({ 
          url: webLoginUrl,
          windowName: "_system"
        });
      } else {
        window.open(webLoginUrl, "_system", "location=yes");
      }
      
      setTimeout(() => {
        alert("🍎 iOS login coming soon — please use browser login for now.\n\nWe've opened the web login in Safari for you!");
      }, 500);
      
    } catch (error) {
      console.error("Failed to open browser:", error);
      alert("Unable to open browser. Please visit https://www.coacht.xyz/auth in Safari to log in.");
    }
  };

  const handleNativeGoogleLogin = async () => {
    try {
      await GoogleAuth.signOut();
      const user = await GoogleAuth.signIn();
      
      const idToken = user.authentication.idToken;
      if (!idToken) {
        throw new Error("No ID token received from Google");
      }

      const cleanToken = idToken.trim().replace(/\s/g, '');
      
      await googleLoginMutation?.mutate({
        idToken: cleanToken,
      });
    } catch (error) {
      console.error("Native Google login failed:", error);
    }
  };

  const onProfileSetupSubmit = (data: ProfileSetupFormValues) => {
    console.log("Submitting profile setup data:", data);
    completeProfileMutation?.mutate(data, {
      onSuccess: (updatedUser) => {
        console.log("Profile setup successful, user updated:", updatedUser);
        navigate("/app", { replace: true });
      },
      onError: (error) => {
        console.error("Profile setup failed:", error);
      }
    });
  };

  // Show loading while checking session or during animation
  if (loading || isCheckingSession) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-gradient-to-br from-red-900/20 via-black to-orange-900/20"
          style={{
            opacity: gradientVisible ? 1 : 0,
            transition: 'opacity 1s ease-in-out'
          }}
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 text-center"
        >
          <h1 
            className={`text-6xl md:text-8xl font-bold mb-8 transition-all duration-1000 ${
              logoContrast 
                ? 'bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-orange-400 drop-shadow-2xl' 
                : 'text-white drop-shadow-lg'
            }`}
            style={{
              filter: logoContrast ? 'drop-shadow(0 0 30px rgba(239, 68, 68, 0.5))' : 'none'
            }}
          >
            {typedText}
            <span className="animate-pulse">|</span>
          </h1>
        </motion.div>
      </div>
    );
  }

  if (showProfileSetup && user) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center relative">
        <motion.div
          className="w-full max-w-md px-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-red-300 mb-2">
              Welcome to CoachT!
            </h1>
            <p className="text-gray-400">Let's set up your profile to get started</p>
          </div>

          <Card className="border-red-900/30 bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-lg">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-red-500">Complete Your Profile</CardTitle>
              <CardDescription className="text-gray-300">
                Tell us a bit about yourself to personalize your training experience
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSetupSubmit)} className="space-y-4">
                  <FormField
                    control={profileForm.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Full Name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter your full name"
                            className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-400"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={profileForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Username</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Choose a username"
                            className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-400"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={profileForm.control}
                    name="taekwondoExperience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Taekwondo Experience</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white">
                              <SelectValue placeholder="Select your experience level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-gray-800 border-gray-700">
                            <SelectItem value="less_than_1_year" className="text-white hover:bg-gray-700">Less than 1 year</SelectItem>
                            <SelectItem value="1_3_years" className="text-white hover:bg-gray-700">1-3 years</SelectItem>
                            <SelectItem value="3_5_years" className="text-white hover:bg-gray-700">3-5 years</SelectItem>
                            <SelectItem value="5_plus_years" className="text-white hover:bg-gray-700">5+ years</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-medium py-3 rounded-full"
                    disabled={completeProfileMutation?.isPending}
                  >
                    {completeProfileMutation?.isPending ? "Setting up..." : "Complete Setup"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center relative">
      <MobileWarningDialog 
        open={showMobileWarning} 
        onOpenChange={setShowMobileWarning} 
      />
      
      <motion.div
        className="w-full max-w-md px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-red-300 mb-2">
            Welcome to CoachT
          </h1>
          <p className="text-gray-400">Your AI martial arts training companion</p>
        </div>

        <Card className="border-red-900/30 bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-lg">
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl font-bold">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-red-300">Ready to train?</span>
            </CardTitle>
            <CardDescription className="text-gray-300">
              {isIOS 
                ? "Please use browser login while we prepare iOS native login"
                : "Continue with Google to access your CoachT dashboard"
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            {isIOS ? (
              <div className="flex flex-col items-center space-y-3">
                <button
                  onClick={handleIOSBrowserLogin}
                  className="w-[300px] bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-3 px-6 rounded-full flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] shadow-lg"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>
                
                <div className="max-w-[300px] p-3 bg-amber-900/20 border border-amber-700/30 rounded-lg">
                  <p className="text-xs text-amber-200 text-center">
                    🍎 <strong>iOS users:</strong> Native login is coming soon! For now, we'll open Safari for you to log in securely.
                  </p>
                </div>
              </div>
            ) : isNative ? (
              <button
                onClick={handleNativeGoogleLogin}
                className="w-[300px] bg-[#4285f4] hover:bg-[#357ae8] text-white font-medium py-3 px-6 rounded-full flex items-center justify-center gap-3 transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>
            ) : (
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                text="continue_with"
                shape="pill"
                theme="filled_black"
                size="large"
                width={300}
              />
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
