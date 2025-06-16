import React from 'react';
import { ArrowLeft, Zap, Heart, Users } from 'lucide-react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';

const Workouts: React.FC = () => {
  const [, navigate] = useLocation();

  // Updated workouts data with the requested exercises
  const workouts = [
    { 
      id: "pushups", 
      name: "Pushups", 
      description: "A high-intensity workout targeting all major muscle groups.",
      icon: Zap,
      colorScheme: {
        border: "border-orange-500",
        bg: "from-orange-900/20 to-orange-800/10",
        iconBg: "bg-orange-500",
        glow: "shadow-orange-500/20"
      }
    },
    { 
      id: "crunches", 
      name: "Crunches", 
      description: "Boost your endurance with this heart-pumping cardio session.",
      icon: Heart,
      colorScheme: {
        border: "border-green-500",
        bg: "from-green-900/20 to-green-800/10",
        iconBg: "bg-green-500",
        glow: "shadow-green-500/20"
      }
    },
    { 
      id: "jumping-jacks", 
      name: "Jumping Jacks", 
      description: "Focus on building strength and power.",
      icon: Users,
      colorScheme: {
        border: "border-purple-500",
        bg: "from-purple-900/20 to-purple-800/10",
        iconBg: "bg-purple-500",
        glow: "shadow-purple-500/20"
      }
    },
  ];

  const handleWorkoutClick = (workoutId: string) => {
    console.log(`Workout clicked: ${workoutId}`);
    // Navigate to the specific workout page
    switch (workoutId) {
      case 'pushups':
        navigate('/workouts/pushups');
        break;
      case 'crunches':
        navigate('/workouts/crunches');
        break;
      case 'jumping-jacks':
        navigate('/workouts/jumping-jacks');
        break;
      default:
        console.log('Unknown workout:', workoutId);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 text-white flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Uniform Top Banner */}
      <div className="w-full fixed top-0 left-0 z-50">
        <div className="flex items-center justify-between bg-gradient-to-r from-[#6b1b1b] to-black h-10 px-4 shadow-md">
          <button 
            onClick={() => navigate('/')} 
            className="flex items-center text-white hover:text-red-400 font-semibold text-sm"
          >
            <ArrowLeft className="w-5 h-5 mr-1" /> Back
          </button>
          <div className="flex-1 flex justify-center">
            <span className="text-red-400 font-bold text-lg">Workouts</span>
          </div>
          <div className="w-16" /> {/* Spacer for symmetry */}
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-16 w-full h-full flex-1 flex flex-col items-center justify-center max-w-4xl">
        <motion.h1 
          className="text-4xl md:text-5xl font-bold mb-12 text-center text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          Choose Your Workout
        </motion.h1>
        
        {/* Workout Cards - Arranged vertically like slabs */}
        <div className="w-full space-y-6 max-w-3xl">
          {workouts.map((workout, index) => {
            const IconComponent = workout.icon;
            return (
              <motion.div
                key={workout.id}
                className={`
                  relative bg-gradient-to-r ${workout.colorScheme.bg} 
                  border-2 ${workout.colorScheme.border} 
                  rounded-2xl p-8 cursor-pointer 
                  hover:scale-[1.02] hover:${workout.colorScheme.glow} 
                  transition-all duration-300 ease-in-out 
                  shadow-xl backdrop-blur-sm
                  min-h-[120px] flex items-center
                `}
                onClick={() => handleWorkoutClick(workout.id)}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Icon Container */}
                <div className={`
                  ${workout.colorScheme.iconBg} 
                  rounded-xl p-4 mr-6 flex-shrink-0
                  shadow-lg
                `}>
                  <IconComponent className="w-8 h-8 text-white" />
                </div>
                
                {/* Content */}
                <div className="flex-1">
                  <h2 className="text-2xl md:text-3xl font-bold mb-2 text-white">
                    {workout.name}
                  </h2>
                  <p className="text-gray-300 text-lg leading-relaxed">
                    {workout.description}
                  </p>
                </div>
                
                {/* Subtle glow effect */}
                <div className={`
                  absolute inset-0 rounded-2xl 
                  bg-gradient-to-r ${workout.colorScheme.bg} 
                  opacity-0 hover:opacity-10 
                  transition-opacity duration-300
                `} />
              </motion.div>
            );
          })}
        </div>
        
      {workouts.length === 0 && (
          <motion.p 
            className="text-center text-gray-400 text-xl mt-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            (No workouts available yet - stay tuned!)
          </motion.p>
      )}
      </div>
    </div>
  );
};

export default Workouts; 