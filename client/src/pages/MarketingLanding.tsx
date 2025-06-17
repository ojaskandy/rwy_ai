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
        {/* Enhanced Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Main glowing orbs */}
          <motion.div
            className="absolute top-20 left-20 w-32 h-32 bg-red-600/20 rounded-full blur-xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute bottom-40 right-20 w-40 h-40 bg-red-500/15 rounded-full blur-2xl"
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.2, 0.5, 0.2]
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1
            }}
          />
          
          {/* Floating martial arts icons */}
          <motion.div
            className="absolute top-32 right-32 text-red-400/30"
            animate={{
              y: [-10, 10, -10],
              rotate: [0, 5, 0]
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Target className="w-16 h-16" />
          </motion.div>
          
          <motion.div
            className="absolute bottom-32 left-32 text-red-400/30"
            animate={{
              y: [10, -10, 10],
              rotate: [0, -5, 0]
            }}
            transition={{
              duration: 7,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5
            }}
          >
            <Activity className="w-12 h-12" />
          </motion.div>
          
          <motion.div
            className="absolute top-1/2 left-16 text-red-400/20"
            animate={{
              x: [-5, 5, -5],
              y: [-5, 5, -5]
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1
            }}
          >
            <Brain className="w-10 h-10" />
          </motion.div>
          
          {/* Geometric patterns */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-1/4 left-1/4 w-1 h-32 bg-red-500 rotate-45 transform origin-bottom"></div>
            <div className="absolute top-1/3 right-1/4 w-1 h-24 bg-red-400 rotate-12 transform origin-bottom"></div>
            <div className="absolute bottom-1/4 left-1/3 w-1 h-28 bg-red-600 -rotate-45 transform origin-bottom"></div>
          </div>
        </div>

        <div className="relative z-10 text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Badge className="mb-6 bg-red-600/20 text-red-300 border-red-600/30 px-4 py-2">
              <Sparkles className="w-4 h-4 mr-2" />
              Revolutionary AI Training
            </Badge>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Master{" "}
              <span className="bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
                Martial Arts
              </span>
              <br />
              with AI Precision
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Transform your martial arts training with AI-powered movement analysis and real-time coaching feedback.
            </p>

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

      {/* Stats Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-bold text-red-400 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-400 text-lg">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 relative">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-10 text-red-500">
            <Shield className="w-24 h-24" />
          </div>
          <div className="absolute bottom-20 right-10 text-red-500">
            <Trophy className="w-32 h-32" />
          </div>
        </div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Why Choose{" "}
              <span className="bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
                CoachT
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-8">
              Advanced AI technology meets traditional martial arts training for Karate, Taekwondo, Kung Fu, and more
            </p>
            
            {/* Martial Arts Styles */}
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              {["Karate", "Taekwondo", "Kung Fu", "Boxing", "Muay Thai", "Kickboxing"].map((style, index) => (
                <motion.div
                  key={style}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Badge className="bg-red-600/10 text-red-300 border-red-600/30 px-3 py-1">
                    {style}
                  </Badge>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
              >
                <Card className="bg-gray-900/50 border-gray-800 hover:border-red-600/50 transition-all duration-500 group relative overflow-hidden">
                  {/* Card glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-red-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <CardHeader className="relative">
                    <motion.div 
                      className="w-16 h-16 bg-gradient-to-br from-red-600/20 to-red-700/20 rounded-xl flex items-center justify-center mb-4 group-hover:from-red-600/30 group-hover:to-red-700/30 transition-all duration-300"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                    >
                      <div className="text-red-400 group-hover:text-red-300 transition-colors">
                        {benefit.icon}
                      </div>
                    </motion.div>
                    <CardTitle className="text-white text-xl group-hover:text-red-100 transition-colors">
                      {benefit.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative">
                    <CardDescription className="text-gray-400 text-base leading-relaxed group-hover:text-gray-300 transition-colors">
                      {benefit.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 relative">
        {/* Background elements */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-32 right-20 text-red-500">
            <Camera className="w-20 h-20" />
          </div>
          <div className="absolute bottom-32 left-20 text-red-500">
            <Eye className="w-16 h-16" />
          </div>
        </div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Simple. Powerful. Effective.
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Start training with AI coaching in three easy steps
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                step: "1",
                icon: <Camera className="w-8 h-8" />,
                title: "Open Camera",
                description: "Allow camera access for movement tracking",
                color: "from-blue-600 to-blue-700"
              },
              {
                step: "2", 
                icon: <Activity className="w-8 h-8" />,
                title: "Start Training",
                description: "Follow along with guided techniques",
                color: "from-green-600 to-green-700"
              },
              {
                step: "3",
                icon: <Brain className="w-8 h-8" />,
                title: "Get Feedback",
                description: "Receive instant AI-powered corrections",
                color: "from-red-600 to-red-700"
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="text-center relative group"
              >
                {/* Step number with gradient */}
                <motion.div 
                  className={`w-20 h-20 bg-gradient-to-r ${item.color} rounded-full flex items-center justify-center text-white text-2xl font-bold mb-6 mx-auto shadow-lg shadow-red-500/25 group-hover:shadow-red-500/40 transition-shadow duration-300`}
                  whileHover={{ scale: 1.1 }}
                >
                  {item.step}
                </motion.div>
                
                {/* Icon */}
                <motion.div 
                  className="w-12 h-12 bg-gray-800/50 rounded-lg flex items-center justify-center mx-auto mb-4 text-red-400 group-hover:bg-red-600/20 transition-colors duration-300"
                  whileHover={{ rotate: 10 }}
                >
                  {item.icon}
                </motion.div>
                
                <h3 className="text-xl font-semibold mb-4 text-white group-hover:text-red-100 transition-colors">
                  {item.title}
                </h3>
                <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">
                  {item.description}
                </p>
                
                {/* Connecting arrows */}
                {index < 2 && (
                  <motion.div 
                    className="hidden md:block absolute top-10 left-full w-12 z-10"
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: (index + 1) * 0.3 }}
                  >
                    <ArrowRight className="w-8 h-8 text-red-600/60 mx-auto animate-pulse" />
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Transform Your Training?
            </h2>
            <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
              Join martial artists worldwide improving their skills with AI-powered coaching.
            </p>
            
            <Link href="/early">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg shadow-red-500/25 px-12 py-6 text-xl font-semibold group"
              >
                Start Now - It's Free
                <ArrowRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
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