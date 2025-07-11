import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Partnership() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 relative z-50">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-orange-400 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">C</span>
          </div>
          <span className="text-xl font-bold">COACHT</span>
        </div>
        
        <div className="hidden md:flex items-center space-x-8 text-sm">
          <Link href="/pricing" className="text-gray-300 hover:text-white">Pricing</Link>
          <Link href="/features" className="text-gray-300 hover:text-white">Features</Link>
          <Link href="/enterprise" className="text-gray-300 hover:text-white">Enterprise</Link>
          <Link href="/blog" className="text-gray-300 hover:text-white">Blog</Link>
          <Link href="/forum" className="text-gray-300 hover:text-white">Forum</Link>
          <Link href="/careers" className="text-gray-300 hover:text-white">Careers</Link>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white">
            <div className="w-4 h-4 mr-2">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
          </Button>
          <Button className="bg-white text-black hover:bg-gray-100">
            <div className="w-4 h-4 mr-2">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.09 22C7.79 22.05 6.8 20.68 5.96 19.47C4.25 17 2.94 12.45 4.7 9.39C5.57 7.87 7.13 6.91 8.82 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5Z"/>
              </svg>
            </div>
            Download
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-red-900/40 to-orange-900/40" />
        
        <div className="relative z-10 px-6 py-20 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
          >
            The AI Martial Arts Coach
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto"
          >
            Built to make you extraordinarily skilled, CoachT is the best way to train with AI.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Button className="bg-white text-black hover:bg-gray-100 px-8 py-3">
              <div className="w-4 h-4 mr-2">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.09 22C7.79 22.05 6.8 20.68 5.96 19.47C4.25 17 2.94 12.45 4.7 9.39C5.57 7.87 7.13 6.91 8.82 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5Z"/>
                </svg>
              </div>
              Download for iOS
            </Button>
            <Button variant="outline" className="border-white text-white hover:bg-white hover:text-black px-8 py-3">
              All Downloads
            </Button>
          </motion.div>
        </div>

        {/* Training Session Mockup */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="relative z-10 px-6 pb-20"
        >
          <div className="max-w-6xl mx-auto">
            <div className="bg-gray-900 rounded-lg overflow-hidden shadow-2xl border border-gray-800">
              <div className="bg-gray-800 px-4 py-2 flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div className="ml-4 text-sm text-gray-400">CoachT Training Session</div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="text-green-400 font-mono text-sm">
                      <div className="text-gray-500">// Real-time pose detection</div>
                      <div>function analyzeTechnique() {'{'}
                        <div className="ml-4 text-blue-400">
                          const pose = detectPose(videoFrame);
                          <br />
                          const score = evaluateForm(pose);
                          <br />
                          return generateFeedback(score);
                        </div>
                      {'}'}</div>
                    </div>
                    
                    <div className="bg-gray-800 rounded p-4 border border-gray-700">
                      <div className="text-red-400 font-semibold mb-2">AI Feedback</div>
                      <div className="text-gray-300 text-sm">
                        Excellent form! Your kick height improved by 15%. 
                        Try extending your hip more for maximum power.
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-800 rounded p-4 border border-gray-700">
                    <div className="text-orange-400 font-semibold mb-2">Training Stats</div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Form Accuracy:</span>
                        <span className="text-green-400">92%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Kicks Performed:</span>
                        <span className="text-blue-400">47</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Session Time:</span>
                        <span className="text-purple-400">18:34</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Trusted By Section */}
      <div className="py-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="text-gray-400 text-sm mb-8 uppercase tracking-wider">
            TRUSTED BY MARTIAL ARTISTS AT
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 items-center opacity-50">
            <div className="text-gray-400 font-bold text-lg">TIGER SCHULMANN</div>
            <div className="text-gray-400 font-bold text-lg">ATA</div>
            <div className="text-gray-400 font-bold text-lg">WORLD TAEKWONDO</div>
            <div className="text-gray-400 font-bold text-lg">KARATE.COM</div>
            <div className="text-gray-400 font-bold text-lg">MARTIAL ARTS</div>
            <div className="text-gray-400 font-bold text-lg">CENTURY</div>
            <div className="text-gray-400 font-bold text-lg">MASUTATSU</div>
            <div className="text-gray-400 font-bold text-lg">BUSHIDO</div>
            <div className="text-gray-400 font-bold text-lg">DOJO</div>
            <div className="text-gray-400 font-bold text-lg">SENSEI</div>
          </div>
        </div>
      </div>

      {/* Tab Section */}
      <div className="py-20 px-6 text-center">
        <h2 className="text-4xl font-bold mb-4">Train, train, train</h2>
        <p className="text-gray-300 text-lg max-w-2xl mx-auto">
          CoachT lets you breeze through techniques by predicting your next move.
        </p>
      </div>

      {/* Features Section */}
      <div className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4">Master techniques faster</h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Intelligent, fast, and familiar, CoachT is the best way to train with AI.
            </p>
            <Button className="mt-8 bg-white text-black hover:bg-gray-100">
              See more features
            </Button>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-900 rounded-lg p-8 border border-gray-800">
              <div className="mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg mb-4 flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-bold mb-4">AI-Powered Analysis</h3>
              <p className="text-gray-300">
                Powered by advanced computer vision and machine learning, CoachT analyzes your form in real-time.
              </p>
            </div>
            
            <div className="bg-gray-900 rounded-lg p-8 border border-gray-800">
              <div className="mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg mb-4 flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-bold mb-4">Feels Natural</h3>
              <p className="text-gray-300">
                Import all your favorite techniques and training routines in one click.
              </p>
            </div>
            
            <div className="bg-gray-900 rounded-lg p-8 border border-gray-800">
              <div className="mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-lg mb-4 flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-bold mb-4">Privacy First</h3>
              <p className="text-gray-300">
                If you enable Privacy Mode, your training data never leaves your device. CoachT is SOC 2 certified.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4">Loved by world-class martial artists</h2>
            <p className="text-xl text-gray-300">
              Martial artists all around the world reach for CoachT by choice.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Master Kim",
                role: "Taekwondo Grandmaster",
                text: "CoachT has revolutionized how I teach. The AI feedback helps my students improve faster than ever before.",
                avatar: "🥋"
              },
              {
                name: "Sarah Johnson",
                role: "MMA Fighter",
                text: "I went from struggling with technique to landing perfect kicks consistently. The form analysis is incredible.",
                avatar: "🥊"
              },
              {
                name: "Sensei Martinez",
                role: "Karate Instructor",
                text: "CoachT is the best training tool I've used. It's like having a personal coach available 24/7.",
                avatar: "🏆"
              },
              {
                name: "David Chen",
                role: "Kung Fu Practitioner",
                text: "Started using CoachT last month and I'm blown away. It's completely changed my training routine.",
                avatar: "🐉"
              },
              {
                name: "Lisa Park",
                role: "Martial Arts Studio Owner",
                text: "I installed CoachT in my studio and my students love it. Retention has never been higher.",
                avatar: "🥋"
              },
              {
                name: "Mike Thompson",
                role: "Combat Sports Athlete",
                text: "CoachT is hands down my biggest training improvement in years. The precision is unmatched.",
                avatar: "⚡"
              }
            ].map((testimonial, index) => (
              <div key={index} className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center mr-3">
                    <span className="text-xl">{testimonial.avatar}</span>
                  </div>
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-gray-400">{testimonial.role}</div>
                  </div>
                </div>
                <p className="text-gray-300">{testimonial.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-red-600/20 via-purple-600/20 to-orange-600/20 rounded-2xl blur-3xl"></div>
            <div className="relative bg-gradient-to-r from-red-600/10 via-purple-600/10 to-orange-600/10 rounded-2xl p-12 border border-gray-800">
              <h2 className="text-5xl font-bold mb-6">Try CoachT Now</h2>
              <Button className="bg-white text-black hover:bg-gray-100 px-8 py-3">
                <div className="w-4 h-4 mr-2">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.09 22C7.79 22.05 6.8 20.68 5.96 19.47C4.25 17 2.94 12.45 4.7 9.39C5.57 7.87 7.13 6.91 8.82 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5Z"/>
                  </svg>
                </div>
                Download for free
              </Button>
              
              <div className="absolute -bottom-8 right-8">
                <div className="w-20 h-20 bg-gradient-to-br from-red-500 via-purple-500 to-orange-500 rounded-lg transform rotate-12 opacity-80"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-16 px-6 border-t border-gray-800">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-5 gap-8">
            <div>
              <div className="text-gray-400 text-sm mb-4">contact@coacht.ai</div>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/>
                    <circle cx="4" cy="4" r="2"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23 12a11 11 0 01-11 11A11 11 0 011 12a11 11 0 0111-11 11 11 0 0111 11zM8.7 9.1H6.2v8.8h2.5V9.1zM7 8.1c-.8 0-1.4-.7-1.4-1.5S6.2 5.1 7 5.1s1.4.7 1.4 1.5S7.8 8.1 7 8.1zM18 17.9h-2.5v-4.6c0-.9 0-2.1-1.3-2.1s-1.5 1-1.5 2.1v4.6H10.2V9.1h2.4v1.2h0c.3-.6 1.1-1.2 2.2-1.2 2.4 0 2.8 1.6 2.8 3.6v5.2z"/>
                  </svg>
                </a>
              </div>
            </div>
            
            <div>
              <div className="text-gray-400 text-sm font-semibold mb-4">Product</div>
              <div className="space-y-2 text-sm">
                <Link href="/" className="text-gray-400 hover:text-white block">Home</Link>
                <Link href="/pricing" className="text-gray-400 hover:text-white block">Pricing</Link>
                <Link href="/features" className="text-gray-400 hover:text-white block">Features</Link>
              </div>
            </div>
            
            <div>
              <div className="text-gray-400 text-sm font-semibold mb-4">Resources</div>
              <div className="space-y-2 text-sm">
                <Link href="/docs" className="text-gray-400 hover:text-white block">Docs</Link>
                <Link href="/blog" className="text-gray-400 hover:text-white block">Blog</Link>
                <Link href="/forum" className="text-gray-400 hover:text-white block">Forum</Link>
                <Link href="/community" className="text-gray-400 hover:text-white block">Community</Link>
              </div>
            </div>
            
            <div>
              <div className="text-gray-400 text-sm font-semibold mb-4">Company</div>
              <div className="space-y-2 text-sm">
                <Link href="/about" className="text-gray-400 hover:text-white block">About</Link>
                <Link href="/careers" className="text-gray-400 hover:text-white block">Careers</Link>
              </div>
            </div>
            
            <div>
              <div className="text-gray-400 text-sm font-semibold mb-4">Legal</div>
              <div className="space-y-2 text-sm">
                <Link href="/terms" className="text-gray-400 hover:text-white block">Terms</Link>
                <Link href="/security" className="text-gray-400 hover:text-white block">Security</Link>
                <Link href="/privacy" className="text-gray-400 hover:text-white block">Privacy</Link>
              </div>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-gray-800 flex justify-between items-center">
            <div className="text-gray-400 text-sm">
              © 2025 CoachT. All rights reserved.
            </div>
            <div className="flex items-center space-x-4">
              <select className="bg-gray-800 text-gray-400 text-sm border border-gray-700 rounded px-2 py-1">
                <option>🌍 English</option>
              </select>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-gray-600 rounded"></div>
                <div className="w-4 h-4 bg-gray-600 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}