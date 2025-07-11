import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
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
    { name: "David", city: "New York", text: "CoachT's AI feedback is like having a grandmaster watch my every move. My form has improved more in the last month than in the past year." },
    { name: "Kenji", city: "Chicago", text: "I was skeptical about an AI coach, but CoachT is legit. The snap feedback feature is brutally honest and incredibly effective." },
    { name: "Chloe", city: "Philadelphia", text: "As a professional fighter, every detail matters. CoachT helps me spot and correct the smallest flaws in my technique." },
    { name: "Marcus", city: "San Diego", text: "The workout plans are perfectly tailored for martial arts. I've seen a huge improvement in my strength and conditioning." },
    { name: "Daniel", city: "Columbus", text: "The level of detail in the feedback is insane. It's helping me unlearn years of bad habits." },
]

const testimonials_col2 = [
    { name: "Maria", city: "Los Angeles", text: "The practice library is a game-changer. I can drill any kata, anytime. Essential for any serious karateka." },
    { name: "Sarah", city: "Houston", text: "We introduced CoachT at our dojo, and student engagement has skyrocketed. It's the future of martial arts training." },
    { name: "Alex", city: "San Antonio", text: "I never thought an app could capture the nuance of Taekwondo. I was wrong. This is an indispensable tool." },
    { name: "Jessica", city: "Dallas", text: "Shifu Chat is surprisingly insightful. It's great for getting quick advice on my training regimen." },
    { name: "Olivia", city: "Charlotte", text: "From kata to kumite, CoachT has it all. It's the most comprehensive martial arts training app I've ever used." },
]

const testimonials_col3 = [
    { name: "Ben", city: "Phoenix", text: "The challenges are addictive. Competing on the leaderboards has pushed me to train harder than ever." },
    { name: "Tom", city: "Austin", text: "The live routine analysis is mind-blowing. It feels like I'm in a high-tech training facility." },
    { name: "Master Li", city: "Fort Worth", text: "I recommend CoachT to all my students. It reinforces the lessons we cover in class and helps them practice perfectly at home." },
    { name: "James", city: "Indianapolis", text: "This is the training partner that never gets tired. It's pushed my skills to a whole new level." },
    { name: "Michael", city: "Seattle", text: "The platform is incredibly intuitive. I was up and running in minutes, and it's already a core part of my training." },
]


export default function Partnership() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation - Simplified */}
      <div className="bg-black py-4 px-6 flex justify-between items-center">
        <span className="text-2xl font-bold text-red-500">CoachT</span>
        <Button 
          className="bg-white text-black hover:bg-gray-100"
          onClick={() => window.open('https://cal.com/ojas-kandhare/coacht?overlayCalendar=true', '_blank')}
        >
          Schedule a Demo
        </Button>
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-purple-700/80 via-red-600/80 to-blue-600/80">
        <div className="relative z-10 px-6 pt-32 pb-20 text-center flex flex-col items-center">
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
            className="text-lg md:text-xl text-gray-200 mb-8 max-w-2xl mx-auto"
          >
            Empower your students to reach their full potential with personalized, AI-driven instruction.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Button 
              variant="ghost"
              className="text-white hover:bg-white/10 px-6 py-3 text-lg font-semibold rounded-lg border border-transparent hover:border-white/20"
              onClick={() => {
                const benefitsSection = document.getElementById('statistics');
                if (benefitsSection) {
                  benefitsSection.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            >
              Benefits
            </Button>
            <Button 
              className="bg-white text-black hover:bg-gray-100 px-10 py-5 text-2xl font-semibold rounded-lg border border-white/50"
              onClick={() => window.open('https://cal.com/ojas-kandhare/coacht?overlayCalendar=true', '_blank')}
            >
              Schedule Demo
            </Button>
            <Button 
              variant="ghost"
              className="text-white hover:bg-white/10 px-6 py-3 text-lg font-semibold rounded-lg border border-transparent hover:border-white/20"
              onClick={() => {
                const testimonialsSection = document.getElementById('testimonials');
                if (testimonialsSection) {
                  testimonialsSection.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            >
              See Testimonials
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

      {/* Statistics Details Section */}
      <div id="statistics" className="py-20 px-6 bg-black">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-12 text-center">
            <div className="space-y-4">
              <div className="text-5xl font-bold text-red-400">$15k+</div>
              <h3 className="text-xl font-semibold text-white">Additional Revenue</h3>
              <p className="text-gray-300">
                Schools using CoachT generate an additional $15,000+ in revenue through increased enrollment and premium programs.
              </p>
            </div>
            <div className="space-y-4">
              <div className="text-5xl font-bold text-red-400">30%</div>
              <h3 className="text-xl font-semibold text-white">Student Retention</h3>
              <p className="text-gray-300">
                Experience a 30% increase in student retention rates with engaging AI-powered training that keeps students motivated.
              </p>
            </div>
            <div className="space-y-4">
              <div className="text-5xl font-bold text-red-400">15%</div>
              <h3 className="text-xl font-semibold text-white">New Students</h3>
              <p className="text-gray-300">
                Attract 15% more new students with innovative technology that sets your school apart from traditional competitors.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Trusted By Section */}
      <div className="py-20 px-6 bg-black overflow-hidden">
        <div className="max-w-7xl mx-auto text-center">
          <div className="text-gray-400 text-sm mb-12 uppercase tracking-wider">
            TRUSTED BY MARTIAL ARTISTS IN
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

      {/* Features Section */}
      <div id="features" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4">Train Like a Grandmaster</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
             Our AI-powered tools are designed to help you master every technique.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800 flex flex-col group"
              >
                <div className="p-8 flex-grow flex flex-col">
                  <h3 className="text-2xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-gray-400 flex-grow mb-6">{feature.description}</p>
                </div>
                <div className="mt-auto h-64 flex items-center justify-center overflow-hidden">
                  <img src={feature.image} alt={feature.title} className="w-full h-full object-contain transform transition-transform duration-300 group-hover:scale-105"/>
                </div>
              </motion.div>
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
              <h2 className="text-5xl font-bold mb-6">Partner with CoachT</h2>
              <p className="text-xl text-gray-300 mb-8">
                Transform your martial arts school with AI-powered training technology
              </p>
              <Button 
                className="bg-white text-black hover:bg-gray-100 px-8 py-3"
                onClick={() => window.open('https://cal.com/ojas-kandhare/coacht?overlayCalendar=true', '_blank')}
              >
                Schedule a Demo
              </Button>
              
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
          <h2 className="text-4xl font-bold mb-4">Loved by world-class martial artists</h2>
          <p className="text-lg text-gray-400 mb-12">
            Martial artists all around the world reach for CoachT by choice.
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


      {/* Footer */}
      <footer className="py-16 px-6 border-t border-gray-800">
        <div className="max-w-6xl mx-auto flex justify-center items-center text-center">
          <p className="text-gray-400 text-sm">
            Reach out to <a href="mailto:okandy@uw.edu" className="text-white underline">okandy@uw.edu</a> for anything, anytime.
          </p>
        </div>
      </footer>
    </div>
  );
}