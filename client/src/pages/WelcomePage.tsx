import { useState, useEffect } from "react";
import { Link } from "wouter";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowDown, ArrowRight } from "lucide-react";
import silhouetteImage from "@assets/image_1750268882265.png";

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

const rotatingTexts = [
  "Built by Martial Artists",
  "Your Competitive Edge",
  "Advance Faster",
  "Next Belt Awaits",
  "Revolutionary Training",
  "AI-Powered Mastery"
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
      setCurrentTextIndex((prev) => (prev + 1) % rotatingTexts.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Hide scroll hint after user starts scrolling
  useEffect(() => {
    const unsubscribe = scrollY.onChange((latest) => {
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

          {/* Rotating text with icon */}
          <motion.div
            className="mb-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <AnimatePresence mode="wait">
                <motion.span
                  key={currentTextIndex}
                  className="text-lg text-gray-300"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                >
                  {rotatingTexts[currentTextIndex]}
                </motion.span>
              </AnimatePresence>
            </div>

            <motion.h3 
              className="text-4xl md:text-5xl font-bold text-white mb-8"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.9 }}
              viewport={{ once: true }}
            >
              Form Perfection
            </motion.h3>
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

      {/* Additional spacing for scroll effect */}
      <div className="h-screen"></div>
    </div>
  );
}