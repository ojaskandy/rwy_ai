import { useState, useEffect } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Sparkles } from "lucide-react";
import challengeArenaImage from "@assets/image_1750188086936.png";
import homeScreenImage from "@assets/image_1750188117761.png";
import practiceLibraryImage from "@assets/image_1750188231521.png";
import bannerImage from "@assets/image_1750189369561.png";

export default function MarketingLanding() {
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.3], [1, 0.8]);

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Top Banner */}
      <motion.div 
        className="w-full py-3 px-6 flex justify-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <img 
          src={bannerImage} 
          alt="CoachT" 
          className="h-8 md:h-10"
        />
      </motion.div>

      {/* Hero Section */}
      <motion.section 
        className="relative min-h-screen flex items-center justify-center px-6"
        style={{ opacity, scale }}
      >
        {/* Minimal background glow */}
        <div className="absolute inset-0">
          <motion.div
            className="absolute top-1/3 left-1/4 w-96 h-96 bg-red-600/5 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>

        <div className="relative z-10 text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2 }}
          >
            <motion.h1 
              className="text-4xl md:text-6xl font-bold mb-6 leading-tight"
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 0.3 }}
            >
              Master Every Move
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.8 }}
              className="mb-8"
            >
              <span className="text-xl md:text-2xl bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent font-medium">
                Experience Precision Perfection
              </span>
            </motion.div>

            <motion.p 
              className="text-lg text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 1.2 }}
            >
              Your personal AI coach that meticulously checks every detail and pushes you towards flawless execution.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.6 }}
              className="flex flex-col sm:flex-row gap-6 justify-center items-center"
            >
              <Link href="/auth">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-2xl shadow-red-500/25 px-12 py-6 text-xl font-semibold group transform hover:scale-105 transition-all duration-300"
                >
                  Start Now
                  <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              
              <Button 
                variant="ghost" 
                size="lg" 
                className="text-gray-300 hover:text-white px-8 py-6 text-lg group"
              >
                <Play className="mr-3 w-5 h-5 group-hover:scale-110 transition-transform" />
                Watch Demo
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* What CoachT Does - Reveal on scroll */}
      <motion.section 
        className="py-32 px-6"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
        viewport={{ once: true, margin: "-100px" }}
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
      <section className="py-20 px-6">
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
        className="py-32 px-6"
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
      <footer className="py-8 px-6 border-t border-gray-900">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-gray-500 text-sm">
            © 2025 CoachT. Revolutionizing martial arts training with AI.
          </p>
        </div>
      </footer>
    </div>
  );
}