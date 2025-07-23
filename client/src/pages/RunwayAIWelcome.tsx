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
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden">
      {/* Hide global dock for this page */}
      <style>
        {`
          .global-dock { display: none !important; }
        `}
      </style>
      
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-sm border-b border-gray-100 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-3">
              <img src={runwayLogo} alt="Runway AI" className="h-10 w-10" />
              <span className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">
                RunwayAI
              </span>
            </div>
            <div className="hidden md:flex space-x-6 text-sm">
              <a href="#features" className="text-gray-600 hover:text-pink-500 transition-colors">Features</a>
              <a href="#about" className="text-gray-600 hover:text-pink-500 transition-colors">About Arshia</a>
            </div>
          </div>
          <Button 
            className="bg-pink-500 text-white hover:bg-pink-600 transition-colors"
            onClick={() => window.open('https://www.rwyai.app', '_blank')}
          >
            Get Started
          </Button>
        </div>
      </nav>

      {/* Hero Section with Cursor Gradient */}
      <div className="relative pt-24 pb-20 px-6 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 text-white overflow-hidden">
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <div className="flex flex-col items-center mb-6">
              <img src={runwayLogo} alt="Runway AI" className="h-20 w-20 mb-4" />
              <h1 className="text-6xl md:text-8xl font-bold leading-tight text-center">
                The AI Pageant Coach
              </h1>
            </div>
            <p className="text-xl md:text-2xl text-white/90 max-w-4xl mx-auto leading-relaxed">
              Built to make you extraordinarily confident. RunwayAI is the best way to train for pageants with AI.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
          >
            <Button 
              className="bg-white text-gray-900 hover:bg-gray-100 px-8 py-4 text-lg font-medium rounded-lg transition-colors"
              onClick={() => window.open('https://www.rwyai.app', '_blank')}
            >
              Start Training
            </Button>
            <Button 
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10 px-8 py-4 text-lg font-medium rounded-lg transition-colors"
              onClick={() => window.open('https://cal.com/ojas-kandhare/runwayai-demo', '_blank')}
            >
              Book a Demo
            </Button>
          </motion.div>

          {/* Hero Image Placeholder - Modern Design */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="relative"
          >
            <div className="relative bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-2xl p-8 max-w-5xl mx-auto">
              <div className="bg-white rounded-xl border border-gray-100 p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  <span className="text-sm text-gray-500 ml-4">RunwayAI Training Session</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="bg-pink-50 rounded-lg p-4 border border-pink-100">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-2xl">👗</span>
                        <span className="font-semibold text-pink-700">Live Routine Analysis</span>
                      </div>
                      <div className="text-sm text-gray-600">Analyzing posture and flow...</div>
                      <div className="mt-2 bg-pink-200 rounded-full h-2">
                        <div className="bg-pink-500 h-2 rounded-full w-3/4"></div>
                      </div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-2xl">🎤</span>
                        <span className="font-semibold text-blue-700">Interview Practice</span>
                      </div>
                      <div className="text-sm text-gray-600">Confidence score: 94%</div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-2xl">👑</span>
                        <span className="font-semibold text-purple-700">Dress Try-On</span>
                      </div>
                      <div className="text-sm text-gray-600">3 new styles recommended</div>
                    </div>
                    <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-100">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-2xl">🤖</span>
                        <span className="font-semibold text-emerald-700">AI Coach Insights</span>
                      </div>
                      <div className="text-sm text-gray-600">Weekly progress: +15%</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Perfect Your Walk */}
      <div className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold mb-4">Perfect your walk</h2>
            <p className="text-xl text-gray-600">
              RunwayAI helps you master every step with real-time AI feedback.
            </p>
          </div>

          <div className="relative">
            <div className="bg-gradient-to-br from-pink-500 via-rose-400 to-pink-600 rounded-2xl p-8 text-white">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="text-3xl font-bold mb-4">Live Routine Analysis</h3>
                  <p className="text-pink-100 mb-6 text-lg">
                    Get instant feedback on your posture, stride length, timing, and overall flow as you practice your runway walk.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-pink-200 rounded-full"></div>
                      <span>Real-time posture analysis</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-pink-200 rounded-full"></div>
                      <span>Stride consistency tracking</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-pink-200 rounded-full"></div>
                      <span>Confidence scoring</span>
                    </div>
                  </div>
                </div>
                <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm">
                  <div className="text-center">
                    <div className="text-6xl mb-4">👗</div>
                    <div className="text-lg font-semibold mb-2">Training Session Active</div>
                    <div className="text-sm text-pink-200">Analyzing movement patterns...</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Master Your Interviews */}
      <div className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold mb-4">Master your interviews</h2>
            <p className="text-xl text-gray-600">
              Practice with AI-powered interview coaching and real-time feedback.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6">
                <div className="text-center">
                  <div className="text-6xl mb-4">🎤</div>
                  <div className="text-lg font-semibold mb-2 text-blue-700">Interview Practice</div>
                  <div className="text-sm text-blue-600">Question 3 of 10 • 45 seconds remaining</div>
                  <div className="mt-4 bg-blue-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full w-2/3"></div>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-3xl font-bold mb-4">Interview Coach</h3>
                <p className="text-gray-600 mb-6 text-lg">
                  Practice with realistic pageant questions and receive detailed feedback on your speaking clarity, confidence, and content quality.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                    <span>Speech clarity analysis</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                    <span>Confidence scoring</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                    <span>Content quality feedback</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid - 2x2 Layout */}
      <div id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold mb-4">Train like a champion</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Intelligent, fast, and comprehensive. RunwayAI is the best way to prepare for pageants with AI.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow"
              >
                <div className="mb-4">
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </div>
                <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-lg p-4 border border-pink-100">
                  <p className="text-sm text-gray-700">{feature.details}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* About Arshia Section */}
      <div id="about" className="py-20 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold mb-4">Meet Arshia Kathpalia</h2>
            <p className="text-xl text-gray-600">
              Miss Teen India USA 2024 & Co-Founder of RunwayAI
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8">
            <div className="grid md:grid-cols-3 gap-8 items-center">
              <div className="md:col-span-1">
                <div className="w-48 h-48 mx-auto bg-gradient-to-br from-pink-400 to-rose-500 rounded-full flex items-center justify-center text-white text-6xl font-bold">
                  AK
                </div>
              </div>
              <div className="md:col-span-2">
                <h3 className="text-2xl font-bold mb-4 text-gray-900">Official Miss Teen India USA 2024</h3>
                <div className="space-y-4 text-gray-700">
                  <p>
                    Arshia Kathpalia is a model, dancer, actor, and the official Miss Teen India USA 2024. She represented the state of Washington and brought the crown back to her home state after five years.
                  </p>
                  <p>
                    Growing up in Renton, Washington, Arshia was a senior at Liberty High School when she won first runner-up at the Miss Teen India Washington Pageant in December 2023, later advancing to win the Miss Teen India USA title. Her pageantry talent showcased a stunning fusion of Bollywood and Bharatanatyam dance, leveraging her extensive training that began at age 4.
                  </p>
                  <p>
                    Beyond pageantry, Arshia advocates for girls' education and women's empowerment in STEM fields, using her platform to inspire change through community service. She has performed at senior centers, participated in parades, and led charity outreach events in both Renton and India with the organization Ampowering.
                  </p>
                  <p className="text-sm text-gray-600 italic">
                    Arshia is an incoming freshman at the University of California, Davis. She/her pronouns.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-5xl md:text-7xl font-bold mb-6">Try RunwayAI Now</h2>
            <p className="text-xl text-gray-600 mb-8">
              Join thousands of pageant contestants who are already training with AI.
            </p>
            <Button 
              className="bg-pink-500 text-white hover:bg-pink-600 px-12 py-6 text-xl font-medium rounded-lg transition-colors"
              onClick={() => window.open('https://www.rwyai.app', '_blank')}
            >
              Start for free
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Simple Footer */}
      <footer className="py-16 px-6 border-t border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-gray-600 text-sm">
            Please reach out to <a href="mailto:arshia.x.kathpalia@gmail.com" className="text-pink-600 underline">arshia.x.kathpalia@gmail.com</a> with any concerns at any time.
          </p>
        </div>
      </footer>
    </div>
  );
} 