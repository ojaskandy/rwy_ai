import { useState, useEffect } from "react";
import { Link } from "wouter";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowDown, ArrowRight, Sparkles } from "lucide-react";
import silhouetteImage from "@assets/image_1750268882265.png";
import challengeArenaImage from "@assets/image_1750188086936.png";
import homeScreenImage from "@assets/image_1750188117761.png";
import practiceLibraryImage from "@assets/image_1750188231521.png";

const martialArtsTerms = [
  "AI Coach",
  "Taekwondo", 
  "Karate",
  "Muay Thai",
  "Black Belt",
  "Precision",
  "Stronger",
  "Form",
  "Technique",
  "Master",
  "Training",
  "Power",
  "Speed",
  "Focus",
  "Discipline",
  "Excellence"
];

const rotatingMainTexts = [
  "Form Perfection",
  "Power Unleashed",
  "Speed Mastery",
  "Technique Refined",
  "Precision Training",
  "Elite Performance"
];

export default function WelcomePage() {
  const { scrollY } = useScroll();
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [showScrollHint, setShowScrollHint] = useState(true);
  
  // Silhouette zoom effect
  const silhouetteScale = useTransform(scrollY, [0, 800], [1, 15]);
  const silhouetteOpacity = useTransform(scrollY, [0, 400, 800], [1, 0.8, 0]);
  
  // Background transition
  const backgroundOpacity = useTransform(scrollY, [600, 1000], [0, 1]);
  
  // Main content reveal
  const contentY = useTransform(scrollY, [800, 1200], [100, 0]);
  const contentOpacity = useTransform(scrollY, [800, 1200], [0, 1]);

  // Rotate text every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTextIndex((prev) => (prev + 1) % rotatingMainTexts.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Hide scroll hint after user starts scrolling
  useEffect(() => {
    const unsubscribe = scrollY.on("change", (latest) => {
      if (latest > 50) {
        setShowScrollHint(false);
      }
    });
    return unsubscribe;
  }, [scrollY]);

  // Generate floating terms based on scroll
  const generateFloatingTerms = () => {
    const terms = [];
    const scrollPosition = scrollY.get();
    
    for (let i = 0; i < 8; i++) {
      const termIndex = Math.floor((scrollPosition / 100 + i) % martialArtsTerms.length);
      const yOffset = ((scrollPosition + i * 150) % 1000) - 500;
      const xOffset = (i % 2 === 0 ? -200 : 200) + (Math.sin(scrollPosition / 200 + i) * 100);
      
      terms.push(
        <motion.div
          key={`${termIndex}-${i}`}
          className="absolute text-2xl md:text-4xl font-bold text-red-500/30 pointer-events-none select-none"
          style={{
            left: `calc(50% + ${xOffset}px)`,
            top: `calc(50% + ${yOffset}px)`,
            transform: 'translate(-50%, -50%)',
          }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ 
            opacity: [0, 0.6, 0],
            scale: [0.5, 1, 0.8],
            y: [20, -20, -40]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            delay: i * 0.2,
            ease: "easeOut"
          }}
        >
          {martialArtsTerms[termIndex]}
        </motion.div>
      );
    }
    return terms;
  };

  return (
    <div className="relative min-h-[200vh] bg-black text-white overflow-hidden">
      {/* Floating martial arts terms */}
      <div className="fixed inset-0 z-10 pointer-events-none">
        {generateFloatingTerms()}
      </div>

      {/* Initial silhouette section */}
      <motion.section className="fixed inset-0 flex items-center justify-center z-20">
        <motion.div
          className="relative"
          style={{ 
            scale: silhouetteScale,
            opacity: silhouetteOpacity
          }}
        >
          <img 
            src={silhouetteImage} 
            alt="Martial Artist Silhouette"
            className="w-32 h-32 md:w-48 md:h-48 object-contain"
          />
        </motion.div>

        {/* Scroll hint */}
        <AnimatePresence>
          {showScrollHint && (
            <motion.div
              className="absolute bottom-20 left-1/2 transform -translate-x-1/2 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: 2 }}
            >
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <ArrowDown className="w-8 h-8 text-red-500 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">Scroll to zoom</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>

      {/* Background gradient that appears on scroll */}
      <motion.div 
        className="fixed inset-0 bg-gradient-to-b from-black via-gray-900 to-black z-5"
        style={{ opacity: backgroundOpacity }}
      />

      {/* Main content that appears after zoom */}
      <motion.section 
        className="relative z-30 min-h-screen flex flex-col items-center justify-center px-6"
        style={{ 
          y: contentY,
          opacity: contentOpacity,
          marginTop: '100vh'
        }}
      >
        <div className="text-center max-w-4xl mx-auto">
          {/* CoachT Logo */}
          <motion.h1 
            className="text-6xl md:text-8xl font-bold mb-8"
            initial={{ opacity: 0, scale: 0.5 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
          >
            <span className="bg-gradient-to-r from-red-400 via-red-500 to-red-600 bg-clip-text text-transparent">
              CoachT
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl md:text-3xl text-gray-200 mb-2">
              AI-Powered Martial Arts{" "}
              <span className="text-red-500 border border-red-500/50 px-4 py-1 rounded-full">
                Training Partner
              </span>
            </h2>
          </motion.div>

          {/* Static text with icon */}
          <motion.div
            className="mb-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-lg text-gray-300">
                Built by Martial Artists
              </span>
            </div>

            {/* Rotating main text */}
            <AnimatePresence mode="wait">
              <motion.h3 
                key={currentTextIndex}
                className="text-4xl md:text-5xl font-bold text-white mb-8"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.8 }}
              >
                {rotatingMainTexts[currentTextIndex]}
              </motion.h3>
            </AnimatePresence>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-6 justify-center items-center"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2 }}
            viewport={{ once: true }}
          >
            <Link href="/auth">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-2xl shadow-red-500/25 px-12 py-6 text-xl font-semibold group transform hover:scale-105 transition-all duration-300"
              >
                Get Your Edge
                <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            
            <Link href="/renovate">
              <Button 
                variant="outline" 
                size="lg" 
                className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white px-8 py-6 text-lg"
              >
                Learn More
              </Button>
            </Link>
          </motion.div>

          {/* Competitive edge message */}
          <motion.p 
            className="text-gray-400 mt-12 text-lg max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.5 }}
            viewport={{ once: true }}
          >
            The competitive advantage that accelerates your journey to the next belt. 
            <span className="text-red-400"> Others don't know about this.</span>
          </motion.p>
        </div>
      </motion.section>

      {/* What CoachT Does - Reveal on scroll */}
      <motion.section 
        className="py-32 px-6 relative z-30"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
        viewport={{ once: true, margin: "-100px" }}
        style={{ marginTop: '50vh' }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2 
            className="text-3xl md:text-4xl font-bold mb-6"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
          >
            Revolutionary AI Training
          </motion.h2>
          <motion.p 
            className="text-lg text-gray-300 leading-relaxed max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
            viewport={{ once: true }}
          >
            CoachT uses cutting-edge AI to provide instant, intelligent feedback, helping you fix mistakes in real-time and unlock your full potential.
          </motion.p>
        </div>
      </motion.section>

      {/* Core Features - 2x2 Grid */}
      <section className="py-20 px-6 relative z-30">
        <div className="max-w-6xl mx-auto">
          <motion.h2 
            className="text-3xl md:text-4xl font-bold text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            How CoachT Empowers Your Training
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Dynamic Challenges */}
            <motion.div 
              className="group"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              viewport={{ once: true, margin: "-50px" }}
            >
              <div className="bg-gray-900/30 rounded-2xl p-6 h-full border border-gray-800 hover:border-orange-600/50 transition-all duration-300">
                <img 
                  src={challengeArenaImage} 
                  alt="Challenge Arena" 
                  className="w-full rounded-xl shadow-lg shadow-orange-500/20 border border-gray-700 mb-6"
                />
                <h3 className="text-xl font-bold mb-4 text-white group-hover:text-orange-300 transition-colors">
                  Dynamic Challenges
                </h3>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  Push your limits, dominate leaderboards, and prove your skills in thrilling, gamified challenges.
                </p>
                <Link href="/early">
                  <Button className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white w-full group">
                    Try Challenges
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </motion.div>

            {/* Start Live Routine */}
            <motion.div 
              className="group"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true, margin: "-50px" }}
            >
              <div className="bg-gray-900/30 rounded-2xl p-6 h-full border border-gray-800 hover:border-blue-600/50 transition-all duration-300">
                <img 
                  src={homeScreenImage} 
                  alt="Training Interface" 
                  className="w-full rounded-xl shadow-lg shadow-blue-500/20 border border-gray-700 mb-6"
                />
                <h3 className="text-xl font-bold mb-4 text-white group-hover:text-blue-300 transition-colors">
                  Start Live Routine
                </h3>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  Compare your live performance against expert demonstrations with precise AI insights.
                </p>
                <Link href="/early">
                  <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white w-full group">
                    Start Training
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </motion.div>

            {/* Practice Library */}
            <motion.div 
              className="group"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              viewport={{ once: true, margin: "-50px" }}
            >
              <div className="bg-gray-900/30 rounded-2xl p-6 h-full border border-gray-800 hover:border-purple-600/50 transition-all duration-300">
                <img 
                  src={practiceLibraryImage} 
                  alt="Practice Library" 
                  className="w-full rounded-xl shadow-lg shadow-purple-500/20 border border-gray-700 mb-6"
                />
                <h3 className="text-xl font-bold mb-4 text-white group-hover:text-purple-300 transition-colors">
                  Practice Library
                </h3>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  Advanced pose detection analyzes your every move with precise visual cues and AI guidance.
                </p>
                <Link href="/early">
                  <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white w-full group">
                    Explore Library
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </motion.div>

            {/* Real-time Feedback */}
            <motion.div 
              className="group"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              viewport={{ once: true, margin: "-50px" }}
            >
              <div className="bg-gray-900/30 rounded-2xl p-6 h-full border border-gray-800 hover:border-green-600/50 transition-all duration-300">
                <div className="w-full h-48 bg-gradient-to-br from-green-900/20 to-green-700/20 rounded-xl border border-gray-700 mb-6 flex items-center justify-center">
                  <div className="text-center">
                    <Sparkles className="w-12 h-12 text-green-400 mx-auto mb-4" />
                    <p className="text-green-300 font-medium">Real-time AI Analysis</p>
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-4 text-white group-hover:text-green-300 transition-colors">
                  Real-time AI Feedback
                </h3>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  Get instant corrections and intelligent voice guidance from your personal AI master.
                </p>
                <Link href="/early">
                  <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white w-full group">
                    Try AI Feedback
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <motion.section 
        className="py-32 px-6 relative z-30"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
        viewport={{ once: true, margin: "-100px" }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
          >
            <motion.div
              className="mb-8"
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <Sparkles className="w-16 h-16 text-red-500 mx-auto mb-6" />
            </motion.div>
            
            <h2 className="text-4xl md:text-6xl font-bold mb-8 leading-tight">
              Ready to achieve{" "}
              <span className="bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
                mastery?
              </span>
            </h2>
            
            <motion.p 
              className="text-2xl font-bold text-white mb-12"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              viewport={{ once: true }}
            >
              Start Your FREE Journey with CoachT Today
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              viewport={{ once: true }}
            >
              <Link href="/auth">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-2xl shadow-red-500/30 px-16 py-8 text-2xl font-bold group transform hover:scale-105 transition-all duration-500"
                >
                  Start Now
                  <ArrowRight className="ml-3 w-8 h-8 group-hover:translate-x-2 transition-transform duration-300" />
                </Button>
              </Link>
            </motion.div>
            
            <motion.p 
              className="text-gray-400 mt-8 text-lg"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              viewport={{ once: true }}
            >
              No credit card required • Instant access
            </motion.p>
          </motion.div>
        </div>
      </motion.section>

      {/* Minimal Footer */}
      <footer className="py-8 px-6 border-t border-gray-900 relative z-30">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-gray-500 text-sm">
            © 2025 CoachT. Revolutionizing martial arts training with AI.
          </p>
        </div>
      </footer>
    </div>
  );
}