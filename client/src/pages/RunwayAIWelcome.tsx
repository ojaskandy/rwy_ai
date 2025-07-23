import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import runwayLogo from "@assets/runwayailogo_1753229923969.png";

const features = [
  {
    title: "Live Routine",
    description: "Perfect your runway walk with real-time AI feedback on posture, stride, poise, and flow.",
    details: "Advanced pose detection technology analyzes your movement patterns and provides instant corrections to help you achieve the perfect runway walk.",
  },
  {
    title: "Interview Coach", 
    description: "Master pageant interviews with AI analysis of clarity, confidence, and content delivery.",
    details: "Practice with timed questions and receive detailed feedback on your speaking pace, filler words, and answer quality.",
  },
  {
    title: "Dress Try-On",
    description: "Virtually try different dresses and styles with realistic AI-powered fitting technology.",
    details: "Upload your photo and experiment with countless dress options to find the perfect look for any pageant event.",
  },
  {
    title: "AI Coach",
    description: "Get personalized guidance and support from your dedicated AI pageant coach, available 24/7.",
    details: "Receive customized training plans, progress tracking, and expert advice tailored to your pageant journey.",
  },
];

export default function RunwayAIWelcome() {
  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-black/90 backdrop-blur-sm border-b border-gray-800 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <img src={runwayLogo} alt="Runway AI" className="h-10 w-10" />
            <span className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
              RunwayAI
            </span>
          </div>
          <Link href="/auth">
            <Button className="bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:from-pink-600 hover:to-purple-600 px-6 py-2 rounded-full transition-all">
              Get Started
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative min-h-screen flex items-center justify-center px-6 bg-gradient-to-br from-black via-gray-900 to-purple-900">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 via-transparent to-purple-500/10"></div>
        
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="mb-12"
          >
            <img src={runwayLogo} alt="Runway AI" className="h-24 w-24 mb-8 mx-auto" />
            <h1 className="text-7xl md:text-9xl font-bold leading-tight mb-6">
              <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                The AI
              </span>
              <br />
              <span className="text-white">
                Pageant
              </span>
              <br />
              <span className="text-white">
                Coach
              </span>
            </h1>
            <p className="text-2xl text-gray-300 max-w-3xl mx-auto mb-12">
              Built to make you extraordinarily confident. RunwayAI is the best way to train for pageants with AI.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-6 justify-center mb-20"
          >
            <Link href="/auth">
              <Button className="bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:from-pink-600 hover:to-purple-600 px-12 py-4 text-xl font-medium rounded-full transition-all shadow-2xl shadow-pink-500/25">
                Start Training
              </Button>
            </Link>
            <Button 
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white px-12 py-4 text-xl font-medium rounded-full transition-all"
              onClick={() => window.open('https://cal.com/ojas-kandhare/runwayai-demo', '_blank')}
            >
              Book a Demo
            </Button>
          </motion.div>

          {/* App Preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="relative max-w-4xl mx-auto"
          >
            <div className="relative bg-gray-900/50 backdrop-blur-xl rounded-3xl border border-gray-700 shadow-2xl p-8">
              <div className="bg-gray-800 rounded-2xl border border-gray-600 p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  <span className="text-sm text-gray-400 ml-4">RunwayAI Training Session</span>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-pink-900/50 to-purple-900/50 rounded-xl p-4 border border-pink-500/20">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-2xl">👗</span>
                        <span className="font-semibold text-pink-300">Live Routine Analysis</span>
                      </div>
                      <div className="mt-3 bg-gray-700 rounded-full h-2">
                        <div className="bg-gradient-to-r from-pink-500 to-purple-500 h-2 rounded-full w-3/4"></div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-blue-900/50 to-cyan-900/50 rounded-xl p-4 border border-blue-500/20">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-2xl">🎤</span>
                        <span className="font-semibold text-blue-300">Interview Coach</span>
                      </div>
                      <div className="text-sm text-gray-400">Confidence: 94%</div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-purple-900/50 to-indigo-900/50 rounded-xl p-4 border border-purple-500/20">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-2xl">👑</span>
                        <span className="font-semibold text-purple-300">Dress Try-On</span>
                      </div>
                      <div className="text-sm text-gray-400">3 new styles</div>
                    </div>
                    <div className="bg-gradient-to-r from-emerald-900/50 to-teal-900/50 rounded-xl p-4 border border-emerald-500/20">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-2xl">🤖</span>
                        <span className="font-semibold text-emerald-300">AI Coach</span>
                      </div>
                      <div className="text-sm text-gray-400">Progress: +15%</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Features Section - Ultra Minimal */}
      <div className="py-40 px-6 bg-black">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                className="text-center"
              >
                <div className="text-5xl mb-6">
                  {feature.title === "Live Routine" && "👗"}
                  {feature.title === "Interview Coach" && "🎤"}
                  {feature.title === "Dress Try-On" && "👑"}
                  {feature.title === "AI Coach" && "🤖"}
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">{feature.title}</h3>
                <p className="text-gray-400 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="py-40 px-6 bg-gradient-to-br from-gray-900 via-purple-900 to-black">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            <h2 className="text-6xl md:text-8xl font-bold text-white mb-8">
              Start Today
            </h2>
            <Link href="/auth">
              <Button className="bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:from-pink-600 hover:to-purple-600 px-16 py-6 text-2xl font-medium rounded-full transition-all shadow-2xl shadow-pink-500/25">
                Begin Training
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
} 