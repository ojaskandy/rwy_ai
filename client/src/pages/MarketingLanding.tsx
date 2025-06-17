import { useState, useEffect } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Zap, 
  Target, 
  TrendingUp, 
  Users, 
  Play, 
  Star,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Camera,
  Brain,
  Trophy,
  Eye,
  Activity,
  Shield
} from "lucide-react";

export default function MarketingLanding() {
  const [currentFeature, setCurrentFeature] = useState(0);

  const features = [
    "AI Movement Detection",
    "Real-time Feedback", 
    "Form Perfection",
    "Progress Tracking"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [features.length]);

  const stats = [
    { number: "24/7", label: "AI Coach Available" },
    { number: "Real-time", label: "Movement Analysis" },
    { number: "Precision", label: "Form Feedback" }
  ];

  const benefits = [
    {
      icon: <Target className="w-6 h-6" />,
      title: "Perfect Your Form",
      description: "AI analyzes every movement for precision"
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Instant Feedback",
      description: "Get corrections in real-time"
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Track Progress",
      description: "See improvement over time"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-red-950/20 to-black text-white overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4">
        {/* Clean minimal background */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute top-20 left-20 w-32 h-32 bg-red-600/10 rounded-full blur-xl"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.2, 0.4, 0.2]
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute bottom-40 right-20 w-40 h-40 bg-red-500/8 rounded-full blur-2xl"
            animate={{
              scale: [1.1, 1, 1.1],
              opacity: [0.1, 0.3, 0.1]
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2
            }}
          />
        </div>

        <div className="relative z-10 text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-8 leading-tight">
              Master Every Move.{" "}
              <span className="bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
                Experience Precision Perfection
              </span>
              {" "}with Your Personal AI Coach.
            </h1>

            <div className="max-w-4xl mx-auto mb-12">
              <p className="text-xl md:text-2xl text-gray-300 mb-6 leading-relaxed">
                Imagine a <strong className="text-white">master instructor always on your shoulder</strong>, meticulously checking every detail and pushing you towards flawless execution.
              </p>
              <p className="text-xl md:text-2xl text-gray-300 leading-relaxed">
                CoachT brings this revolutionary, personalized AI guidance directly to your training, ensuring you conquer every form and achieve true mastery faster than ever.
              </p>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentFeature}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="mb-8"
              >
                <div className="inline-flex items-center gap-2 bg-gray-900/50 px-4 py-2 rounded-full border border-red-600/30">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-red-300 font-medium">{features[currentFeature]}</span>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/early">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg shadow-red-500/25 px-8 py-6 text-lg font-semibold group"
                >
                  Start Now
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              
              <Button 
                variant="outline" 
                size="lg" 
                className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white px-8 py-6 text-lg"
              >
                <Play className="mr-2 w-5 h-5" />
                Watch Demo
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* What CoachT Does */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-white">
              What CoachT Does
            </h2>
            <p className="text-xl md:text-2xl text-gray-300 leading-relaxed">
              CoachT uses cutting-edge AI to provide instant, intelligent feedback, helping you fix mistakes in real-time and unlock your full potential.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Core Components */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-white">
              How CoachT Empowers Your Training
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                icon: <Brain className="w-8 h-8" />,
                title: "Real-time AI Form Feedback",
                description: "Our advanced pose detection analyzes your every move, giving you precise visual cues and intelligent voice guidance from your personal AI master."
              },
              {
                icon: <Trophy className="w-8 h-8" />,
                title: "Dynamic Challenges",
                description: "Push your limits, dominate leaderboards, and prove your skills in thrilling, gamified challenges."
              },
              {
                icon: <Play className="w-8 h-8" />,
                title: "Start Live Routine (Train with Experts)",
                description: "Compare your live performance directly against our library of pre-loaded expert demonstrations, getting precise AI insights on your alignment with the pros."
              },
              {
                icon: <Target className="w-8 h-8" />,
                title: "Structured Workouts & Practice Library",
                description: "Access ready-to-go training routines to boost your fitness, and quickly check specific poses for instant form feedback."
              }
            ].map((component, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
                viewport={{ once: true }}
              >
                <Card className="bg-gray-900/30 border-gray-800 hover:border-red-600/50 transition-all duration-300 group h-full">
                  <CardHeader>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-red-600/20 rounded-lg flex items-center justify-center group-hover:bg-red-600/30 transition-colors">
                        <div className="text-red-400">
                          {component.icon}
                        </div>
                      </div>
                      <CardTitle className="text-white text-xl leading-tight">
                        {component.title}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-gray-300 text-base leading-relaxed">
                      {component.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-8 leading-tight">
              Ready to transform your training and achieve{" "}
              <span className="bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
                mastery?
              </span>
            </h2>
            <p className="text-2xl md:text-3xl font-bold text-white mb-12">
              Start Your FREE Journey with CoachT Today!
            </p>
            
            <Link href="/auth">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-xl shadow-red-500/30 px-16 py-8 text-2xl font-bold group transform hover:scale-105 transition-all duration-300"
              >
                Start Now
                <ArrowRight className="ml-3 w-8 h-8 group-hover:translate-x-2 transition-transform duration-300" />
              </Button>
            </Link>
            
            <p className="text-gray-400 mt-6 text-lg">
              No credit card required • Instant access
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-gray-800">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-gray-400">
            © 2025 CoachT. Revolutionizing martial arts training with AI.
          </p>
        </div>
      </footer>
    </div>
  );
}