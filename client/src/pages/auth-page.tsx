import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import MobileWarningDialog from "@/components/MobileWarningDialog";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import { GoogleAuth } from "@codetrix-studio/capacitor-google-auth";
import { Capacitor } from "@capacitor/core";

// Schemas for form validation
const registerSchema = z
  .object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
    beltColor: z.string().optional(),
    experienceTime: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

if (
  Capacitor.getPlatform() === "ios" ||
  Capacitor.getPlatform() === "android"
) {
  GoogleAuth.initialize({
    scopes: ["profile", "email"],
    clientId: "269594573382-27n2ur2h48vceeh3vd0k7dudnf2ak74c.apps.googleusercontent.com",
  });
}

export default function AuthPage() {
  const {
    user,
    registerMutation,
    googleLoginMutation,
    showMobileWarning,
    setShowMobileWarning,
  } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("login");
  const [isMobile, setIsMobile] = useState(false);

  const [loading, setLoading] = useState(true);
  const [typedText, setTypedText] = useState("");
  const [logoContrast, setLogoContrast] = useState(false);
  const [gradientVisible, setGradientVisible] = useState(false);

  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const isNative = Capacitor.isNativePlatform();

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

  useEffect(() => {
    if (user) {
      navigate("/app");
    }
  }, [user, navigate]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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

  const handleNativeGoogleLogin = async () => {
    try {
      await GoogleAuth.signOut();
      const user = await GoogleAuth.signIn();
      console.log("Google user:", user);
      await googleLoginMutation?.mutate({
        idToken: user.authentication.idToken,
      });
    } catch (error) {
      console.error("Native Google login failed:", error);
    }
  };

  const onRegisterSubmit = (data: RegisterFormValues) => {
    registerMutation.mutate(data);
  };

  if (user) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center relative">
        <motion.div
          className="w-full max-w-md px-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="border-red-900/30 bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-lg shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-green-400">✅ Successfully Logged In!</CardTitle>
              <CardDescription className="text-gray-300">Redirecting to your dashboard...</CardDescription>
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
              {user.email && <p className="text-gray-400 text-sm">{user.email}</p>}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center relative overflow-hidden">
      <MobileWarningDialog open={showMobileWarning} onOpenChange={setShowMobileWarning} />

      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
          <motion.div
            className="absolute inset-x-0 top-0 h-full bg-gradient-to-b from-red-500 via-red-600 to-red-700"
            initial={{ y: "-100%" }}
            animate={{ y: gradientVisible ? "0%" : "-100%" }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
          />
          <motion.div
            className={`relative z-20 flex flex-col items-center ${logoContrast ? "scale-110" : "scale-100"}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            <div className={`flex flex-col items-center ${logoContrast ? "ring-4 ring-black p-4 rounded-xl bg-red-600" : ""}`}>
              <div className={`h-24 w-24 rounded-full bg-gradient-to-br from-red-700 to-red-600 flex items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.6)] mb-4`}>
                <span className="material-icons text-white text-5xl">sports_martial_arts</span>
              </div>
              <h1 className="text-6xl md:text-8xl font-bold relative inline-block text-white">
                <span className="relative">
                  {typedText}
                  <span className="inline-block h-[0.8em] w-[3px] ml-[2px] bg-white animate-blink"></span>
                </span>
              </h1>
            </div>
          </motion.div>
        </div>
      )}

      {!loading && (
        <>
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

          <motion.div
            className="w-full max-w-md px-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="border-red-900/30 bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-lg">
              <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-2 bg-black/50 border-b border-gray-800 rounded-none">
                  <TabsTrigger value="login" className="py-3">Login</TabsTrigger>
                  <TabsTrigger value="register" className="py-3">Register</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <CardHeader>
                    <CardTitle className="text-xl sm:text-2xl font-bold">
                      <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-red-300">Login to Your Account</span>
                    </CardTitle>
                    <CardDescription className="text-gray-300">Continue with Google to access your CoachT dashboard</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center space-y-4">
                    {isNative ? (
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
                </TabsContent>

                <TabsContent value="register">
                  <CardHeader>
                    <CardTitle className="text-xl sm:text-2xl font-bold text-red-500">Create an Account</CardTitle>
                    <CardDescription className="text-gray-300">Register to save your training sessions and settings</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...registerForm}>
                      <form id="register-form" onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                        {/* All your fields kept exactly as you had them */}
                        {/* Truncated here for brevity in this snippet, but you keep all */}
                      </form>
                    </Form>
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" form="register-form" className="w-full">Create Account</Button>
                  </CardFooter>
                </TabsContent>
              </Tabs>
            </Card>
          </motion.div>
        </>
      )}
    </div>
  );
}
