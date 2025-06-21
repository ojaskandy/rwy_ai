import React, { useState, useEffect } from 'react';
import { useLocation, Link } from "wouter";
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, Zap, Target, Timer, Flame, Star, Medal, Crown, 
  TrendingUp, Users, ArrowLeft, Lock, ChevronRight, 
  Sword, Shield, Heart, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const Challenges: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('combat');
  const [hoveredChallenge, setHoveredChallenge] = useState<string | null>(null);
  
  const challenges = {
    combat: [
      { 
        name: "Lightning Strikes", 
        id: "max-punches",
        description: "Maximum punches in 30 seconds",
        difficulty: "Intermediate",
        participants: 1247,
        record: "127 punches",
        recordHolder: "DragonFist92",
        icon: Zap,
        color: "from-yellow-500 to-orange-600",
        bgPattern: "combat",
        available: true,
        rewards: ["50 XP", "Lightning Badge", "Leaderboard Spot"]
      },
      { 
        name: "Viper's Reflexes", 
        id: "reaction-time",
        description: "Test your lightning-fast reaction speed",
        difficulty: "Advanced",
        participants: 892,
        record: "0.12s",
        recordHolder: "QuickStrike",
        icon: Target,
        color: "from-green-500 to-emerald-600",
        bgPattern: "reflex",
        available: true,
        rewards: ["75 XP", "Viper Badge", "Speed Master Title"]
      },
      { 
        name: "Tornado Kicks", 
        id: "flashy-kicks",
        description: "Master the most spectacular kicks",
        difficulty: "Expert",
        participants: 567,
        record: "Perfect Form",
        recordHolder: "TornadoMaster",
        icon: Flame,
        color: "from-purple-500 to-pink-600",
        bgPattern: "kicks",
        available: true,
        rewards: ["100 XP", "Tornado Badge", "Style Master Title"]
      }
    ],
    endurance: [
      { 
        name: "Iron Will", 
        id: "endurance-test",
        description: "Hold perfect stance for 5 minutes",
        difficulty: "Expert",
        participants: 234,
        record: "5:47",
        recordHolder: "IronStance",
        icon: Shield,
        color: "from-gray-500 to-slate-600",
        bgPattern: "endurance",
        available: false,
        rewards: ["150 XP", "Iron Will Badge", "Endurance Master"]
      },
      { 
        name: "Balance Beam Breaker", 
        id: "balance-beam",
        description: "Hold a perfect side-kick for 10 seconds on each leg",
        difficulty: "Advanced",
        participants: 678,
        record: "Perfect Form",
        recordHolder: "KickMaster",
        icon: Target,
        color: "from-blue-500 to-cyan-600",
        bgPattern: "precision",
        available: true,
        rewards: ["80 XP", "Balance Badge", "Precision Master"]
      }
    ],
    precision: [
      { 
        name: "Sniper's Focus", 
        id: "precision-strikes",
        description: "Hit targets with perfect accuracy",
        difficulty: "Advanced",
        participants: 445,
        record: "100% accuracy",
        recordHolder: "BullseyeKing",
        icon: Target,
        color: "from-blue-500 to-cyan-600",
        bgPattern: "precision",
        available: false,
        rewards: ["80 XP", "Sniper Badge", "Precision Master"]
      }
    ]
  };

  const categories = [
    { id: 'combat', name: 'Combat', icon: Sword, count: challenges.combat.length },
    { id: 'endurance', name: 'Endurance', icon: Heart, count: challenges.endurance.length },
    { id: 'precision', name: 'Precision', icon: Target, count: challenges.precision.length }
  ];

  const [, navigate] = useLocation();

  const handleChallengeClick = (challengeId: string, available: boolean) => {
    if (!available) return;
    if (challengeId === "max-punches") {
      navigate("/challenges/max-punches");
    } else if (challengeId === "reaction-time") {
      navigate("/challenges/reaction-time");
    } else if (challengeId === "balance-beam") {
      navigate("/challenges/balance-beam");
    } else if (challengeId === "shifu-says") {
      navigate("/challenges/shifu-says");
    } else {
      console.log(`Challenge clicked: ${challengeId}`);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'text-green-400 bg-green-500/20';
      case 'Intermediate': return 'text-yellow-400 bg-yellow-500/20';
      case 'Advanced': return 'text-orange-400 bg-orange-500/20';
      case 'Expert': return 'text-red-400 bg-red-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-red-950/20 text-white relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute top-20 left-10 w-64 h-64 bg-red-500/5 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.2, 1], 
            rotate: [0, 180, 360],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{ duration: 20, repeat: Infinity }}
        />
        <motion.div 
          className="absolute bottom-20 right-10 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl"
          animate={{ 
            scale: [1.2, 1, 1.2], 
            rotate: [360, 180, 0],
            opacity: [0.4, 0.7, 0.4]
          }}
          transition={{ duration: 25, repeat: Infinity }}
        />
      </div>

      <div className="relative z-10 p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <motion.div 
          className="text-center mb-8 sm:mb-12"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="flex items-center justify-center mb-4">
            <Link href="/app">
              <Button variant="ghost" className="text-white hover:bg-red-600/20 mr-4">
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Training
              </Button>
            </Link>
          </div>
          
          <motion.div
            className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-500 to-orange-600 rounded-full mb-6 shadow-2xl shadow-red-500/50"
            whileHover={{ scale: 1.1, rotate: 360 }}
            transition={{ duration: 0.6 }}
          >
            <Trophy className="h-10 w-10 text-white" />
          </motion.div>
          
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black mb-4 bg-gradient-to-r from-red-400 via-orange-500 to-yellow-400 bg-clip-text text-transparent">
            CHALLENGE ARENA
          </h1>
          <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto">
            Push your limits. Break records. Become legendary.
          </p>
          
          {/* Stats Bar */}
          <motion.div 
            className="flex justify-center items-center gap-8 mt-8 text-sm"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-400" />
              <span className="text-gray-400">2,138 Active Competitors</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-400" />
              <span className="text-gray-400">+47% This Week</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Shifu Says - Special Featured Challenge */}
        <motion.div 
          className="max-w-4xl mx-auto mb-12 sm:mb-16"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          {/* Golden Section Header */}
          <motion.div 
            className="text-center mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="inline-flex items-center gap-3 mb-4">
              <motion.div
                className="w-2 h-2 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full"
                animate={{ scale: [1, 1.5, 1], opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-transparent bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 bg-clip-text font-bold text-lg tracking-widest">
                FEATURED CHALLENGE
              </span>
              <motion.div
                className="w-2 h-2 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full"
                animate={{ scale: [1, 1.5, 1], opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity, delay: 1 }}
              />
            </div>
          </motion.div>

          {/* Shifu Says Challenge Card */}
          <motion.div
            className="relative group cursor-pointer"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.3 }}
            onClick={() => handleChallengeClick('shifu-says', true)}
          >
            {/* Golden Glow Effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 via-amber-500/30 to-yellow-600/20 rounded-3xl blur-xl"
              animate={{ 
                scale: [1, 1.05, 1], 
                opacity: [0.6, 0.8, 0.6] 
              }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            
            {/* Main Card */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600 p-[3px] shadow-2xl shadow-yellow-500/50">
              <div className="relative bg-gradient-to-br from-gray-900 via-amber-950/20 to-gray-900 rounded-3xl p-8 sm:p-10 backdrop-blur-xl border border-yellow-500/20">
                
                {/* Shifu Avatar and Title */}
                <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8 mb-8">
                  <motion.div 
                    className="relative"
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Shifu Image with Golden Aura */}
                    <div className="relative w-24 h-24 sm:w-32 sm:h-32">
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 rounded-full blur-md opacity-75"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      />
                      <div className="relative w-full h-full bg-gradient-to-br from-yellow-400 to-amber-600 rounded-full p-1 shadow-lg shadow-yellow-500/50">
                        <img 
                          src="/images/shifu_coacht.png" 
                          alt="Shifu" 
                          className="w-full h-full object-contain rounded-full bg-gray-900"
                        />
                      </div>
                    </div>
                    
                    {/* Floating Golden Particles */}
                    <motion.div
                      className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-400 rounded-full opacity-80"
                      animate={{ 
                        y: [-5, -15, -5],
                        opacity: [0.8, 0.4, 0.8]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <motion.div
                      className="absolute -bottom-2 -left-2 w-3 h-3 bg-amber-500 rounded-full opacity-60"
                      animate={{ 
                        y: [-3, -10, -3],
                        opacity: [0.6, 0.3, 0.6]
                      }}
                      transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
                    />
                  </motion.div>

                  <div className="flex-1 text-center sm:text-left">
                    <motion.h2 
                      className="text-4xl sm:text-5xl font-black mb-3 bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 bg-clip-text text-transparent"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 }}
                    >
                      SHIFU SAYS
                    </motion.h2>
                    <motion.p 
                      className="text-amber-100 text-lg sm:text-xl mb-4"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 }}
                    >
                      Follow the master's commands in this legendary challenge of precision and reflexes
                    </motion.p>
                    
                    {/* Golden Difficulty Badge */}
                    <motion.div
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400/20 to-amber-500/20 backdrop-blur-sm border border-yellow-400/30 rounded-full px-4 py-2"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.9 }}
                    >
                      <Crown className="h-5 w-5 text-yellow-400" />
                      <span className="text-yellow-300 font-bold text-sm">LEGENDARY</span>
                      <motion.div
                        className="w-2 h-2 bg-yellow-400 rounded-full"
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                    </motion.div>
                  </div>
                </div>

                {/* Challenge Stats in Golden Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 mb-8">
                  <div className="text-center p-4 bg-yellow-500/10 rounded-2xl border border-yellow-400/20">
                    <div className="text-2xl sm:text-3xl font-bold text-yellow-400 mb-1">156</div>
                    <div className="text-amber-200 text-sm">Masters</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-500/10 rounded-2xl border border-yellow-400/20">
                    <div className="text-2xl sm:text-3xl font-bold text-yellow-400 mb-1">97%</div>
                    <div className="text-amber-200 text-sm">Best Score</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-500/10 rounded-2xl border border-yellow-400/20">
                    <div className="text-2xl sm:text-3xl font-bold text-yellow-400 mb-1">0.8s</div>
                    <div className="text-amber-200 text-sm">Avg Time</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-500/10 rounded-2xl border border-yellow-400/20">
                    <div className="text-2xl sm:text-3xl font-bold text-yellow-400 mb-1">12</div>
                    <div className="text-amber-200 text-sm">Rounds</div>
                  </div>
                </div>

                {/* Description and Rewards */}
                <div className="mb-8">
                  <div className="bg-gradient-to-r from-yellow-500/10 to-amber-500/10 rounded-2xl p-6 border border-yellow-400/20 mb-6">
                    <h4 className="text-yellow-300 font-bold text-lg mb-3 flex items-center gap-2">
                      <Star className="h-5 w-5" />
                      The Master's Challenge
                    </h4>
                    <p className="text-amber-100 leading-relaxed">
                      Test your reflexes and precision as Shifu calls out complex martial arts sequences. 
                      You must perform the exact moves in perfect timing. Only true masters can achieve the golden rank!
                    </p>
                  </div>

                  {/* Golden Rewards */}
                  <div>
                    <h5 className="text-yellow-300 font-semibold text-sm mb-3 tracking-wide">LEGENDARY REWARDS</h5>
                    <div className="flex flex-wrap gap-2">
                      <span className="bg-gradient-to-r from-yellow-400/20 to-amber-500/20 border border-yellow-400/30 text-yellow-200 px-3 py-1 rounded-lg text-sm font-medium">
                        500 XP
                      </span>
                      <span className="bg-gradient-to-r from-yellow-400/20 to-amber-500/20 border border-yellow-400/30 text-yellow-200 px-3 py-1 rounded-lg text-sm font-medium">
                        Golden Master Badge
                      </span>
                      <span className="bg-gradient-to-r from-yellow-400/20 to-amber-500/20 border border-yellow-400/30 text-yellow-200 px-3 py-1 rounded-lg text-sm font-medium">
                        Shifu's Blessing Title
                      </span>
                      <span className="bg-gradient-to-r from-yellow-400/20 to-amber-500/20 border border-yellow-400/30 text-yellow-200 px-3 py-1 rounded-lg text-sm font-medium">
                        Hall of Fame
                      </span>
                    </div>
                  </div>
                </div>

                {/* Golden Action Button */}
                <motion.div
                  className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 p-[2px] shadow-xl shadow-yellow-500/50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 rounded-2xl p-4 text-center">
                    <motion.div
                      className="flex items-center justify-center gap-3 text-gray-900 font-black text-lg"
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Crown className="h-6 w-6" />
                      <span>ACCEPT SHIFU'S CHALLENGE</span>
                      <ChevronRight className="h-6 w-6" />
                    </motion.div>
                  </div>

                  {/* Shimmer Effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    animate={{ x: [-100, 400] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  />
                </motion.div>

                {/* Floating Golden Orbs */}
                <motion.div
                  className="absolute top-6 right-6 w-3 h-3 bg-yellow-400 rounded-full opacity-60"
                  animate={{ 
                    scale: [1, 1.5, 1],
                    opacity: [0.6, 0.3, 0.6]
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
                <motion.div
                  className="absolute bottom-8 left-6 w-2 h-2 bg-amber-500 rounded-full opacity-50"
                  animate={{ 
                    scale: [1, 1.8, 1],
                    opacity: [0.5, 0.2, 0.5]
                  }}
                  transition={{ duration: 4, repeat: Infinity, delay: 1 }}
                />
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Category Navigation */}
        <motion.div 
          className="flex justify-center mb-8 sm:mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex bg-gray-900/50 rounded-2xl p-2 backdrop-blur-xl border border-gray-800">
            {categories.map((category) => (
              <motion.button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-2 px-4 sm:px-6 py-3 rounded-xl transition-all duration-300 ${
                  selectedCategory === category.id 
                    ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg shadow-red-500/30' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <category.icon className="h-5 w-5" />
                <span className="font-semibold">{category.name}</span>
                <span className="bg-white/20 px-2 py-1 rounded-full text-xs">{category.count}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Challenges Grid */}
        <motion.div 
          className="max-w-7xl mx-auto"
          layout
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedCategory}
              className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              {challenges[selectedCategory as keyof typeof challenges].map((challenge, index) => (
                <motion.div
                  key={challenge.id}
                  className={`relative group cursor-pointer ${!challenge.available ? 'opacity-60' : ''}`}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onMouseEnter={() => setHoveredChallenge(challenge.id)}
                  onMouseLeave={() => setHoveredChallenge(null)}
                  onClick={() => handleChallengeClick(challenge.id, challenge.available)}
                  whileHover={{ scale: challenge.available ? 1.02 : 1 }}
                >
                  {/* Challenge Card */}
                  <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${challenge.color} p-[2px] shadow-2xl`}>
                    <div className="relative bg-gray-900/95 rounded-3xl p-6 sm:p-8 h-full backdrop-blur-xl">
                      {/* Lock Overlay */}
                      {!challenge.available && (
                        <div className="absolute inset-0 bg-gray-900/80 rounded-3xl flex items-center justify-center z-10">
                          <div className="text-center">
                            <Lock className="h-12 w-12 text-gray-500 mx-auto mb-3" />
                            <p className="text-gray-400 font-semibold">Coming Soon</p>
                          </div>
                        </div>
                      )}

                      {/* Challenge Icon */}
                      <motion.div 
                        className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${challenge.color} rounded-2xl mb-6 shadow-lg`}
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.6 }}
                      >
                        <challenge.icon className="h-8 w-8 text-white" />
                      </motion.div>

                      {/* Challenge Info */}
                      <div className="mb-6">
                        <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">{challenge.name}</h3>
                        <p className="text-gray-300 text-base sm:text-lg mb-4">{challenge.description}</p>
                        
                        {/* Difficulty Badge */}
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${getDifficultyColor(challenge.difficulty)}`}>
                          <Star className="h-4 w-4 mr-1" />
                          {challenge.difficulty}
                        </span>
                      </div>

                      {/* Stats */}
                      <div className="space-y-3 mb-6">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Participants</span>
                          <span className="text-white font-semibold">{challenge.participants.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Record</span>
                          <span className="text-yellow-400 font-semibold">{challenge.record}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Record Holder</span>
                          <div className="flex items-center gap-1">
                            <Crown className="h-4 w-4 text-yellow-400" />
                            <span className="text-yellow-400 font-semibold">{challenge.recordHolder}</span>
                          </div>
                        </div>
                      </div>

                      {/* Rewards */}
                      <div className="mb-6">
                        <h4 className="text-sm font-semibold text-gray-400 mb-2">REWARDS</h4>
                        <div className="flex flex-wrap gap-2">
                          {challenge.rewards.map((reward, idx) => (
                            <span key={idx} className="bg-gray-800/60 text-gray-300 px-2 py-1 rounded-lg text-xs">
                              {reward}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Action Button */}
                      <motion.div
                        className={`flex items-center justify-between p-4 rounded-2xl ${
                          challenge.available 
                            ? `bg-gradient-to-r ${challenge.color} shadow-lg` 
                            : 'bg-gray-800/50'
                        }`}
                        whileHover={challenge.available ? { scale: 1.02 } : {}}
                      >
                        <span className="text-white font-bold">
                          {challenge.available ? 'START CHALLENGE' : 'LOCKED'}
                        </span>
                        {challenge.available && <ChevronRight className="h-5 w-5 text-white" />}
                      </motion.div>

                      {/* Hover Effect */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                      />
                    </div>
                  </div>

                  {/* Floating Glow Effect */}
                  <motion.div
                    className={`absolute inset-0 bg-gradient-to-br ${challenge.color} rounded-3xl blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500 -z-10`}
                    animate={hoveredChallenge === challenge.id ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div 
          className="text-center mt-16 sm:mt-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <p className="text-gray-400 text-lg mb-6">Ready to make history?</p>
          <motion.div
            className="inline-flex items-center gap-2 text-red-400 font-semibold"
            animate={{ x: [0, 5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Timer className="h-5 w-5" />
            <span>New challenges drop weekly</span>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Challenges; 