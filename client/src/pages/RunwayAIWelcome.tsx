import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Send, MessageCircle, Sparkles } from "lucide-react";
import partnershipHero from "@assets/partnership_hero.jpeg";
import challengesImage from "@assets/partnership_challenges.png";
import practiceLibraryImage from "@assets/partnership_practicelibrary.png";
import shifuChatImage from "@assets/partnership_shifuchat.png";
import snapFeedbackImage from "@assets/partnership_snapfeedback.png";
import workoutsImage from "@assets/image_1746812138021.png";
import liveRoutineImage from "@assets/partnership_slr.png";
import heroImage from "../assets/hero-image.png";
import journeyBackgroundImage from "../assets/journey-background.jpeg";

const features = [
  {
    title: "Challenges",
    description: "Push your limits and compete in exciting challenges to earn rewards and climb the leaderboards.",
    image: challengesImage,
  },
  {
    title: "Live Routine",
    description: "Start a live routine and get real-time feedback on your runway walk and stage presence.",
    image: liveRoutineImage,
  },
  {
    title: "Practice Library",
    description: "Access a vast library of runway techniques and poses to hone your skills at your own pace.",
    image: practiceLibraryImage,
  },
  {
    title: "AI Coach",
    description: "Get guidance and support from your personal AI pageant coach, available 24/7.",
    image: shifuChatImage,
  },
  {
    title: "Snap Feedback",
    description: "Get instant feedback on your poses by uploading a photo. Perfect your form with precise analysis.",
    image: snapFeedbackImage,
  },
  {
    title: "Workouts",
    description: "Access a range of workouts designed to improve your strength, flexibility, and confidence for pageants.",
    image: workoutsImage,
  },
];

const inspirationalWords = [
  "Strong", "Woman", "Queen", "Miss Teen India", "Powerful", "Potential",
  "Confident", "Radiant", "Unstoppable", "Crown", "Victory", "Excellence",
  "Fierce", "Graceful", "Champion", "Brilliant", "Inspiring", "Magnificent"
];

const whyRunwayAICards = [
  {
    text: "While doing pageants, I felt like I was",
    highlight: "training blind",
    emoji: "🎭"
  },
  {
    text: "No real-time feedback. No way to track progress.",
    highlight: "No personalized coaching.",
    emoji: "😔"
  },
  {
    text: "So I built RunwayAI to help every contestant",
    highlight: "reach their full potential.",
    emoji: "✨"
  }
];

// Interactive Help Chat Component
function InteractiveHelpChat() {
  const [userInput, setUserInput] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [responseSent, setResponseSent] = useState(false);

  const presetSuggestions = [
    "Runway walk practice",
    "Not motivated enough", 
    "Trouble with specific poses",
    "Wants to compete better",
    "Asking questions and planning",
    "Getting instant feedback on posture"
  ];

  const analyzeUserInput = async (prompt: string) => {
    setIsAnalyzing(true);
    
    // Simulate brief processing
    setTimeout(() => {
      setIsAnalyzing(false);
      setResponseSent(true);
    }, 1000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userInput.trim()) {
      analyzeUserInput(userInput.trim());
    }
  };

  const handlePresetClick = (suggestion: string) => {
    setUserInput(suggestion);
    analyzeUserInput(suggestion);
  };

  return (
    <div className="space-y-8">
      {/* Chat Interface */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 border border-pink-200 shadow-lg"
      >
        <div className="flex items-center gap-3 mb-6">
          <MessageCircle className="w-8 h-8 text-pink-500" />
          <h3 className="text-3xl font-bold text-gray-800">What would help you the most?</h3>
        </div>

        {!responseSent ? (
          <>
            {/* Preset Suggestions */}
            <div className="mb-6">
              <div className="flex flex-wrap gap-3">
                {presetSuggestions.map((suggestion, index) => (
                  <motion.button
                    key={index}
                    onClick={() => handlePresetClick(suggestion)}
                    className="px-6 py-3 bg-pink-100 hover:bg-pink-200 text-gray-700 hover:text-gray-900 rounded-full text-base transition-all duration-300 border border-pink-200 hover:border-pink-300"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {suggestion}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSubmit} className="relative">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Or something else"
                className="w-full px-4 py-4 pr-12 bg-white border border-pink-200 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
                disabled={isAnalyzing}
              />
              <button
                type="submit"
                disabled={isAnalyzing || !userInput.trim()}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-pink-500 hover:bg-pink-600 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                {isAnalyzing ? (
                  <Sparkles className="w-5 h-5 text-white animate-spin" />
                ) : (
                  <Send className="w-5 h-5 text-white" />
                )}
              </button>
            </form>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8"
          >
            <div className="text-6xl mb-4">✨</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Response Sent!</h3>
            <p className="text-gray-600">Thank you for sharing what would help you most.</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

export default function RunwayAIWelcome() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-pink-100">
      {/* Navigation - Simplified */}
      <div className="bg-white/80 backdrop-blur-sm py-4 px-6 flex justify-between items-center border-b border-pink-100">
        <span className="text-2xl font-bold text-pink-600">RunwayAI</span>
        <Link href="/app">
          <Button 
            className="bg-pink-600 text-white hover:bg-pink-700 px-6 py-3 text-lg font-semibold"
          >
            Start Training
          </Button>
        </Link>
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-purple-200/80 via-pink-200/80 to-blue-200/80">
        <div className="relative z-10 px-6 pt-32 pb-20 text-center flex flex-col items-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-bold mb-6 leading-tight text-gray-800"
          >
            The AI<br />Pageant Coach
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl md:text-2xl text-gray-700 mb-8 max-w-2xl mx-auto"
          >
            <strong>Unlock your potential</strong> with personalized AI coaching that adapts to your learning style and goals.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Button 
              variant="outline"
              className="text-pink-600 hover:bg-pink-50 px-8 py-4 text-xl font-semibold rounded-lg border border-pink-300 hover:border-pink-400"
              onClick={() => {
                const whySection = document.getElementById('why-runwayai');
                if (whySection) {
                  whySection.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            >
              Why RunwayAI?
            </Button>
            <Link href="/app">
              <Button 
                className="bg-pink-600 text-white hover:bg-pink-700 px-12 py-6 text-3xl font-semibold rounded-lg"
              >
                                 Start Training
              </Button>
            </Link>
            <Button 
              variant="outline" 
              className="text-pink-600 hover:bg-pink-50 px-8 py-4 text-xl font-semibold rounded-lg border border-pink-300 hover:border-pink-400"
              onClick={() => {
                const wordsSection = document.getElementById('inspirational-words');
                if (wordsSection) {
                  wordsSection.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            >
              Inspiration
            </Button>
          </motion.div>
        </div>

        <div className="relative z-10 px-6 pb-20">
          <div className="max-w-4xl mx-auto">
              <img 
                src={heroImage}
                alt="AI Pageant Coach" 
                className="w-full h-auto rounded-lg shadow-2xl border-2 border-pink-200"
              />
          </div>
        </div>
      </div>

      {/* Cinematic Journey Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src={journeyBackgroundImage}
            alt="Your Journey Starts Now" 
            className="w-full h-full object-cover object-center"
          />
          {/* Light overlay for text readability */}
          <div className="absolute inset-0 bg-white/40"></div>
          {/* Gradient overlay for cinematic effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-pink-100/20 via-transparent to-pink-200/60"></div>
        </div>
        
        {/* Animated Text Content */}
        <div className="relative z-10 text-center px-6 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            viewport={{ once: true, margin: "-20%" }}
            className="space-y-8"
          >
            {/* Main Card with Journey Text */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
              whileInView={{ opacity: 1, scale: 1, rotate: 2 }}
              transition={{ duration: 1.5, delay: 0.2, ease: "easeOut" }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.05, rotate: -1 }}
              className="bg-white/95 backdrop-blur-sm rounded-3xl p-12 shadow-2xl border border-pink-200 max-w-4xl mx-auto"
            >
              <h2 className="text-5xl md:text-7xl lg:text-8xl font-bold text-gray-800 leading-tight mb-8">
                <span className="bg-gradient-to-r from-pink-600 via-purple-600 to-pink-700 bg-clip-text text-transparent">
                  Your Journey
                </span>
                <br />
                <span className="text-gray-800">
                  Starts Now!
                </span>
              </h2>
            </motion.div>



            {/* Floating particles effect */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-pink-300/30 rounded-full"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                  animate={{
                    y: [0, -20, 0],
                    opacity: [0.3, 0.8, 0.3],
                    scale: [1, 1.5, 1],
                  }}
                  transition={{
                    duration: 3 + Math.random() * 2,
                    repeat: Infinity,
                    delay: Math.random() * 2,
                  }}
                />
              ))}
            </div>
          </motion.div>
        </div>


      </section>

      {/* Why RunwayAI? Section */}
      <div id="why-runwayai" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.h2 
            className="text-5xl font-bold mb-16 text-center bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            Why RunwayAI?
          </motion.h2>
          
          <div className="space-y-16">
            {whyRunwayAICards.map((card, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -100 : 100, rotate: 0 }}
                whileInView={{ 
                  opacity: 1, 
                  x: 0, 
                  rotate: index % 2 === 0 ? -2 : 2 
                }}
                transition={{ 
                  duration: 0.8, 
                  delay: index * 0.3,
                  type: "spring",
                  stiffness: 100
                }}
                viewport={{ once: true, margin: "-10%" }}
                whileHover={{ 
                  scale: 1.05, 
                  rotate: index % 2 === 0 ? -3 : 3,
                  transition: { duration: 0.3 }
                }}
                className={`max-w-2xl ${index % 2 === 0 ? 'ml-0 mr-auto' : 'ml-auto mr-0'}`}
              >
                <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-pink-200 hover:shadow-2xl transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">{card.emoji}</div>
                    <div>
                      <p className="text-2xl text-gray-700 leading-relaxed">
                        {card.text}{" "}
                        <span className="text-pink-600 font-bold bg-pink-100 px-2 py-1 rounded-lg">
                          {card.highlight}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            className="text-center mt-16"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            viewport={{ once: true }}
          >
            <Button 
              variant="outline"
              className="bg-gradient-to-r from-pink-100 to-purple-100 border-pink-400 text-pink-700 hover:bg-pink-200 hover:text-pink-800 px-8 py-4 text-lg font-semibold rounded-lg transition-all duration-300"
              onClick={() => {
                const bioSection = document.getElementById('arshia-bio');
                if (bioSection) {
                  bioSection.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            >
              Read More About My Journey
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Interactive Help Section */}
      <div id="features" className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <InteractiveHelpChat />
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-pink-200/50 via-purple-200/50 to-blue-200/50 rounded-2xl blur-3xl"></div>
            <div className="relative bg-gradient-to-r from-pink-100/50 via-purple-100/50 to-blue-100/50 rounded-2xl p-12 border border-pink-200">
              <h2 className="text-5xl font-bold mb-6 text-gray-800">Start Your Journey Today</h2>
              <p className="text-xl text-gray-700 mb-8">
                Give yourself the competitive edge with AI-powered pageant training
                </p>
                <Link href="/app">
                <Button 
                  className="bg-pink-600 text-white hover:bg-pink-700 px-8 py-3"
                >
                  Start Training
                  </Button>
                </Link>
              
              <div className="absolute -bottom-8 right-8">
                <div className="w-20 h-20 bg-gradient-to-br from-pink-400 via-purple-400 to-blue-400 rounded-lg transform rotate-12 opacity-80"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Inspirational Words Section */}
      <div id="inspirational-words" className="py-20 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto text-center">
          <motion.h2 
            className="text-4xl font-bold mb-12 bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            You Are
          </motion.h2>
          
          {/* Create 3 rows with different scroll directions */}
          <div className="space-y-6">
            {/* Top Row - Moving Right */}
            <div className="flex gap-6 animate-scroll-right">
              {[...inspirationalWords.slice(0, 6), ...inspirationalWords.slice(0, 6)].map((word, index) => (
                <motion.div
                  key={`top-${index}`}
                  className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-pink-200 hover:border-pink-400 transition-all duration-300 cursor-pointer group shadow-lg hover:shadow-xl flex-shrink-0"
                  whileHover={{ 
                    scale: 1.1, 
                    boxShadow: "0 10px 30px rgba(0,0,0,0.1)"
                  }}
                >
                  <span className="text-xl md:text-2xl font-bold text-gray-800 group-hover:bg-gradient-to-r group-hover:from-pink-600 group-hover:to-purple-600 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300 whitespace-nowrap">
                    {word}
                  </span>
                </motion.div>
              ))}
            </div>

            {/* Middle Row - Moving Left */}
            <div className="flex gap-6 animate-scroll-left">
              {[...inspirationalWords.slice(6, 12), ...inspirationalWords.slice(6, 12)].map((word, index) => (
                <motion.div
                  key={`middle-${index}`}
                  className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-pink-200 hover:border-pink-400 transition-all duration-300 cursor-pointer group shadow-lg hover:shadow-xl flex-shrink-0"
                  whileHover={{ 
                    scale: 1.1, 
                    boxShadow: "0 10px 30px rgba(0,0,0,0.1)"
                  }}
                >
                  <span className="text-xl md:text-2xl font-bold text-gray-800 group-hover:bg-gradient-to-r group-hover:from-pink-600 group-hover:to-purple-600 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300 whitespace-nowrap">
                    {word}
                  </span>
                </motion.div>
              ))}
            </div>

            {/* Bottom Row - Moving Right */}
            <div className="flex gap-6 animate-scroll-right">
              {[...inspirationalWords.slice(12, 18), ...inspirationalWords.slice(12, 18)].map((word, index) => (
                <motion.div
                  key={`bottom-${index}`}
                  className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-pink-200 hover:border-pink-400 transition-all duration-300 cursor-pointer group shadow-lg hover:shadow-xl flex-shrink-0"
                  whileHover={{ 
                    scale: 1.1, 
                    boxShadow: "0 10px 30px rgba(0,0,0,0.1)"
                  }}
                >
                  <span className="text-xl md:text-2xl font-bold text-gray-800 group-hover:bg-gradient-to-r group-hover:from-pink-600 group-hover:to-purple-600 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300 whitespace-nowrap">
                    {word}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Demo Button Section */}
      <div className="py-20 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-pink-300 via-purple-300 to-blue-300 rounded-2xl blur-xl opacity-75 animate-pulse"></div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative"
            >
              <Link href="/app">
                <Button 
                  className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white hover:from-pink-600 hover:via-purple-600 hover:to-blue-600 px-12 py-6 text-2xl font-bold rounded-2xl shadow-2xl border-2 border-white/20 transform transition-all duration-300 hover:shadow-3xl"
                >
                  🚀 Start Training Now
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Arshia Bio Section */}
      <div id="arshia-bio" className="py-20 px-6 bg-gradient-to-br from-pink-100 to-purple-100">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-12 shadow-xl border border-pink-200">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
                className="mb-8"
              >
                <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                  About Arshia Kathpalia
                </h2>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                viewport={{ once: true }}
                className="space-y-6 text-gray-700 leading-relaxed"
              >
                <p className="text-lg">
                  Arshia Kathpalia is the 2024 Miss Teen India USA and a passionate advocate for diversity and inclusion in STEM. As president of her school's Girls Who Code club and a volunteer at Girls Rock Math, Arshia has experienced firsthand the importance of representation for young women. After feeling like she was "training blind" during her pageant preparation, she built RunwayAI to ensure no contestant ever has to face those challenges again.
                </p>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                viewport={{ once: true }}
                className="mt-8"
              >
                <p className="text-pink-600 font-semibold italic text-lg">
                  "Every contestant deserves to reach their full potential. RunwayAI is here to make that possible."
                </p>
                <p className="text-gray-600 mt-2">— Arshia Kathpalia, Founder of RunwayAI</p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-16 px-6 border-t border-pink-200 bg-white/50">
        <div className="max-w-6xl mx-auto flex justify-center items-center text-center">
          <p className="text-gray-600 text-sm">
            Questions? Reach out to <a href="mailto:arshia.x.kathpalia@gmail.com" className="text-pink-600 underline">arshia.x.kathpalia@gmail.com</a> or <a href="mailto:okandy@uw.edu" className="text-pink-600 underline">okandy@uw.edu</a> anytime.
          </p>
        </div>
      </footer>
    </div>
  );
} 