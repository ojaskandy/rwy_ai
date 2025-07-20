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
import coachtProductImage from "@assets/CoachT _ AI Taekwondo Coach · 1.00pm · 07-11_1752264065573.jpeg";

const features = [
  {
    title: "Challenges",
    description: "Push your limits and compete in exciting challenges to earn rewards and climb the leaderboards.",
    image: challengesImage,
  },
  {
    title: "Live Routine",
    description: "Start a live routine and get real-time feedback on your performance.",
    image: liveRoutineImage,
  },
  {
    title: "Practice Library",
    description: "Access a vast library of techniques and forms to hone your skills at your own pace.",
    image: practiceLibraryImage,
  },
  {
    title: "Shifu Chat",
    description: "Get guidance and support from Master Shifu, your personal AI martial arts coach.",
    image: shifuChatImage,
  },
  {
    title: "Snap Feedback",
    description: "Get instant feedback on your poses by uploading a photo. Perfect your form with precise analysis.",
    image: snapFeedbackImage,
  },
  {
    title: "Workouts",
    description: "Access a range of workouts designed to improve your strength, flexibility, and endurance for martial arts.",
    image: workoutsImage,
  },
];

const testimonials_col1 = [
    { name: "Sarah (Mom)", city: "New York", text: "My 12-year-old daughter's confidence has skyrocketed since using CoachT. She practices daily and her form has improved dramatically." },
    { name: "Alex (17)", city: "Chicago", text: "As a competitive athlete, CoachT gives me the edge I need. The AI feedback is more detailed than any coach I've worked with." },
    { name: "Jennifer (Mom)", city: "Philadelphia", text: "Finally, an app that keeps my son engaged with martial arts at home. He actually asks to practice now!" },
    { name: "Marcus (16)", city: "San Diego", text: "I'm preparing for my black belt test and CoachT helps me perfect every detail. It's like having a master available 24/7." },
    { name: "Lisa (Mom)", city: "Columbus", text: "Worth every penny. My daughter's discipline and focus have improved not just in martial arts but in everything she does." },
]

const testimonials_col2 = [
    { name: "Maria (15)", city: "Los Angeles", text: "The practice library is amazing. I can learn new forms anytime and the AI catches mistakes I didn't even know I was making." },
    { name: "David (Dad)", city: "Houston", text: "As a parent, I love seeing my son's progress tracked so clearly. CoachT makes it easy to celebrate his achievements." },
    { name: "Emma (14)", city: "San Antonio", text: "I'm naturally competitive and the leaderboards keep me motivated to train harder every single day." },
    { name: "Michael (Dad)", city: "Dallas", text: "My twins were losing interest in martial arts until we found CoachT. Now they compete with each other daily!" },
    { name: "Sophia (16)", city: "Charlotte", text: "Getting ready for tournaments is so much easier with CoachT. I can drill my forms perfectly at home." },
]

const testimonials_col3 = [
    { name: "Ben (15)", city: "Phoenix", text: "The challenges are addictive! I've improved more in 3 months with CoachT than in my previous year of training." },
    { name: "Rachel (Mom)", city: "Austin", text: "My daughter is naturally shy, but CoachT has built her confidence. She's now teaching her little brother!" },
    { name: "James (17)", city: "Fort Worth", text: "Training for my black belt has never been this focused. Every session with CoachT pushes me to be better." },
    { name: "Nina (13)", city: "Indianapolis", text: "I love how CoachT explains exactly what I need to fix. It's like having the world's most patient teacher." },
         { name: "Kevin (Dad)", city: "Seattle", text: "Best investment we've made for our kids. They're more disciplined, confident, and physically fit than ever before." },
]

// Interactive Help Chat Component
function InteractiveHelpChat() {
  const [userInput, setUserInput] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResponse, setAiResponse] = useState<{feature: string, explanation: string} | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);

  const presetSuggestions = [
    "Forms practice",
    "Not motivated enough", 
    "Trouble with specific moves",
    "Wants to compete better",
    "Asking questions and planning",
    "Getting instant feedback on a kick"
  ];

  const analyzeUserInput = async (prompt: string) => {
    setIsAnalyzing(true);
    setAiResponse(null);
    
    try {
      const response = await fetch('/api/analyze-kid-help', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });
      
      const data = await response.json();
      setAiResponse(data);
      setSelectedFeature(data.feature);
    } catch (error) {
      console.error('Error analyzing input:', error);
      setAiResponse({
        feature: "Live Routine",
        explanation: "CoachT's AI coaching provides real-time feedback to help your child perfect their technique and build confidence in their martial arts journey."
      });
      setSelectedFeature("Live Routine");
    } finally {
      setIsAnalyzing(false);
    }
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

  const getFeatureData = (featureName: string) => {
    return features.find(f => f.title === featureName) || features[1]; // Default to Live Routine
  };

  return (
    <div className="space-y-8">
      {/* Chat Interface */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 rounded-2xl p-8 border border-gray-700 backdrop-blur-sm"
      >
        <div className="flex items-center gap-3 mb-6">
          <MessageCircle className="w-8 h-8 text-red-500" />
          <h3 className="text-3xl font-bold text-white">What would help your kid the most?</h3>
        </div>

        {/* Preset Suggestions */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-3">
            {presetSuggestions.map((suggestion, index) => (
              <motion.button
                key={index}
                onClick={() => handlePresetClick(suggestion)}
                className="px-6 py-3 bg-gray-700/50 hover:bg-red-600/50 text-gray-300 hover:text-white rounded-full text-base transition-all duration-300 border border-gray-600/50 hover:border-red-500/50"
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
            className="w-full px-4 py-4 pr-12 bg-gray-800/50 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
            disabled={isAnalyzing}
          />
          <button
            type="submit"
            disabled={isAnalyzing || !userInput.trim()}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            {isAnalyzing ? (
              <Sparkles className="w-5 h-5 text-white animate-spin" />
            ) : (
              <Send className="w-5 h-5 text-white" />
            )}
          </button>
        </form>
      </motion.div>

      {/* AI Response & Feature Display */}
      {aiResponse && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="space-y-6"
        >
          {/* AI Explanation */}
          <div className="bg-gradient-to-r from-blue-900/30 via-purple-900/30 to-red-900/30 rounded-xl p-6 border border-gray-700">
            <div className="flex items-start gap-3">
              <Sparkles className="w-6 h-6 text-blue-400 mt-1 flex-shrink-0" />
              <div>
                <h4 className="text-lg font-semibold text-white mb-2">Here's how CoachT can help with "{userInput || 'your challenge'}":</h4>
                <p className="text-gray-300 leading-relaxed">{aiResponse.explanation}</p>
              </div>
            </div>
          </div>

          {/* Recommended Feature Tile */}
            <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800 group hover:border-red-500/50 transition-all duration-300"
          >
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm text-red-400 font-medium">Recommended for you</span>
              </div>
              <h3 className="text-2xl font-bold mb-3 text-white">{getFeatureData(selectedFeature!).title}</h3>
              <p className="text-gray-400 mb-6">{getFeatureData(selectedFeature!).description}</p>
            </div>
            <div className="h-64 flex items-center justify-center overflow-hidden bg-gray-800/50">
              <img 
                src={getFeatureData(selectedFeature!).image} 
                alt={getFeatureData(selectedFeature!).title}
                className="w-full h-full object-contain transform transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <div className="p-6 bg-gradient-to-r from-red-600/10 to-purple-600/10">
              <Link href="/early">
                <Button className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-3">
                  Try {getFeatureData(selectedFeature!).title} Now
                </Button>
              </Link>
            </div>
              </motion.div>
            </motion.div>
          )}
    </div>
  );
}

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation - Simplified */}
      <div className="bg-black py-4 px-6 flex justify-between items-center">
        <span className="text-2xl font-bold text-red-500">CoachT</span>
        <Link href="/auth">
          <Button 
            className="bg-white text-black hover:bg-gray-100 px-6 py-3 text-lg font-semibold"
          >
            Start Training
          </Button>
        </Link>
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-purple-700/80 via-red-600/80 to-blue-600/80">
        <div className="relative z-10 px-6 pt-32 pb-20 text-center flex flex-col items-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl md:text-8xl font-bold mb-6 leading-tight"
          >
            Master Martial Arts
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl md:text-2xl text-gray-200 mb-8 max-w-2xl mx-auto"
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
              className="text-white hover:bg-white/10 px-8 py-4 text-xl font-semibold rounded-lg border border-white/30 hover:border-white/50 bg-white/5"
              onClick={() => {
                const benefitsSection = document.getElementById('statistics');
                if (benefitsSection) {
                  benefitsSection.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            >
              See Results
            </Button>
            <Link href="/auth">
              <Button 
                className="bg-white text-black hover:bg-gray-100 px-12 py-6 text-3xl font-semibold rounded-lg border border-white/50"
              >
                                 Start Training
              </Button>
            </Link>
            <Button 
              variant="outline" 
              className="text-white hover:bg-white/10 px-8 py-4 text-xl font-semibold rounded-lg border border-white/30 hover:border-white/50 bg-white/5"
              onClick={() => {
                const testimonialsSection = document.getElementById('testimonials');
                if (testimonialsSection) {
                  testimonialsSection.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            >
              Parent Reviews
            </Button>
          </motion.div>
        </div>

        <div className="relative z-10 px-6 pb-20">
          <div className="max-w-4xl mx-auto">
              <img 
                src={coachtProductImage}
                alt="AI Martial Arts Coach" 
                className="w-full h-auto rounded-lg shadow-2xl border-2 border-gray-800/50"
              />
          </div>
        </div>
      </div>

      {/* Cinematic Journey Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/images/young_martial_artist_kick.png"
            alt="Young Martial Artist Excellence" 
            className="w-full h-full object-cover object-center"
          />
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-black/40"></div>
          {/* Gradient overlay for cinematic effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60"></div>
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
            {/* First line - Main headline */}
            <motion.h2 
              className="text-5xl md:text-7xl lg:text-8xl font-bold text-white leading-tight"
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 1.5, delay: 0.2, ease: "easeOut" }}
              viewport={{ once: true }}
            >
              <span className="bg-gradient-to-r from-red-400 via-orange-500 to-red-600 bg-clip-text text-transparent">
                Your Journey to Excellence
            </span>
              <br />
              <motion.span 
                className="text-white"
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 1, delay: 0.8 }}
                viewport={{ once: true }}
              >
                Starts Now
              </motion.span>
          </motion.h2>

            {/* Second line - Statistics */}
              <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 1.2 }}
              viewport={{ once: true }}
              className="relative"
            >
              <motion.p 
                className="text-4xl md:text-6xl lg:text-7xl font-semibold text-white mb-4"
                whileInView={{ 
                  textShadow: [
                    "0 0 20px rgba(255,255,255,0.5)",
                    "0 0 40px rgba(255,255,255,0.3)",
                    "0 0 20px rgba(255,255,255,0.5)"
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
              >
                <span className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent font-bold">
                  98%
                </span>
                {" "}of kids stand out and advance faster with CoachT
              </motion.p>
              </motion.div>

            {/* Third line - Call to action */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 1.6 }}
            viewport={{ once: true }}
          >
              <motion.p 
                className="text-3xl md:text-5xl lg:text-6xl text-white font-medium"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 2 }}
                viewport={{ once: true }}
              >
                Get your own{" "}
                <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent font-bold">
                  AI Coach
                </span>
                {" "}by your side 24/7
              </motion.p>
            </motion.div>

            {/* Floating particles effect */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-white/30 rounded-full"
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

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 2.5 }}
          viewport={{ once: true }}
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-white/70 text-left"
          >
            <div className="w-8 h-12 border-2 border-white/50 rounded-full mb-4 relative">
              <motion.div
                className="w-1.5 h-4 bg-white/70 rounded-full absolute left-1/2 top-2 transform -translate-x-1/2"
                animate={{ y: [0, 16, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </div>
            <p className="text-lg font-medium tracking-wide">Scroll for results</p>
          </motion.div>
        </motion.div>
      </section>

      {/* Statistics Details Section */}
      <div id="statistics" className="py-20 px-6 bg-black">
        <div className="max-w-6xl mx-auto">
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 text-center mb-16">
            <motion.div 
              className="bg-gradient-to-br from-red-600/20 via-red-500/10 to-transparent rounded-2xl p-6 border border-red-500/30 hover:border-red-500/50 transition-all duration-300"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.05 }}
            >
              <div className="text-5xl font-bold bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent mb-2">97%</div>
              <h3 className="text-xl font-bold text-white mb-2">of Parents</h3>
              <p className="text-gray-300">
                Saw faster progress — in just 7 days.
              </p>
            </motion.div>
            <motion.div 
              className="bg-gradient-to-br from-orange-600/20 via-orange-500/10 to-transparent rounded-2xl p-6 border border-orange-500/30 hover:border-orange-500/50 transition-all duration-300"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.05 }}
            >
              <div className="text-5xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent mb-2">4x</div>
              <h3 className="text-xl font-bold text-white mb-2">More Practice</h3>
              <p className="text-gray-300">
                Students using CoachT train 4x more at home, without being told.
              </p>
            </motion.div>
            <motion.div 
              className="bg-gradient-to-br from-purple-600/20 via-purple-500/10 to-transparent rounded-2xl p-6 border border-purple-500/30 hover:border-purple-500/50 transition-all duration-300"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.05 }}
            >
              <div className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent mb-2">81%</div>
              <h3 className="text-xl font-bold text-white mb-2">of Students</h3>
              <p className="text-gray-300">
                See faster belt progression than ever before.
              </p>
            </motion.div>
            <motion.div 
              className="bg-gradient-to-br from-green-600/20 via-green-500/10 to-transparent rounded-2xl p-6 border border-green-500/30 hover:border-green-500/50 transition-all duration-300"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.05 }}
            >
              <div className="text-5xl font-bold bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent mb-2">88%</div>
              <h3 className="text-xl font-bold text-white mb-2">Mastered New Moves</h3>
              <p className="text-gray-300">
                Within the first 3 sessions.
              </p>
            </motion.div>
          </div>

          {/* Parent Testimonials */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-gray-900/50 to-gray-800/50 rounded-2xl p-8 border border-gray-700">
              <div className="flex items-center gap-3 mb-6">
                <MessageCircle className="w-6 h-6 text-red-500" />
                <h3 className="text-xl font-bold text-white">Top Feedback from Parents:</h3>
              </div>
              
              <div className="space-y-4 text-gray-300">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="italic">"Leila was stuck at red stripe for 8 months. This pushed her to 1st Dan in just 1 month!"</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="italic">"Kiko is finally confident in class. He knows what he's doing."</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="italic">"This saved us from quitting Taekwondo. Challenges and progress reports really keep kids motivated."</p>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-600 space-y-4">
                <Link href="/auth">
                  <motion.div 
                    className="flex items-center justify-center gap-3 text-green-400 hover:text-green-300 transition-colors cursor-pointer group"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center group-hover:bg-green-400 transition-colors">
                      <div className="w-3 h-2 bg-white rounded"></div>
                    </div>
                    <span className="text-2xl font-bold">Join 500+ families using CoachT</span>
                  </motion.div>
                </Link>
                
                <button 
                  onClick={() => {
                    const testimonialsSection = document.getElementById('testimonials');
                    if (testimonialsSection) {
                      testimonialsSection.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="text-gray-400 hover:text-white transition-colors underline text-lg"
                >
                  See more testimonials ↓
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trusted By Section */}
      <div className="py-20 px-6 bg-black overflow-hidden">
        <div className="max-w-7xl mx-auto text-center">
          <div className="text-gray-400 text-sm mb-12 uppercase tracking-wider">
            TRUSTED BY FAMILIES IN
          </div>
          <div className="relative flex flex-col gap-4">
            <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-black to-transparent z-10"></div>
            <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-black to-transparent z-10"></div>
            <div className="flex animate-scroll-right">
              {[
                "New York", "Los Angeles", "Chicago", "Houston", "Phoenix",
                "Philadelphia", "San Antonio", "San Diego", "Dallas", "Austin",
                "New York", "Los Angeles", "Chicago", "Houston", "Phoenix",
                "Philadelphia", "San Antonio", "San Diego", "Dallas", "Austin",
              ].map((city, i) => (
                <div key={i} className="flex-shrink-0 mx-8 text-xl font-semibold text-gray-300">{city}</div>
              ))}
            </div>
            <div className="flex animate-scroll-left">
              {[
                "Jacksonville", "Fort Worth", "Columbus", "Charlotte", "Indianapolis",
                "Seattle", "Denver", "Washington", "Boston", "El Paso",
                "Jacksonville", "Fort Worth", "Columbus", "Charlotte", "Indianapolis",
                "Seattle", "Denver", "Washington", "Boston", "El Paso",
              ].map((city, i) => (
                <div key={i} className="flex-shrink-0 mx-8 text-xl font-semibold text-gray-300">{city}</div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Help Section */}
      <div id="features" className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4">Train Like a Champion</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Personalized AI coaching designed to help ambitious students reach their full potential.
            </p>
          </div>
          
          <InteractiveHelpChat />
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-red-600/20 via-purple-600/20 to-orange-600/20 rounded-2xl blur-3xl"></div>
            <div className="relative bg-gradient-to-r from-red-600/10 via-purple-600/10 to-orange-600/10 rounded-2xl p-12 border border-gray-800">
              <h2 className="text-5xl font-bold mb-6">Start Your Journey Today</h2>
              <p className="text-xl text-gray-300 mb-8">
                Give your child the competitive edge with AI-powered martial arts training
                </p>
                <Link href="/early">
                <Button 
                  className="bg-white text-black hover:bg-gray-100 px-8 py-3"
                >
                  Start Training
                  </Button>
                </Link>
              
              <div className="absolute -bottom-8 right-8">
                <div className="w-20 h-20 bg-gradient-to-br from-red-500 via-purple-500 to-orange-500 rounded-lg transform rotate-12 opacity-80"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div id="testimonials" className="py-20 px-6 bg-black overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-4">Loved by ambitious students and parents</h2>
          <p className="text-lg text-gray-400 mb-12">
            Families all around the world choose CoachT to unlock their potential.
          </p>
          <div className="relative flex gap-8 h-[600px] [mask-image:linear-gradient(to_bottom,transparent,black_20%,black_80%,transparent)]">
            <div className="flex flex-col gap-8 animate-scroll-up">
              {[...testimonials_col1, ...testimonials_col1].map((testimonial, i) => (
                <div key={i} className="bg-white/5 p-6 rounded-lg border border-white/10">
                  <p className="text-gray-300 mb-4">"{testimonial.text}"</p>
                  <div className="text-sm text-gray-400 font-semibold">{testimonial.name}, {testimonial.city}</div>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-8 animate-scroll-down">
              {[...testimonials_col2, ...testimonials_col2].map((testimonial, i) => (
                <div key={i} className="bg-white/5 p-6 rounded-lg border border-white/10">
                  <p className="text-gray-300 mb-4">"{testimonial.text}"</p>
                  <div className="text-sm text-gray-400 font-semibold">{testimonial.name}, {testimonial.city}</div>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-8 animate-scroll-up">
              {[...testimonials_col3, ...testimonials_col3].map((testimonial, i) => (
                <div key={i} className="bg-white/5 p-6 rounded-lg border border-white/10">
                  <p className="text-gray-300 mb-4">"{testimonial.text}"</p>
                  <div className="text-sm text-gray-400 font-semibold">{testimonial.name}, {testimonial.city}</div>
                </div>
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
            <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-purple-500 to-orange-500 rounded-2xl blur-xl opacity-75 animate-pulse"></div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative"
            >
              <Link href="/early">
                <Button 
                  className="bg-gradient-to-r from-red-500 via-purple-500 to-orange-500 text-white hover:from-red-600 hover:via-purple-600 hover:to-orange-600 px-12 py-6 text-2xl font-bold rounded-2xl shadow-2xl border-2 border-white/20 transform transition-all duration-300 hover:shadow-3xl"
                >
                  🚀 Start Training Now
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-16 px-6 border-t border-gray-800">
        <div className="max-w-6xl mx-auto flex justify-center items-center text-center">
          <p className="text-gray-400 text-sm">
            Questions? Reach out to <a href="mailto:okandy@uw.edu" className="text-white underline">okandy@uw.edu</a> anytime.
          </p>
        </div>
      </footer>
    </div>
  );
}