import React from 'react';

const Workouts: React.FC = () => {
  // Placeholder for workouts data - replace with actual data source
  const workouts = [
    { id: "full-body-blast", name: "Full Body Blast", description: "A high-intensity workout targeting all major muscle groups." },
    { id: "cardio-king", name: "Cardio King", description: "Boost your endurance with this heart-pumping cardio session." },
    { id: "strength-builder", name: "Strength Builder", description: "Focus on building strength and power." },
  ];

  const handleWorkoutClick = (workoutId: string) => {
    console.log(`Workout clicked: ${workoutId}`);
    // Placeholder for navigation or starting workout logic
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-4xl font-bold mb-10 text-center text-red-500">Choose Your Workout</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {workouts.map((workout) => (
          <div
            key={workout.id}
            className="bg-gray-800 p-6 rounded-xl shadow-2xl cursor-pointer hover:shadow-red-500/50 transition-shadow duration-300 ease-in-out transform hover:-translate-y-1"
            onClick={() => handleWorkoutClick(workout.id)}
          >
            <h2 className="text-2xl font-semibold mb-3 text-red-400">{workout.name}</h2>
            <p className="text-gray-400">{workout.description}</p>
          </div>
        ))}
      </div>
      {workouts.length === 0 && (
        <p className="text-center text-gray-500 text-xl">(No workouts available yet - stay tuned!)</p>
      )}
    </div>
  );
};

export default Workouts; 