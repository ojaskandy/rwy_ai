import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Form schema for name and email
const formSchema = z.object({
  fullName: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
});

type FormValues = z.infer<typeof formSchema>;

export default function Early() {
  const { toast } = useToast();
  const [currentStage, setCurrentStage] = useState<'intro' | 'messages' | 'spotlight' | 'landing' | 'form' | 'submitted'>('intro');
  const [visibleMessages, setVisibleMessages] = useState<number[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formStep, setFormStep] = useState<'name' | 'email' | 'submit'>('name');
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ fullName: '', email: '' });

  const whyRunwayAICards = [
    {
      text: "We all need a little help",
      highlight: "before the spotlight hits.",
      emoji: "💫"
    },
    {
      text: "Runway AI is like your pageant bestie — giving sweet, honest feedback on your walk, your answers,",
      highlight: "and everything in between.",
      emoji: "💁‍♀️"
    },
    {
      text: "It's not about being perfect, it's about",
      highlight: "growing with every step (in heels, of course).",
      emoji: "👠"
    },
    {
      text: "We're not flawless —",
      highlight: "but we're pretty fabulous trying.",
      emoji: "✨"
    }
  ];

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      email: "",
    }
  });

  const signupMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const payload = {
        ...data,
        referralSource: "runway-ai-early-access",
        newsletterOptIn: true,
      };
      
      const response = await apiRequest("POST", "/api/early-access", payload);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Something went wrong");
      }
      return response.json();
    },
    onSuccess: () => {
      setSubmitted(true);
      toast({
        title: "Thank you for your interest in Runway AI! ✨",
        description: "We're putting the finishing touches on something amazing.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Oops!",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  });

  const onSubmit = () => {
    signupMutation.mutate(formData);
  };

  const handleNext = () => {
    if (formStep === 'name' && formData.fullName.trim()) {
      setFormStep('email');
    } else if (formStep === 'email' && formData.email.trim()) {
      // Auto-submit immediately after email
      onSubmit();
    }
  };

  // Handle the interactive sequence
  useEffect(() => {
    if (currentStage === 'intro') {
      // Show title for 2 seconds, then start messages
      const timer = setTimeout(() => {
        setCurrentStage('messages');
      }, 2000);
      return () => clearTimeout(timer);
    }

    if (currentStage === 'messages') {
      // Start showing messages with faster timing
      whyRunwayAICards.forEach((_, index) => {
        // Add extra 0.5s for the 4th message (index 3)
        const delay = index === 3 ? (index * 2000) + 500 : index * 2000;
        
        setTimeout(() => {
          setVisibleMessages(prev => [...prev, index]);
          
          // After the last message, show "Own the Spotlight" first
          if (index === whyRunwayAICards.length - 1) {
            setTimeout(() => {
              setCurrentStage('spotlight');
            }, 2000);
          }
        }, delay);
      });
    }

    if (currentStage === 'spotlight') {
      // Transition to landing after 3 seconds
      const timer = setTimeout(() => {
        setCurrentStage('landing');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [currentStage, whyRunwayAICards.length]);

  // Generate stationary photo cluster
  const generatePhotoCluster = () => {
    const photoUrls = [
      '/photos/pic1.jpeg',
      '/photos/pic2.jpeg', 
      '/photos/pic3.jpeg',
      '/photos/pic4.jpeg',
      '/photos/pic5.jpeg',
      '/photos/pic6.jpg',
      '/photos/pic7.jpeg',
      '/photos/pic8.jpeg',
    ];

    const positions = [
      { top: '15px', left: '45%', rotate: '-12deg', size: 'w-14 h-14' },
      { top: '25px', left: '55%', rotate: '8deg', size: 'w-16 h-16' },
      { top: '40px', left: '40%', rotate: '15deg', size: 'w-12 h-12' },
      { top: '45px', left: '62%', rotate: '-8deg', size: 'w-14 h-14' },
      { top: '8px', left: '52%', rotate: '5deg', size: 'w-12 h-12' },
      { top: '60px', left: '48%', rotate: '-15deg', size: 'w-12 h-12' },
    ];

    return positions.map((pos, i) => {
      const photoIndex = i % photoUrls.length;
      
      return (
        <div
          key={i}
          className={`absolute ${pos.size} transition-transform hover:scale-110 hover:z-20`}
          style={{
            top: pos.top,
            left: pos.left,
            transform: `rotate(${pos.rotate})`,
            zIndex: 10 - i,
          }}
        >
          <div className="w-full h-full bg-white rounded-lg shadow-lg border-2 border-pink-200 overflow-hidden">
            <img 
              src={photoUrls[photoIndex]}
              alt={`Photo ${i + 1}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback to placeholder if photo doesn't exist
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const placeholder = target.nextElementSibling as HTMLElement;
                if (placeholder) placeholder.style.display = 'flex';
              }}
            />
            {/* Fallback placeholder */}
            <div className="w-full h-full bg-gradient-to-br from-pink-300 to-pink-400 flex items-center justify-center text-xs text-white font-semibold" style={{ display: 'none' }}>
              📸
            </div>
          </div>
        </div>
      );
    });
  };

  // Intro stage - just "Runway AI" in pink
  if (currentStage === 'intro') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-8">
        <div className="animate-title-fade-in flex items-center gap-6">
          <img 
            src="/photos/rwyailogotransparent_1753321576297-CFvC0vTg.png" 
            alt="Runway AI Logo" 
            className="h-16 md:h-20 w-auto"
          />
          <h1 className="text-6xl md:text-8xl font-bold text-pink-500 tracking-wider">
            RUNWAY AI
          </h1>
        </div>
      </div>
    );
  }

  // Messages stage - show messages appearing one by one
  if (currentStage === 'messages') {
    return (
      <div className="min-h-screen bg-white relative overflow-hidden">

        {/* Title at top - fixed position */}
        <div className="pt-16 pb-20 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-pink-500 tracking-wider">
            RUNWAY AI
          </h1>
        </div>

        {/* Messages container - structured layout with more spacing */}
        <div className="px-8 pb-32">
          <div className="max-w-6xl mx-auto space-y-16">
            {whyRunwayAICards.map((card, index) => {
              const isVisible = visibleMessages.includes(index);
              const shouldPushUp = visibleMessages.length > index + 1;
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -100 : 100, rotate: 0 }}
                  animate={{ 
                    opacity: isVisible ? 1 : 0, 
                    x: isVisible ? 0 : (index % 2 === 0 ? -100 : 100), 
                    rotate: isVisible ? (index % 2 === 0 ? -2 : 2) : 0,
                    y: 0
                  }}
                  transition={{ 
                    duration: 0.8, 
                    delay: index * 0.5,
                    type: "spring",
                    stiffness: 100
                  }}
                  whileHover={{ 
                    scale: 1.05, 
                    rotate: index % 2 === 0 ? -3 : 3,
                    transition: { duration: 0.3 }
                  }}
                  className={`max-w-2xl ${index % 2 === 0 ? 'ml-0 mr-auto' : 'ml-auto mr-0'}`}
                  style={{
                    position: 'relative',
                    zIndex: 20
                  }}
                >
                  <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-12 shadow-xl border border-pink-200 hover:shadow-2xl transition-all duration-300">
                    <div className="flex items-start gap-6">
                      <div className="text-5xl">{card.emoji}</div>
                      <div>
                        <p className="text-xl md:text-2xl text-gray-700 leading-relaxed">
                          {card.text}{" "}
                          <span className="text-pink-600 font-bold bg-pink-100 px-3 py-2 rounded-lg">
                            {card.highlight}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }



  // Spotlight stage - just show "Own the Spotlight" 
  if (currentStage === 'spotlight') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        {/* Cute photo cluster at top */}
        <div className="absolute top-0 left-0 w-full h-24 pointer-events-none z-10">
          {generatePhotoCluster()}
        </div>
        
        <div className="text-center animate-title-fade-in">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-wide text-gray-800 px-4 leading-tight">
            OWN THE SPOTLIGHT
          </h1>
        </div>
      </div>
    );
  }

  // Landing stage - main page with floating photo frames
  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden flex flex-col">

      {/* Cute photo cluster at top */}
      <div className="absolute top-0 left-0 w-full h-24 pointer-events-none z-10">
        {generatePhotoCluster()}
      </div>

      {/* Main content - centered with more spacing */}
      <div className="relative z-10 flex flex-col items-center justify-center flex-1 text-center px-8 py-16">
        {/* Bigger Logo with more space */}
        <img 
          src="/photos/rwyailogotransparent_1753321576297-CFvC0vTg.png" 
          alt="Runway AI Logo" 
          className="h-24 md:h-32 lg:h-36 w-auto mb-8"
        />
        
        {/* Small brand text with more margin */}
        <div className="text-sm tracking-[0.4em] text-gray-500 font-medium mb-8">
          RUNWAY AI
        </div>
        
        {/* Large title with better line height */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-wide text-gray-800 mb-10 px-4 leading-tight">
          OWN THE SPOTLIGHT
        </h1>
        
        {/* Tagline with more space */}
        <p className="text-lg md:text-xl text-pink-600 font-medium mb-16 tracking-wide max-w-md">
          Built by pageant queens, for pageant queens
        </p>
        
        {/* Form or Get Started Button with better spacing */}
        {!showForm ? (
          <button
            onClick={() => {
              setShowForm(true);
              setFormStep('name');
            }}
            className="group relative bg-gradient-to-r from-pink-400 via-pink-500 to-rose-500 text-white font-semibold text-xl px-16 py-6 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:from-pink-500 hover:via-pink-600 hover:to-rose-600"
          >
            <span className="relative z-10">Get Started</span>
            <div className="absolute inset-0 bg-gradient-to-r from-pink-300 via-pink-400 to-rose-400 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
          </button>
        ) : !submitted ? (
          <motion.div
            key={formStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-lg space-y-8 bg-white/95 backdrop-blur-sm p-12 rounded-3xl shadow-xl border border-pink-200"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Join Early Access</h2>
              <p className="text-gray-600">Be the first to know when we launch!</p>
            </div>

            <div className="space-y-6">
              {formStep === 'name' && (
                <div>
                  <Label htmlFor="fullName" className="text-gray-900 text-base font-medium mb-3 block">
                    What's your name?
                  </Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                    className="mt-2 h-14 text-lg text-black placeholder-gray-400 bg-white border-gray-300 focus:border-pink-500 focus:ring-pink-500 rounded-xl"
                    placeholder="Enter your full name"
                    autoFocus
                  />
                </div>
              )}

              {formStep === 'email' && (
                <div>
                  <Label htmlFor="email" className="text-gray-900 text-base font-medium mb-3 block">
                    What's your email?
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="mt-2 h-14 text-lg text-black placeholder-gray-400 bg-white border-gray-300 focus:border-pink-500 focus:ring-pink-500 rounded-xl"
                    placeholder="Enter your email address"
                    autoFocus
                  />
                </div>
              )}

              <button
                onClick={handleNext}
                disabled={
                  signupMutation.isPending ||
                  (formStep === 'name' && !formData.fullName.trim()) ||
                  (formStep === 'email' && !formData.email.trim())
                }
                className="w-full h-14 bg-gradient-to-r from-pink-400 via-pink-500 to-rose-500 hover:from-pink-500 hover:via-pink-600 hover:to-rose-600 text-white text-lg font-semibold rounded-xl transition-all duration-300 hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
              >
                {signupMutation.isPending 
                  ? "Joining..." 
                  : "Continue"
                }
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center bg-white/95 backdrop-blur-sm p-12 rounded-3xl shadow-xl border border-pink-200 max-w-lg"
          >
            <div className="text-6xl mb-6">🎉</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Thank you!</h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Thank you for your interest in Runway AI. We're putting the finishing touches on something amazing.
            </p>
          </motion.div>
        )}
      </div>

      {/* Footer with better spacing */}
      <footer className="relative z-10 bg-white/80 backdrop-blur-sm border-t border-gray-200 py-8">
        <div className="max-w-4xl mx-auto px-8 flex flex-col md:flex-row items-center justify-center gap-8 text-base">
          <button
            onClick={() => window.open('mailto:arshia.x.kathpalia@gmail.com,okandy@uw.edu?subject=Contact Runway AI', '_blank')}
            className="text-gray-600 hover:text-pink-600 font-medium transition-colors duration-200"
          >
            Contact
          </button>
          <button
            onClick={() => window.location.href = '/welcome'}
            className="text-gray-600 hover:text-pink-600 font-medium transition-colors duration-200"
          >
            Learn More
          </button>
          <button
            onClick={() => window.location.href = '/privacy'}
            className="text-gray-600 hover:text-pink-600 font-medium transition-colors duration-200"
          >
            Privacy Policy
          </button>
        </div>
      </footer>
    </div>
  );
} 